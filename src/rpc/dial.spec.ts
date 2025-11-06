// @vitest-environment happy-dom

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { Transport } from '@connectrpc/connect';
import { Code, ConnectError } from '@connectrpc/connect';

// Mock external modules before importing the module under test
vi.mock('./peer');
vi.mock('./signaling-exchange');
vi.mock('@connectrpc/connect', async () => {
  const actual = await vi.importActual('@connectrpc/connect');
  return {
    ...actual,
    createClient: vi.fn(),
  };
});
vi.mock('@connectrpc/connect-web', () => ({
  createGrpcWebTransport: vi.fn(),
}));

import { createClient } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { newPeerConnectionForClient } from './peer';
import { SignalingExchange } from './signaling-exchange';
import {
  dialWebRTC,
  dialDirect,
  validateDialOptions,
  AuthenticatedTransport,
} from './dial';

describe('dialWebRTC', () => {
  let mockPeerConnection: RTCPeerConnection;
  let mockDataChannel: RTCDataChannel;
  let mockTransport: Transport;
  let mockExchange: SignalingExchange;
  let mockCreateClient: ReturnType<typeof vi.fn>;

  let mockPeerConnectionClose: ReturnType<typeof vi.fn>;
  let mockExchangeDoExchange: ReturnType<typeof vi.fn>;
  let mockExchangeTerminate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();

    mockPeerConnectionClose = vi.fn();
    const addEventListenerFn = vi.fn();
    const removeEventListenerFn = vi.fn();
    mockPeerConnection = {
      close: mockPeerConnectionClose,
      addEventListener: addEventListenerFn,
      removeEventListener: removeEventListenerFn,
    } as unknown as RTCPeerConnection;

    const dcAddEventListenerFn = vi.fn();
    const dcRemoveEventListenerFn = vi.fn();
    mockDataChannel = {
      addEventListener: dcAddEventListenerFn,
      removeEventListener: dcRemoveEventListenerFn,
    } as unknown as RTCDataChannel;

    const unaryFn = vi.fn();
    const streamFn = vi.fn();
    mockTransport = {
      unary: unaryFn,
      stream: streamFn,
    } as unknown as Transport;

    mockExchangeDoExchange = vi.fn().mockResolvedValue(mockTransport);
    mockExchangeTerminate = vi.fn();
    mockExchange = {
      doExchange: mockExchangeDoExchange,
      terminate: mockExchangeTerminate,
    } as unknown as SignalingExchange;

    vi.mocked(newPeerConnectionForClient).mockResolvedValue({
      pc: mockPeerConnection,
      dc: mockDataChannel,
    });

    vi.mocked(SignalingExchange).mockImplementation(() => mockExchange);

    const optionalWebRTCConfigFn = vi.fn().mockResolvedValue({
      config: {
        additionalIceServers: [],
        disableTrickle: false,
      },
    });

    mockCreateClient = vi.fn().mockReturnValue({
      optionalWebRTCConfig: optionalWebRTCConfigFn,
    });

    vi.mocked(createClient).mockImplementation(mockCreateClient as never);
    vi.mocked(createGrpcWebTransport).mockReturnValue(mockTransport);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('timeout handling', () => {
    it('should clear exchange terminate timeout on successful connection', async () => {
      const promise = dialWebRTC('http://test.local', 'test-host', {
        dialTimeout: 5000,
      });

      await vi.advanceTimersByTimeAsync(100);
      await promise;
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockExchangeTerminate).not.toHaveBeenCalled();
      expect(mockPeerConnectionClose).not.toHaveBeenCalled();
    });

    it('should clear exchange terminate timeout on connection error', async () => {
      const error = new Error('Connection failed');

      mockExchangeDoExchange.mockRejectedValueOnce(error);

      const promise = dialWebRTC('http://test.local', 'test-host', {
        dialTimeout: 5000,
      }).catch((error_: unknown) => error_ as Error);

      await vi.advanceTimersByTimeAsync(100);
      const result = await promise;

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Connection failed');
      expect(mockPeerConnectionClose).toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockExchangeTerminate).not.toHaveBeenCalled();
    });

    it('should terminate exchange when timeout fires', async () => {
      const doExchangeFn = vi.fn().mockImplementation(
        async () =>
          new Promise<Transport>((resolve) => {
            setTimeout(() => {
              resolve(mockTransport);
            }, 10_000);
          })
      );

      mockExchangeDoExchange.mockImplementation(doExchangeFn);

      dialWebRTC('http://test.local', 'test-host', {
        dialTimeout: 1000,
      }).catch(() => {
        // Ignore error for this test - we're testing timeout behavior
      });

      await vi.advanceTimersByTimeAsync(1000);

      expect(mockExchangeTerminate).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'timed out',
        })
      );
    });

    it.each([
      { dialTimeout: 0, description: 'when dialTimeout is 0' },
      { dialTimeout: -1000, description: 'when dialTimeout is negative' },
      { dialTimeout: undefined, description: 'when dialTimeout is undefined' },
    ])('should not set timeout $description', async ({ dialTimeout }) => {
      await dialWebRTC('http://test.local', 'test-host', {
        dialTimeout,
      });

      await vi.advanceTimersByTimeAsync(100_000);

      expect(mockExchangeTerminate).not.toHaveBeenCalled();
    });
  });

  describe('signaling address', () => {
    it('should strip trailing slash from signaling address', async () => {
      await dialWebRTC('http://test.local/', 'test-host');

      expect(createGrpcWebTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: expect.stringMatching(/^http:\/\/test\.local$/u),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should close peer connection on exchange error', async () => {
      const error = new Error('Exchange failed');
      mockExchangeDoExchange.mockRejectedValueOnce(error);

      await expect(
        dialWebRTC('http://test.local', 'test-host')
      ).rejects.toThrow('Exchange failed');

      expect(mockPeerConnectionClose).toHaveBeenCalled();
    });

    it('should close peer connection if dialDirect fails', async () => {
      // First call is for getOptionalWebRTCConfig, second is for signaling
      let callCount = 0;
      vi.mocked(createGrpcWebTransport).mockImplementation(() => {
        callCount += 1;
        if (callCount === 2) {
          throw new Error('Transport creation failed');
        }
        return mockTransport;
      });

      await expect(
        dialWebRTC('http://test.local', 'test-host')
      ).rejects.toThrow('Transport creation failed');

      expect(mockPeerConnectionClose).toHaveBeenCalled();
    });

    it('should rethrow errors after cleanup', async () => {
      const error = new ConnectError('Custom error', Code.Internal);
      mockExchangeDoExchange.mockRejectedValueOnce(error);

      await expect(
        dialWebRTC('http://test.local', 'test-host')
      ).rejects.toThrow('Custom error');
    });
  });

  describe('configuration', () => {
    it('should pass webrtc options to peer connection', async () => {
      const rtcConfig: RTCConfiguration = {
        iceServers: [{ urls: 'stun:test.server.com' }],
      };

      const additionalSdpFields = {
        'custom-field': 'custom-value',
        'another-field': 123,
      };

      await dialWebRTC('http://test.local', 'test-host', {
        webrtcOptions: {
          disableTrickleICE: true,
          rtcConfig,
          additionalSdpFields,
        },
      });

      expect(newPeerConnectionForClient).toHaveBeenCalledWith(
        true,
        expect.objectContaining({
          iceServers: expect.arrayContaining([
            expect.objectContaining({ urls: 'stun:test.server.com' }),
          ]),
        }),
        additionalSdpFields
      );

      expect(SignalingExchange).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            'rpc-host': 'test-host',
          }),
        }),
        mockPeerConnection,
        mockDataChannel,
        { additionalSdpFields, disableTrickleICE: true, rtcConfig }
      );
    });
  });
});

