// @vitest-environment happy-dom

/* eslint-disable @typescript-eslint/unbound-method */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { Code, ConnectError } from '@connectrpc/connect';

import {
  dialWebRTC,
  dialDirect,
  validateDialOptions,
  AuthenticatedTransport,
} from '../dial';

import {
  TEST_URL,
  TEST_HOST,
  withAccessToken,
  withCredentials,
  withSignalingAccessToken,
  withSignalingCredentials,
} from '../__fixtures__/dial-options';

import {
  createMockPeerConnection,
  createMockDataChannel,
} from '../../__mocks__/webrtc';
import { withICEServers } from '../__fixtures__/dial-webrtc-options';
import { createMockTransport } from '../../__mocks__/transports';
import { createMockSignalingExchange } from '../__mocks__/signaling-exchanges';
import { ClientChannel } from '../client-channel';

vi.mock('../peer');
vi.mock('../signaling-exchange');
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
import { newPeerConnectionForClient } from '../peer';
import { SignalingExchange } from '../signaling-exchange';

const setupDialWebRTCMocks = () => {
  const peerConnection = createMockPeerConnection();
  const dataChannel = createMockDataChannel();
  const transport = createMockTransport();
  const signalingExchange = createMockSignalingExchange(transport);

  vi.mocked(newPeerConnectionForClient).mockResolvedValue({
    pc: peerConnection,
    dc: dataChannel,
  });

  vi.mocked(SignalingExchange).mockImplementation(() => signalingExchange);

  const optionalWebRTCConfigFn = vi.fn().mockResolvedValue({
    config: {
      additionalIceServers: [],
      disableTrickle: false,
    },
  });

  vi.mocked(createClient).mockReturnValue({
    optionalWebRTCConfig: optionalWebRTCConfigFn,
  } as unknown as ReturnType<typeof createClient>);

  vi.mocked(createGrpcWebTransport).mockReturnValue(transport);

  return {
    peerConnection,
    dataChannel,
    transport,
    signalingExchange,
  };
};

describe('dialWebRTC', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('timeout handling', () => {
    it('should clear exchange terminate timeout on successful connection', async () => {
      // Arrange
      vi.useFakeTimers();
      const { peerConnection, signalingExchange } = setupDialWebRTCMocks();
      const dialTimeout = 5000;

      // Act
      const promise = dialWebRTC(TEST_URL, TEST_HOST, { dialTimeout });
      await vi.advanceTimersByTimeAsync(100);
      await promise;
      await vi.advanceTimersByTimeAsync(10_000);

      // Assert
      expect(vi.mocked(signalingExchange.terminate)).not.toHaveBeenCalled();
      expect(vi.mocked(peerConnection.close)).not.toHaveBeenCalled();
    });

    it('should clear exchange terminate timeout on connection error', async () => {
      // Arrange
      vi.useFakeTimers();
      const { peerConnection, signalingExchange } = setupDialWebRTCMocks();
      const error = new Error('Connection failed');
      const dialTimeout = 5000;
      vi.mocked(signalingExchange.doExchange).mockRejectedValueOnce(error);

      // Act
      const promise = dialWebRTC(TEST_URL, TEST_HOST, { dialTimeout }).catch(
        (error_: unknown) => error_ as Error
      );
      await vi.advanceTimersByTimeAsync(100);
      const result = await promise;

      // Assert
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Connection failed');
      expect(vi.mocked(peerConnection.close)).toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(10_000);
      expect(vi.mocked(signalingExchange.terminate)).not.toHaveBeenCalled();
    });

    it('should terminate exchange when timeout fires', async () => {
      // Arrange
      vi.useFakeTimers();
      const { peerConnection, dataChannel, signalingExchange } =
        setupDialWebRTCMocks();
      vi.mocked(signalingExchange.doExchange).mockImplementation(
        async () =>
          new Promise<ClientChannel>((resolve) => {
            setTimeout(() => {
              resolve(new ClientChannel(peerConnection, dataChannel));
            }, 10_000);
          })
      );

      // Act
      dialWebRTC(TEST_URL, TEST_HOST, { dialTimeout: 1000 }).catch(() => {
        // Ignore error for this test - we're testing timeout behavior
      });
      await vi.advanceTimersByTimeAsync(1000);

      // Assert
      expect(vi.mocked(signalingExchange.terminate)).toHaveBeenCalledWith(
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
      // Arrange
      vi.useFakeTimers();
      const { signalingExchange } = setupDialWebRTCMocks();

      // Act
      await dialWebRTC(TEST_URL, TEST_HOST, { dialTimeout });
      await vi.advanceTimersByTimeAsync(100_000);

      // Assert
      expect(vi.mocked(signalingExchange.terminate)).not.toHaveBeenCalled();
    });
  });

  describe('signaling address', () => {
    it('should strip trailing slash from signaling address', async () => {
      // Arrange
      setupDialWebRTCMocks();

      // Act
      await dialWebRTC(`${TEST_URL}/`, TEST_HOST);

      // Assert
      expect(createGrpcWebTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: TEST_URL,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should close peer connection on exchange error', async () => {
      // Arrange
      const { peerConnection, signalingExchange } = setupDialWebRTCMocks();
      const error = new Error('Exchange failed');
      vi.mocked(signalingExchange.doExchange).mockRejectedValueOnce(error);

      // Act & Assert
      await expect(dialWebRTC(TEST_URL, TEST_HOST)).rejects.toThrow(
        'Exchange failed'
      );
      expect(vi.mocked(peerConnection.close)).toHaveBeenCalled();
    });

    it('should close peer connection if dialDirect fails', async () => {
      // Arrange
      const { peerConnection, transport } = setupDialWebRTCMocks();
      // First call succeeds (getOptionalWebRTCConfig), second call fails (signaling)
      vi.mocked(createGrpcWebTransport)
        .mockReturnValueOnce(transport)
        .mockImplementationOnce(() => {
          throw new Error('Transport creation failed');
        });

      // Act & Assert
      await expect(dialWebRTC(TEST_URL, TEST_HOST)).rejects.toThrow(
        'Transport creation failed'
      );
      expect(vi.mocked(peerConnection.close)).toHaveBeenCalled();
    });

    it('should rethrow errors after cleanup', async () => {
      // Arrange
      const { signalingExchange } = setupDialWebRTCMocks();
      const error = new ConnectError('Custom error', Code.Internal);
      vi.mocked(signalingExchange.doExchange).mockRejectedValueOnce(error);

      // Act & Assert
      await expect(dialWebRTC(TEST_URL, TEST_HOST)).rejects.toThrow(
        'Custom error'
      );
    });
  });

  describe('configuration', () => {
    it('should pass webrtc options to peer connection', async () => {
      // Arrange
      const { peerConnection, dataChannel } = setupDialWebRTCMocks();
      const { rtcConfig, additionalSdpFields } = withICEServers;

      // Act
      await dialWebRTC(TEST_URL, TEST_HOST, {
        webrtcOptions: {
          disableTrickleICE: true,
          rtcConfig,
          additionalSdpFields,
        },
      });

      // Assert
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
            'rpc-host': TEST_HOST,
          }),
        }),
        peerConnection,
        dataChannel,
        { additionalSdpFields, disableTrickleICE: true, rtcConfig }
      );
    });
  });
});

