// @vitest-environment happy-dom

/* eslint-disable @typescript-eslint/unbound-method */

import type { StreamResponse, Transport, UnaryResponse } from '@connectrpc/connect';
import { Code, ConnectError } from '@connectrpc/connect';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMockTransport } from '../../__tests__/mocks/transports';
import { createMockDataChannel, createMockPeerConnection } from '../../__tests__/mocks/webrtc';
import { setDebugLogWriter, type DebugLogEntry } from '../../debug';
import { ClientChannel } from '../client-channel';
import {
  AuthenticatedTransport,
  dialDirect,
  dialWebRTC,
  validateDialOptions,
  wrapTransportWithDebugLogging,
} from '../dial';

import {
  TEST_HOST,
  TEST_URL,
  withAccessToken,
  withCredentials,
  withSignalingAccessToken,
  withSignalingCredentials,
} from './fixtures/dial-options';
import { withICEServers } from './fixtures/dial-webrtc-options';

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

import { DescMethodStreaming, DescMethodUnary, DescService, Message } from '@bufbuild/protobuf';
import { newPeerConnectionForClient } from '../peer';
import { SignalingExchange } from '../signaling-exchange';

const setupDialWebRTCMocks = () => {
  const peerConnection = createMockPeerConnection();
  const dataChannel = createMockDataChannel();
  const transport = createMockTransport();

  vi.mocked(newPeerConnectionForClient).mockResolvedValue({
    pc: peerConnection,
    dc: dataChannel,
  });

  const optionalWebRTCConfigFn = vi.fn().mockResolvedValue({
    config: {
      additionalIceServers: [],
      disableTrickle: false,
    },
  });

  const mockClient = {
    optionalWebRTCConfig: optionalWebRTCConfigFn,
  } as unknown as ReturnType<typeof createClient>;

  vi.mocked(createClient).mockReturnValue(mockClient);
  vi.mocked(createGrpcWebTransport).mockReturnValue(transport);

  const signalingExchange = {
    doExchange: vi.fn().mockResolvedValue(transport),
    terminate: vi.fn(),
  } as unknown as SignalingExchange;

  vi.mocked(SignalingExchange).mockImplementation(() => signalingExchange);

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
      const dialTimeoutMs = 5000;

      // Act
      const promise = dialWebRTC(TEST_URL, TEST_HOST, { dialTimeoutMs });
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
      const dialTimeoutMs = 5000;
      vi.mocked(signalingExchange.doExchange).mockRejectedValueOnce(error);

      // Act
      const promise = dialWebRTC(TEST_URL, TEST_HOST, { dialTimeoutMs }).catch(
        (error_: unknown) => error_ as Error,
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
      const { peerConnection, dataChannel, signalingExchange } = setupDialWebRTCMocks();
      vi.mocked(signalingExchange.doExchange).mockImplementation(
        async () =>
          new Promise<ClientChannel>((resolve) => {
            setTimeout(() => {
              resolve(new ClientChannel(peerConnection, dataChannel));
            }, 10_000);
          }),
      );

      // Act
      dialWebRTC(TEST_URL, TEST_HOST, { dialTimeoutMs: 1000 }).catch(() => {
        // Ignore error for this test - we're testing timeout behavior
      });
      await vi.advanceTimersByTimeAsync(1000);

      // Assert
      expect(vi.mocked(signalingExchange.terminate)).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'timed out',
        }),
      );
    });

    it.each([
      { dialTimeoutMs: 0, description: 'when dialTimeoutMs is 0' },
      { dialTimeoutMs: -1000, description: 'when dialTimeoutMs is negative' },
      {
        dialTimeoutMs: undefined,
        description: 'when dialTimeoutMs is undefined',
      },
    ])('should not set timeout $description', async ({ dialTimeoutMs }) => {
      // Arrange
      vi.useFakeTimers();
      const { signalingExchange } = setupDialWebRTCMocks();

      // Act
      await dialWebRTC(TEST_URL, TEST_HOST, { dialTimeoutMs });
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
        }),
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
      await expect(dialWebRTC(TEST_URL, TEST_HOST)).rejects.toThrow('Exchange failed');
      expect(vi.mocked(peerConnection.close)).toHaveBeenCalled();
    });

    it('should propagate error if transport creation fails', async () => {
      // Arrange
      setupDialWebRTCMocks();
      vi.mocked(createGrpcWebTransport).mockImplementation(() => {
        throw new Error('Transport creation failed');
      });

      // Act & Assert
      await expect(dialWebRTC(TEST_URL, TEST_HOST)).rejects.toThrow('Transport creation failed');
      expect(newPeerConnectionForClient).not.toHaveBeenCalled();
    });

    it('should rethrow errors after cleanup', async () => {
      // Arrange
      const { signalingExchange } = setupDialWebRTCMocks();
      const error = new ConnectError('Custom error', Code.Internal);
      vi.mocked(signalingExchange.doExchange).mockRejectedValueOnce(error);

      // Act & Assert
      await expect(dialWebRTC(TEST_URL, TEST_HOST)).rejects.toThrow('Custom error');
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
        additionalSdpFields,
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
        { additionalSdpFields, disableTrickleICE: true, rtcConfig },
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
      expectedError: 'cannot set webrtcOptions.signalingAccessToken with accessToken',
    },
    {
      description: 'both accessToken and signalingCredentials are set',
      options: { ...withAccessToken, ...withSignalingCredentials },
      expectedError: 'cannot set webrtcOptions.signalingCredentials with accessToken',
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

describe('resource management', () => {
  it('should reuse a single transport for config fetching and signaling', async () => {
    // Arrange
    setupDialWebRTCMocks();

    // Act
    await dialWebRTC(TEST_URL, TEST_HOST);

    // Assert
    expect(createGrpcWebTransport).toHaveBeenCalledTimes(1);
    expect(createGrpcWebTransport).toHaveBeenCalledWith({
      baseUrl: TEST_URL,
      credentials: 'same-origin',
    });
  });

  it('should reuse a single signaling client for config fetching and signaling', async () => {
    // Arrange
    setupDialWebRTCMocks();

    // Act
    await dialWebRTC(TEST_URL, TEST_HOST);

    // Assert
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(expect.anything(), expect.anything());
  });

  it('should not leak transports on successful connection', async () => {
    // Arrange
    const { transport } = setupDialWebRTCMocks();
    const transportCount = { created: 0 };

    vi.mocked(createGrpcWebTransport).mockImplementation(() => {
      transportCount.created += 1;
      return transport;
    });

    // Act
    await dialWebRTC(TEST_URL, TEST_HOST);

    // Assert
    expect(transportCount.created).toBe(1);
  });

  it('should not leak transports on connection failure', async () => {
    // Arrange
    const { transport, signalingExchange } = setupDialWebRTCMocks();
    const transportCount = { created: 0 };

    vi.mocked(createGrpcWebTransport).mockImplementation(() => {
      transportCount.created += 1;
      return transport;
    });

    const error = new Error('Connection failed');
    vi.mocked(signalingExchange.doExchange).mockRejectedValueOnce(error);

    // Act
    await dialWebRTC(TEST_URL, TEST_HOST).catch(() => {
      // Ignore error for this test
    });

    // Assert
    expect(transportCount.created).toBe(1);
  });

  it('should use the same transport reference for both config and signaling', async () => {
    // Arrange
    setupDialWebRTCMocks();
    const capturedTransports: Transport[] = [];

    vi.mocked(createClient).mockImplementation((_service, capturedTransport) => {
      capturedTransports.push(capturedTransport);
      return {
        optionalWebRTCConfig: vi.fn().mockResolvedValue({
          config: {
            additionalIceServers: [],
            disableTrickle: false,
          },
        }),
      } as unknown as ReturnType<typeof createClient>;
    });

    // Act
    await dialWebRTC(TEST_URL, TEST_HOST);

    // Assert
    expect(capturedTransports.length).toBe(1);
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
    await expect(dialDirect(TEST_URL, { ...withAccessToken, ...withCredentials })).rejects.toThrow(
      'cannot set credentials with accessToken',
    );
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

describe('wrapTransportWithDebugLogging', () => {
  const mockService = { typeName: 'test.TestService' } as DescService;
  const mockUnaryMethod = { name: 'TestUnaryMethod' } as DescMethodUnary;
  const mockStreamMethod = { name: 'TestStreamMethod' } as DescMethodStreaming;
  const connectionId = 'test-connection-id';

  const makeStreamResponse = (messages: Message[]): StreamResponse => {
    const gen = function* gen() {
      for (const msg of messages) {
        yield msg;
      }
    };
    return { stream: true, message: gen() } as unknown as StreamResponse;
  };

  // Returns a new empty async generator instance for use as stream input.
  const makeEmptyInput = async function* makeEmptyInput() {
    // no input messages
  };

  afterEach(() => {
    setDebugLogWriter(undefined);
    vi.restoreAllMocks();
  });

  describe('unary', () => {
    it('delegates to the underlying transport with no writer set', async () => {
      // Arrange
      const transport = createMockTransport();
      const mockResponse = {} as UnaryResponse;
      vi.mocked(transport.unary).mockResolvedValue(mockResponse);

      // Act
      const wrapped = wrapTransportWithDebugLogging(transport, connectionId);
      const result = await wrapped.unary(mockUnaryMethod, undefined, undefined, undefined, {});

      // Assert
      expect(result).toBe(mockResponse);
      expect(transport.unary).toHaveBeenCalledOnce();
    });

    it('logs grpc_request then grpc_response on success', async () => {
      // Arrange
      const writer = vi.fn<[DebugLogEntry]>();
      setDebugLogWriter(writer);
      const transport = createMockTransport();
      vi.mocked(transport.unary).mockResolvedValue({} as UnaryResponse);

      // Act
      const wrapped = wrapTransportWithDebugLogging(transport, connectionId);
      await wrapped.unary(mockUnaryMethod, undefined, undefined, undefined, {});

      // Assert
      const events = writer.mock.calls.map(([entry]) => entry.event);
      expect(events).toEqual(['grpc_request', 'grpc_response']);

      const [requestEntry] = writer.mock.calls[0]!;
      expect(requestEntry.connectionId).toBe(connectionId);
      expect(requestEntry.type).toBe('unary');
      expect(requestEntry.method).toBe('test.TestService/TestMethod');

      const [responseEntry] = writer.mock.calls[1]!;
      expect(responseEntry.connectionId).toBe(connectionId);
      expect(responseEntry.error).toBeUndefined();
    });

    it('logs grpc_response with error field and rethrows on failure', async () => {
      // Arrange
      const writer = vi.fn<[DebugLogEntry]>();
      setDebugLogWriter(writer);
      const transport = createMockTransport();
      vi.mocked(transport.unary).mockRejectedValue(new Error('rpc failed'));

      // Act & Assert
      const wrapped = wrapTransportWithDebugLogging(transport, connectionId);
      await expect(
        wrapped.unary(mockUnaryMethod, undefined, undefined, undefined, {}),
      ).rejects.toThrow('rpc failed');

      const [responseEntry] = writer.mock.calls[1]!;
      expect(responseEntry.event).toBe('grpc_response');
      expect(responseEntry.error).toBe('rpc failed');
    });
  });

  describe('stream', () => {
    it('returns the original response object directly when no writer is set', async () => {
      // Arrange
      const transport = createMockTransport();
      const mockResponse = makeStreamResponse([]);
      vi.mocked(transport.stream).mockResolvedValue(mockResponse);

      // Act
      const wrapped = wrapTransportWithDebugLogging(transport, connectionId);
      const result = await wrapped.stream(
        mockStreamMethod,
        undefined,
        undefined,
        undefined,
        makeEmptyInput(),
      );

      // Assert — same object reference proves the short-circuit path was taken
      expect(result).toBe(mockResponse);
    });

    it('logs grpc_request once and grpc_response per message', async () => {
      // Arrange
      const writer = vi.fn<[DebugLogEntry]>();
      setDebugLogWriter(writer);
      const transport = createMockTransport();
      const messages = [{}, {}, {}] as Message[];
      vi.mocked(transport.stream).mockResolvedValue(makeStreamResponse(messages));

      // Act
      const wrapped = wrapTransportWithDebugLogging(transport, connectionId);
      const resp = await wrapped.stream(
        mockStreamMethod,
        undefined,
        undefined,
        undefined,
        makeEmptyInput(),
      );
      for await (const _ of resp.message) {
        /* consume */
      }

      // Assert
      const requestCalls = writer.mock.calls.filter(([entry]) => entry.event === 'grpc_request');
      const responseCalls = writer.mock.calls.filter(([entry]) => entry.event === 'grpc_response');
      expect(requestCalls).toHaveLength(1);
      expect(responseCalls).toHaveLength(3);

      for (const [entry] of responseCalls) {
        expect(entry.connectionId).toBe(connectionId);
        expect(entry.type).toBe('stream');
        expect(entry.error).toBeUndefined();
      }
    });

    it('yields all original messages unchanged', async () => {
      // Arrange
      const writer = vi.fn<[DebugLogEntry]>();
      setDebugLogWriter(writer);
      const transport = createMockTransport();
      const messages = [{ a: 1 }, { a: 2 }] as unknown as Message[];
      vi.mocked(transport.stream).mockResolvedValue(makeStreamResponse(messages));

      // Act
      const wrapped = wrapTransportWithDebugLogging(transport, connectionId);
      const resp = await wrapped.stream(
        mockStreamMethod,
        undefined,
        undefined,
        undefined,
        makeEmptyInput(),
      );
      const received: Message[] = [];
      for await (const msg of resp.message) {
        received.push(msg);
      }

      // Assert
      expect(received).toEqual(messages);
    });

    it('logs grpc_response with error when transport.stream rejects', async () => {
      // Arrange
      const writer = vi.fn<[DebugLogEntry]>();
      setDebugLogWriter(writer);
      const transport = createMockTransport();
      vi.mocked(transport.stream).mockRejectedValue(new Error('stream open failed'));

      // Act & Assert
      const wrapped = wrapTransportWithDebugLogging(transport, connectionId);
      await expect(
        wrapped.stream(mockStreamMethod, undefined, undefined, undefined, makeEmptyInput()),
      ).rejects.toThrow('stream open failed');

      const responseCalls = writer.mock.calls.filter(([entry]) => entry.event === 'grpc_response');
      expect(responseCalls).toHaveLength(1);
      expect(responseCalls[0]![0].error).toBe('stream open failed');
    });

    it('logs grpc_response with error on mid-stream failure', async () => {
      // Arrange
      const writer = vi.fn<[DebugLogEntry]>();
      setDebugLogWriter(writer);
      const transport = createMockTransport();
      const streamError = new Error('mid-stream error');

      const failingMessages = function* failingMessages(): Generator<Message> {
        yield {} as Message;
        yield {} as Message;
        throw streamError;
      };

      vi.mocked(transport.stream).mockResolvedValue({
        stream: true,
        message: failingMessages(),
      } as unknown as StreamResponse);

      // Act
      const wrapped = wrapTransportWithDebugLogging(transport, connectionId);
      const resp = await wrapped.stream(
        mockStreamMethod,
        undefined,
        undefined,
        undefined,
        makeEmptyInput(),
      );

      await expect(async () => {
        for await (const _ of resp.message) {
          /* consume */
        }
      }).rejects.toThrow('mid-stream error');

      // Assert — 2 successful messages + 1 error
      const responseCalls = writer.mock.calls.filter(([entry]) => entry.event === 'grpc_response');
      expect(responseCalls).toHaveLength(3);
      expect(responseCalls[0]![0].error).toBeUndefined();
      expect(responseCalls[1]![0].error).toBeUndefined();
      expect(responseCalls[2]![0].error).toBe('mid-stream error');
    });
  });
});