describe('validateDialOptions', () => {
  it.each([
    {
      description: 'undefined options',
      options: undefined,
    },
    {
      description: 'empty options',
      options: {},
    },
    {
      description: 'valid accessToken only',
      options: {
        accessToken: 'valid-token',
      },
    },
    {
      description: 'valid credentials only',
      options: {
        credentials: {
          authEntity: 'test-entity',
          type: 'api-key' as const,
          payload: 'key',
        },
      },
    },
    {
      description: 'valid webrtcOptions with signalingAccessToken only',
      options: {
        webrtcOptions: {
          disableTrickleICE: false,
          signalingAccessToken: 'sig-token',
        },
      },
    },
  ])('should not throw for $description', ({ options }) => {
    expect(() => validateDialOptions(options)).not.toThrow();
  });

  it.each([
    {
      description: 'both accessToken and credentials are set',
      options: {
        accessToken: 'token',
        credentials: {
          authEntity: 'test-entity',
          type: 'api-key' as const,
          payload: 'payload',
        },
      },
      expectedError: 'cannot set credentials with accessToken',
    },
    {
      description: 'both accessToken and signalingAccessToken are set',
      options: {
        accessToken: 'token',
        webrtcOptions: {
          disableTrickleICE: false,
          signalingAccessToken: 'sig-token',
        },
      },
      expectedError:
        'cannot set webrtcOptions.signalingAccessToken with accessToken',
    },
    {
      description: 'both accessToken and signalingCredentials are set',
      options: {
        accessToken: 'token',
        webrtcOptions: {
          disableTrickleICE: false,
          signalingCredentials: {
            authEntity: 'test-entity',
            type: 'robot-secret' as const,
            payload: 'payload',
          },
        },
      },
      expectedError:
        'cannot set webrtcOptions.signalingCredentials with accessToken',
    },
    {
      description: 'both signalingAccessToken and signalingCredentials are set',
      options: {
        webrtcOptions: {
          disableTrickleICE: false,
          signalingAccessToken: 'sig-token',
          signalingCredentials: {
            authEntity: 'test-entity',
            type: 'api-key' as const,
            payload: 'key',
          },
        },
      },
      expectedError:
        'cannot set webrtcOptions.signalingCredentials with webrtcOptions.signalingAccessToken',
    },
  ])('should throw when $description', ({ options, expectedError }) => {
    expect(() => validateDialOptions(options)).toThrow(expectedError);
  });
});