describe('validateDialOptions', () => {
  it.each([
    { description: 'undefined options', options: undefined },
    { description: 'empty options', options: {} },
    { description: 'accessToken only', options: withAccessToken },
    { description: 'credentials only', options: withCredentials },
    {
      description: 'signalingAccessToken only',
      options: withSignalingAccessToken,
    },
  ])('should not throw for $description', ({ options }) => {
    expect(() => validateDialOptions(options)).not.toThrow();
  });

  it.each([
    {
      description: 'both accessToken and credentials are set',
      options: { ...withAccessToken, ...withCredentials },
      expectedError: 'cannot set credentials with accessToken',
    },
    {
      description: 'both accessToken and signalingAccessToken are set',
      options: { ...withAccessToken, ...withSignalingAccessToken },
      expectedError:
        'cannot set webrtcOptions.signalingAccessToken with accessToken',
    },
    {
      description: 'both accessToken and signalingCredentials are set',
      options: { ...withAccessToken, ...withSignalingCredentials },
      expectedError:
        'cannot set webrtcOptions.signalingCredentials with accessToken',
    },
    {
      description: 'both signalingAccessToken and signalingCredentials are set',
      options: {
        webrtcOptions: {
          disableTrickleICE: false,
          ...withSignalingAccessToken.webrtcOptions,
          ...withSignalingCredentials.webrtcOptions,
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create transport with default options', async () => {
    // Arrange
    const transport = createMockTransport();
    vi.mocked(createGrpcWebTransport).mockReturnValue(transport);

    // Act
    await dialDirect(TEST_URL);

    // Assert
    expect(createGrpcWebTransport).toHaveBeenCalledWith({
      baseUrl: TEST_URL,
      credentials: 'same-origin',
    });
  });

  it('should use "include" credentials when transportCredentialsInclude is true', async () => {
    // Arrange
    const transport = createMockTransport();
    vi.mocked(createGrpcWebTransport).mockReturnValue(transport);

    // Act
    await dialDirect(TEST_URL, undefined, true);

    // Assert
    expect(createGrpcWebTransport).toHaveBeenCalledWith({
      baseUrl: TEST_URL,
      credentials: 'include',
    });
  });

  it('should validate options before creating transport', async () => {
    // Act & Assert
    await expect(
      dialDirect(TEST_URL, { ...withAccessToken, ...withCredentials })
    ).rejects.toThrow('cannot set credentials with accessToken');
  });

  it('should return AuthenticatedTransport when accessToken is provided', async () => {
    // Arrange
    const transport = createMockTransport();
    vi.mocked(createGrpcWebTransport).mockReturnValue(transport);
    const accessToken = 'test-token';

    // Act
    const result = await dialDirect(TEST_URL, { accessToken });

    // Assert
    expect(result).toBeInstanceOf(AuthenticatedTransport);
  });
});