describe('dialDirect', () => {
  let mockTransport: Transport;

  beforeEach(() => {
    mockTransport = {
      unary: vi.fn(),
      stream: vi.fn(),
    } as unknown as Transport;

    vi.mocked(createGrpcWebTransport).mockReturnValue(mockTransport);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create transport with default options', async () => {
    await dialDirect('http://test.local');

    expect(createGrpcWebTransport).toHaveBeenCalledWith({
      baseUrl: 'http://test.local',
      credentials: 'same-origin',
    });
  });

  it('should use "include" credentials when transportCredentialsInclude is true', async () => {
    await dialDirect('http://test.local', undefined, true);

    expect(createGrpcWebTransport).toHaveBeenCalledWith({
      baseUrl: 'http://test.local',
      credentials: 'include',
    });
  });

  it('should validate options before creating transport', async () => {
    await expect(
      dialDirect('http://test.local', {
        accessToken: 'token',
        credentials: {
          authEntity: 'test-entity',
          type: 'api-key',
          payload: 'payload',
        },
      })
    ).rejects.toThrow('cannot set credentials with accessToken');
  });

  it('should return AuthenticatedTransport when accessToken is provided', async () => {
    const result = await dialDirect('http://test.local', {
      accessToken: 'test-token',
    });

    expect(result).toBeInstanceOf(AuthenticatedTransport);
  });
});
