// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { RobotClient } from '../client';
import * as rpcModule from '../../rpc';
import { createMockRobotServiceTransport } from './mocks/robot-service';
import {
  TEST_HOST,
  TEST_LOCAL_HOST,
  TEST_SIGNALING_ADDRESS,
} from '../../__tests__/fixtures/test-constants';
import {
  baseDialConfig,
  TEST_DIAL_TIMEOUT_MS,
  TEST_MAX_RETRY_ATTEMPTS,
  TEST_TIMER_ADVANCE_MS,
} from './fixtures/dial-configs';
import {
  createMockDataChannel,
  createMockPeerConnection,
} from '../../__tests__/mocks/webrtc';
import * as errors from '../../__tests__/fixtures/errors';

vi.mock('../../rpc', async () => {
  const actual = await vi.importActual('../../rpc');
  return {
    ...actual,
    dialWebRTC: vi.fn(),
    dialDirect: vi.fn(),
  };
});

const setupClientMocks = () => {
  vi.mocked(rpcModule.dialWebRTC).mockResolvedValue({
    transport: createMockRobotServiceTransport(),
    peerConnection: createMockPeerConnection(),
    dataChannel: createMockDataChannel(),
  });

  return new RobotClient();
};

const setupEventListenerMocks = () => {
  const pcAddEventListener = vi.fn<[string, (event: unknown) => void]>();
  const pcRemoveEventListener = vi.fn<[string, (event: unknown) => void]>();
  const dcAddEventListener = vi.fn<[string, (event: unknown) => void]>();
  const dcRemoveEventListener = vi.fn<[string, (event: unknown) => void]>();

  const peerConnection = createMockPeerConnection(
    vi.fn(),
    pcAddEventListener,
    pcRemoveEventListener,
    'connected'
  );

  const dataChannel = createMockDataChannel(
    vi.fn(),
    dcAddEventListener,
    dcRemoveEventListener,
    'open'
  );

  const transport = createMockRobotServiceTransport();

  vi.mocked(rpcModule.dialWebRTC).mockResolvedValue({
    transport,
    peerConnection,
    dataChannel,
  });

  const client = new RobotClient();

  return {
    client,
    pcAddEventListener,
    pcRemoveEventListener,
    dcAddEventListener,
    dcRemoveEventListener,
    dataChannel,
  };
};

describe('RobotClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('event listeners', () => {
    type EventListenerMocks = ReturnType<typeof setupEventListenerMocks>;

    it.each([
      {
        eventType: 'iceconnectionstatechange',
        getAddSpy: (mocks: EventListenerMocks) => mocks.pcAddEventListener,
        getRemoveSpy: (mocks: EventListenerMocks) =>
          mocks.pcRemoveEventListener,
        description: 'peer connection iceconnectionstatechange',
      },
      {
        eventType: 'close',
        getAddSpy: (mocks: EventListenerMocks) => mocks.dcAddEventListener,
        getRemoveSpy: (mocks: EventListenerMocks) =>
          mocks.dcRemoveEventListener,
        description: 'data channel close',
      },
      {
        eventType: 'track',
        getAddSpy: (mocks: EventListenerMocks) => mocks.pcAddEventListener,
        getRemoveSpy: (mocks: EventListenerMocks) =>
          mocks.pcRemoveEventListener,
        description: 'peer connection track',
      },
    ])(
      'should properly manage $description handlers during reconnection',
      async ({ eventType, getAddSpy, getRemoveSpy }) => {
        // Arrange
        const mocks = setupEventListenerMocks();
        const addSpy = getAddSpy(mocks);
        const removeSpy = getRemoveSpy(mocks);

        await mocks.client.dial({
          ...baseDialConfig,
          host: TEST_HOST,
          signalingAddress: TEST_SIGNALING_ADDRESS,
        });

        // Verify initial handler was added
        const firstCallArgs = addSpy.mock.calls.find(
          (call) => call[0] === eventType
        );
        const firstHandler = firstCallArgs?.[1];
        expect(firstHandler).toBeDefined();

        const firstConnectionCalls = addSpy.mock.calls.filter(
          (call) => call[0] === eventType
        );
        expect(firstConnectionCalls).toHaveLength(1);

        addSpy.mockClear();
        removeSpy.mockClear();

        // Act - reconnect
        await mocks.client.connect();

        // Assert - old handler should be removed before new handler is added
        const removeCallArgs = removeSpy.mock.calls.find(
          (call) => call[0] === eventType
        );
        expect(removeCallArgs).toBeDefined();
        expect(removeCallArgs?.[1]).toBe(firstHandler);

        // Assert - new handler should be added
        const secondCallArgs = addSpy.mock.calls.find(
          (call) => call[0] === eventType
        );
        expect(secondCallArgs).toBeDefined();

        // Assert - only one handler added and one removed during reconnection
        const totalAddCalls = addSpy.mock.calls.filter(
          (call) => call[0] === eventType
        );
        const totalRemoveCalls = removeSpy.mock.calls.filter(
          (call) => call[0] === eventType
        );
        expect(totalAddCalls).toHaveLength(1);
        expect(totalRemoveCalls).toHaveLength(1);
      }
    );

    it('should not accumulate handlers over multiple reconnections', async () => {
      // Arrange
      const mocks = setupEventListenerMocks();

      await mocks.client.dial({
        ...baseDialConfig,
        host: TEST_HOST,
        signalingAddress: TEST_SIGNALING_ADDRESS,
      });

      // Act - perform 5 reconnections
      await mocks.client.connect();
      await mocks.client.connect();
      await mocks.client.connect();
      await mocks.client.connect();
      await mocks.client.connect();

      // Assert
      const iceAddCalls = mocks.pcAddEventListener.mock.calls.filter(
        (call) => call[0] === 'iceconnectionstatechange'
      );
      const iceRemoveCalls = mocks.pcRemoveEventListener.mock.calls.filter(
        (call) => call[0] === 'iceconnectionstatechange'
      );

      expect(iceAddCalls).toHaveLength(6);
      expect(iceRemoveCalls).toHaveLength(5);
      expect(iceAddCalls.length - iceRemoveCalls.length).toBe(1);
    });

    it('should clean up all event handlers when disconnecting', async () => {
      // Arrange
      const mocks = setupEventListenerMocks();

      await mocks.client.dial({
        ...baseDialConfig,
        host: TEST_HOST,
        signalingAddress: TEST_SIGNALING_ADDRESS,
      });

      mocks.pcRemoveEventListener.mockClear();
      mocks.dcRemoveEventListener.mockClear();

      // Act
      await mocks.client.disconnect();

      // Assert
      const iceRemoveCalls = mocks.pcRemoveEventListener.mock.calls.filter(
        (call) => call[0] === 'iceconnectionstatechange'
      );
      const trackRemoveCalls = mocks.pcRemoveEventListener.mock.calls.filter(
        (call) => call[0] === 'track'
      );
      const dcRemoveCalls = mocks.dcRemoveEventListener.mock.calls.filter(
        (call) => call[0] === 'close'
      );

      expect(iceRemoveCalls.length).toBeGreaterThanOrEqual(1);
      expect(trackRemoveCalls.length).toBeGreaterThanOrEqual(1);
      expect(dcRemoveCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('dial error handling', () => {
    interface DisconnectedEvent {
      error?: Error;
    }

    const setupDisconnectedEventCapture = (client: RobotClient) => {
      const events: DisconnectedEvent[] = [];
      client.on('disconnected', (event) => {
        events.push(event as DisconnectedEvent);
      });
      return events;
    };

    it('should return client instance when WebRTC connection succeeds', async () => {
      // Arrange
      const client = setupClientMocks();

      // Act
      const result = await client.dial({
        ...baseDialConfig,
        noReconnect: true,
      });

      // Assert
      expect(result).toBe(client);
    });

    it('should throw error when both WebRTC and gRPC connections fail', async () => {
      // Arrange
      const client = new RobotClient();
      const webrtcError = new Error('WebRTC connection failed');

      vi.mocked(rpcModule.dialWebRTC).mockRejectedValue(webrtcError);

      // Act & Assert
      await expect(
        client.dial({
          ...baseDialConfig,
          noReconnect: true,
        })
      ).rejects.toThrow('Failed to connect via all methods');
    });

    it('should emit DISCONNECTED events for both failures before throwing', async () => {
      // Arrange
      const client = new RobotClient();
      const webrtcError = new Error('WebRTC connection failed');
      const events = setupDisconnectedEventCapture(client);

      vi.mocked(rpcModule.dialWebRTC).mockRejectedValue(webrtcError);

      // Act
      try {
        await client.dial({
          ...baseDialConfig,
          noReconnect: true,
        });
      } catch {
        // Expected to throw
      }

      // Assert
      expect(events.length).toBeGreaterThanOrEqual(2);
      const webrtcEvent = events.find(
        (event) => event.error?.message === 'WebRTC connection failed'
      );
      expect(webrtcEvent).toBeDefined();
      expect(webrtcEvent?.error).toBe(webrtcError);
    });

    it('should emit DISCONNECTED event when gRPC fails and throw', async () => {
      // Arrange
      const client = new RobotClient();
      const events = setupDisconnectedEventCapture(client);

      // Act
      try {
        await client.dial({
          host: TEST_HOST,
          noReconnect: true,
        });
      } catch {
        // Expected to throw
      }

      // Assert
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events[0]).toBeDefined();
      expect(events[0]?.error).toBeInstanceOf(Error);
    });

    it('should include both errors in thrown error cause', async () => {
      // Arrange
      const client = new RobotClient();
      const webrtcError = new Error('WebRTC connection failed');

      vi.mocked(rpcModule.dialWebRTC).mockRejectedValue(webrtcError);

      // Act
      let caughtError: Error | undefined;
      try {
        await client.dial({
          ...baseDialConfig,
          noReconnect: true,
        });
      } catch (error) {
        caughtError = error as Error;
      }

      // Assert
      expect(caughtError).toBeDefined();
      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError!.message).toBe('Failed to connect via all methods');
      expect(caughtError!.cause).toBeDefined();
      expect(Array.isArray(caughtError!.cause)).toBe(true);
      const causes = caughtError!.cause as Error[];
      expect(causes).toHaveLength(2);
      expect(causes[0]).toBe(webrtcError);
      expect(causes[1]).toBeInstanceOf(Error);
    });

    it('should convert non-Error objects to Errors before throwing', async () => {
      // Arrange
      const client = new RobotClient();
      const webrtcError = 'string error';

      vi.mocked(rpcModule.dialWebRTC).mockRejectedValue(webrtcError);

      // Act
      let caughtError: Error | undefined;
      try {
        await client.dial({
          ...baseDialConfig,
          noReconnect: true,
        });
      } catch (error) {
        caughtError = error as Error;
      }

      // Assert
      expect(caughtError).toBeDefined();
      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError!.cause).toBeDefined();
      expect(Array.isArray(caughtError!.cause)).toBe(true);
      const causes = caughtError!.cause as Error[];
      expect(causes.length).toBeGreaterThan(0);
      const [firstCause] = causes;
      expect(firstCause).toBeInstanceOf(Error);
      expect(firstCause?.message).toBe('string error');
    });

    it('should fallback to gRPC when WebRTC fails and emit WebRTC error', async () => {
      // Arrange
      const client = new RobotClient();
      const webrtcError = new Error('WebRTC connection failed');
      const events = setupDisconnectedEventCapture(client);

      vi.mocked(rpcModule.dialWebRTC).mockRejectedValue(webrtcError);
      vi.mocked(rpcModule.dialDirect).mockResolvedValue(
        createMockRobotServiceTransport()
      );

      // Act
      const result = await client.dial({
        ...baseDialConfig,
        host: TEST_LOCAL_HOST,
        noReconnect: true,
      });

      // Assert
      expect(result).toBe(client);
      expect(events.length).toBeGreaterThanOrEqual(1);
      const webrtcEvent = events.find(
        (event) => event.error?.message === 'WebRTC connection failed'
      );
      expect(webrtcEvent).toBeDefined();
    });

    it('should return client instance when only gRPC connection is used', async () => {
      // Arrange
      const client = new RobotClient();
      vi.mocked(rpcModule.dialDirect).mockResolvedValue(
        createMockRobotServiceTransport()
      );

      // Act
      const result = await client.dial({
        host: TEST_LOCAL_HOST,
        noReconnect: true,
      });

      // Assert
      expect(result).toBe(client);
    });

    it('should throw error when only gRPC connection is attempted and fails', async () => {
      // Arrange
      const client = new RobotClient();
      const grpcError = new Error('gRPC connection failed');

      vi.mocked(rpcModule.dialDirect).mockRejectedValue(grpcError);

      // Act & Assert
      await expect(
        client.dial({
          host: TEST_LOCAL_HOST,
          noReconnect: true,
        })
      ).rejects.toThrow('Failed to connect via all methods');
    });

    it('should include only gRPC error when WebRTC is not configured', async () => {
      // Arrange
      const client = new RobotClient();
      const grpcError = new Error('gRPC connection failed');

      vi.mocked(rpcModule.dialDirect).mockRejectedValue(grpcError);

      // Act
      let caughtError: Error | undefined;
      try {
        await client.dial({
          host: TEST_LOCAL_HOST,
          noReconnect: true,
        });
      } catch (error) {
        caughtError = error as Error;
      }

      // Assert
      expect(caughtError).toBeDefined();
      expect(caughtError!.message).toBe('Failed to connect via all methods');
      expect(caughtError!.cause).toBeDefined();
      expect(Array.isArray(caughtError!.cause)).toBe(true);
      const causes = caughtError!.cause as Error[];
      expect(causes).toHaveLength(1);
      expect(causes[0]).toBe(grpcError);
    });
  });

  describe('concurrent dial prevention', () => {
    it('should abort previous dial attempt when a new dial is called', async () => {
      // Arrange
      vi.useFakeTimers();
      const client = new RobotClient();
      const dialWebRTCMock = vi.mocked(rpcModule.dialWebRTC);

      // First call simulates slow connection that would retry
      dialWebRTCMock.mockImplementationOnce(async () => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(errors.createUnavailableError());
          }, TEST_DIAL_TIMEOUT_MS);
        });
      });

      dialWebRTCMock.mockResolvedValueOnce({
        transport: createMockRobotServiceTransport(),
        peerConnection: createMockPeerConnection(),
        dataChannel: createMockDataChannel(),
      });

      // Act - start first dial attempt (will be aborted by second dial)
      void client.dial({
        ...baseDialConfig,
        noReconnect: false,
        reconnectMaxAttempts: TEST_MAX_RETRY_ATTEMPTS,
      });

      await vi.advanceTimersByTimeAsync(TEST_TIMER_ADVANCE_MS);
      const secondDialPromise = client.dial({
        ...baseDialConfig,
        noReconnect: false,
        reconnectMaxAttempts: TEST_MAX_RETRY_ATTEMPTS,
      });

      await vi.runOnlyPendingTimersAsync();

      // Assert - second dial should succeed
      await expect(secondDialPromise).resolves.toBe(client);

      // If both dials ran concurrently, we'd see many more calls due to retries
      // With abort, the first dial stops retrying, so we see fewer calls
      expect(dialWebRTCMock.mock.calls.length).toBeLessThan(10);
    });

    it('should allow sequential dial calls', async () => {
      // Arrange
      vi.useFakeTimers();
      const client = new RobotClient();
      const dialWebRTCMock = vi.mocked(rpcModule.dialWebRTC).mockResolvedValue({
        transport: createMockRobotServiceTransport(),
        peerConnection: createMockPeerConnection(),
        dataChannel: createMockDataChannel(),
      });

      // Act
      const firstResult = await client.dial({
        ...baseDialConfig,
        noReconnect: true,
      });

      const secondResult = await client.dial({
        ...baseDialConfig,
        noReconnect: true,
      });

      // Assert
      expect(firstResult).toBe(client);
      expect(secondResult).toBe(client);
      expect(dialWebRTCMock).toHaveBeenCalledTimes(2);
    });

    it('should abort in-progress dial when disconnect is called', async () => {
      // Arrange
      vi.useFakeTimers();
      const client = new RobotClient();
      const dialWebRTCMock = vi
        .mocked(rpcModule.dialWebRTC)
        .mockImplementation(async () => {
          return new Promise((_, reject) => {
            setTimeout(() => {
              reject(errors.createUnavailableError());
            }, TEST_DIAL_TIMEOUT_MS);
          });
        });

      // Act - store promise and add rejection handler immediately
      const dialPromise = client
        .dial({
          ...baseDialConfig,
          noReconnect: false,
          reconnectMaxAttempts: TEST_MAX_RETRY_ATTEMPTS,
        })
        .catch(() => {
          /* Expected to fail - suppress unhandled rejection */
        });

      await client.disconnect();
      await vi.runAllTimersAsync();
      await dialPromise;

      // Assert - verify that dialWebRTC wasn't called excessively (disconnect should stop retries)
      expect(dialWebRTCMock.mock.calls.length).toBeLessThanOrEqual(
        TEST_MAX_RETRY_ATTEMPTS
      );
    });
  });

  describe('retry logic on error', () => {
    describe('dial() - non-retryable errors', () => {
      it.each([
        { error: errors.createCanceledError(), description: 'Canceled' },
        {
          error: errors.createInvalidArgumentError(),
          description: 'InvalidArgument',
        },
        { error: errors.createNotFoundError(), description: 'NotFound' },
        {
          error: errors.createAlreadyExistsError(),
          description: 'AlreadyExists',
        },
        {
          error: errors.createPermissionDeniedError(),
          description: 'PermissionDenied',
        },
        {
          error: errors.createFailedPreconditionError(),
          description: 'FailedPrecondition',
        },
        { error: errors.createOutOfRangeError(), description: 'OutOfRange' },
        {
          error: errors.createUnimplementedError(),
          description: 'Unimplemented',
        },
        {
          error: errors.createUnauthenticatedError(),
          description: 'Unauthenticated',
        },
        {
          error: errors.createConfigurationError(),
          description: 'configuration error',
        },
        {
          error: errors.createCannotDialError(),
          description: 'cannot dial error',
        },
      ])('should not retry on $description', async ({ error }) => {
        // Arrange
        vi.useFakeTimers();
        const client = new RobotClient();

        const dialWebRTCMock = vi
          .mocked(rpcModule.dialWebRTC)
          .mockRejectedValue(error);

        // Mock dialDirect to also fail immediately to prevent fallback from starting heartbeat
        vi.mocked(rpcModule.dialDirect).mockRejectedValue(error);

        // Act
        const dialPromise = client.dial({
          ...baseDialConfig,
          noReconnect: true,
        });

        // Assert
        await expect(dialPromise).rejects.toThrow();
        expect(dialWebRTCMock).toHaveBeenCalledTimes(1);
      });
    });

    describe('dial() - retryable errors', () => {
      it.each([
        { error: errors.createUnavailableError(), description: 'Unavailable' },
        {
          error: errors.createDeadlineExceededError(),
          description: 'DeadlineExceeded',
        },
        { error: errors.createAbortedError(), description: 'Aborted' },
        { error: errors.createInternalError(), description: 'Internal' },
        { error: errors.createUnknownError(), description: 'Unknown' },
        { error: errors.createNetworkError(), description: 'network error' },
        { error: errors.createTimeoutError(), description: 'timeout error' },
      ])(
        'should retry on $description up to max attempts',
        async ({ error }) => {
          // Arrange
          vi.useFakeTimers();
          const client = new RobotClient();
          const maxAttempts = 3;

          const dialWebRTCMock = vi
            .mocked(rpcModule.dialWebRTC)
            .mockRejectedValue(error);

          // Act
          const dialPromise = client.dial({
            ...baseDialConfig,
            noReconnect: false,
            reconnectMaxAttempts: maxAttempts,
          });

          // Ensure promise rejection is handled to prevent unhandled rejections
          // The backOff library creates internal promises that reject asynchronously
          dialPromise.catch(() => {
            // Expected rejection - handled to prevent unhandled rejection warnings
          });

          // Run timers to allow backOff to complete
          await vi.runAllTimersAsync();

          // Assert - await the rejection to ensure it's handled
          await expect(dialPromise).rejects.toThrow();
          expect(dialWebRTCMock).toHaveBeenCalledTimes(maxAttempts);
        }
      );

      it('should succeed on retry after transient error', async () => {
        // Arrange
        vi.useFakeTimers();
        const client = new RobotClient();

        const dialWebRTCMock = vi
          .mocked(rpcModule.dialWebRTC)
          .mockRejectedValueOnce(errors.createUnavailableError())
          .mockRejectedValueOnce(errors.createUnavailableError())
          .mockResolvedValueOnce({
            transport: createMockRobotServiceTransport(),
            peerConnection: createMockPeerConnection(),
            dataChannel: createMockDataChannel(),
          });

        // Act
        const dialPromise = client.dial({
          ...baseDialConfig,
          noReconnect: false,
          reconnectMaxAttempts: TEST_MAX_RETRY_ATTEMPTS,
        });

        await vi.runAllTimersAsync();

        // Assert
        await expect(dialPromise).resolves.toBeDefined();
        expect(dialWebRTCMock).toHaveBeenCalledTimes(3);
      });
    });

    describe('reconnection - non-retryable errors', () => {
      it.each([
        { error: errors.createCanceledError(), description: 'Canceled' },
        {
          error: errors.createInvalidArgumentError(),
          description: 'InvalidArgument',
        },
        { error: errors.createNotFoundError(), description: 'NotFound' },
        {
          error: errors.createAlreadyExistsError(),
          description: 'AlreadyExists',
        },
        {
          error: errors.createPermissionDeniedError(),
          description: 'PermissionDenied',
        },
        {
          error: errors.createFailedPreconditionError(),
          description: 'FailedPrecondition',
        },
        { error: errors.createOutOfRangeError(), description: 'OutOfRange' },
        {
          error: errors.createUnimplementedError(),
          description: 'Unimplemented',
        },
        {
          error: errors.createUnauthenticatedError(),
          description: 'Unauthenticated',
        },
        {
          error: errors.createConfigurationError(),
          description: 'configuration error',
        },
      ])('should not retry reconnection on $description', async ({ error }) => {
        // Arrange
        vi.useFakeTimers();
        let closeHandler: ((event: Event) => void) | undefined;

        const dcAddEventListener = vi.fn<[string, (event: unknown) => void]>(
          (event: string, handler: (event: unknown) => void) => {
            if (event === 'close') {
              closeHandler = handler as (event: Event) => void;
            }
          }
        );

        const dataChannel = createMockDataChannel(
          vi.fn(),
          dcAddEventListener,
          vi.fn(),
          'open'
        );

        const dialWebRTCMock = vi
          .mocked(rpcModule.dialWebRTC)
          .mockResolvedValueOnce({
            transport: createMockRobotServiceTransport(),
            peerConnection: createMockPeerConnection(),
            dataChannel,
          })
          .mockRejectedValue(error);

        const client = new RobotClient();

        await client.dial({
          ...baseDialConfig,
          noReconnect: false,
          reconnectMaxAttempts: TEST_MAX_RETRY_ATTEMPTS,
        });

        // Reset mock call count after initial connection
        dialWebRTCMock.mockClear();

        // Act - trigger disconnect through data channel close event
        expect(closeHandler).toBeDefined();
        closeHandler!(new Event('close'));

        // Wait for backoff attempts to complete
        await vi.runAllTimersAsync();
        await vi.runOnlyPendingTimersAsync();

        // Assert
        expect(dialWebRTCMock).toHaveBeenCalledTimes(1);
      });
    });

    describe('reconnection - retryable errors', () => {
      it.each([
        { error: errors.createUnavailableError(), description: 'Unavailable' },
        {
          error: errors.createDeadlineExceededError(),
          description: 'DeadlineExceeded',
        },
        { error: errors.createAbortedError(), description: 'Aborted' },
        { error: errors.createInternalError(), description: 'Internal' },
        { error: errors.createUnknownError(), description: 'Unknown' },
      ])(
        'should retry reconnection on $description error',
        async ({ error }) => {
          // Arrange
          vi.useFakeTimers();
          let closeHandler: ((event: Event) => void) | undefined;

          const dcAddEventListener = vi.fn<[string, (event: unknown) => void]>(
            (event: string, handler: (event: unknown) => void) => {
              if (event === 'close') {
                closeHandler = handler as (event: Event) => void;
              }
            }
          );

          const dataChannel = createMockDataChannel(
            vi.fn(),
            dcAddEventListener,
            vi.fn(),
            'open'
          );

          const dialWebRTCMock = vi
            .mocked(rpcModule.dialWebRTC)
            .mockResolvedValueOnce({
              transport: createMockRobotServiceTransport(),
              peerConnection: createMockPeerConnection(),
              dataChannel,
            })
            .mockRejectedValue(error);

          const client = new RobotClient();

          await client.dial({
            ...baseDialConfig,
            noReconnect: false,
            reconnectMaxAttempts: 3,
          });

          // Reset mock call count after initial connection
          dialWebRTCMock.mockClear();

          // Act
          expect(closeHandler).toBeDefined();
          closeHandler!(new Event('close'));

          // Wait for backoff attempts to complete
          await vi.runAllTimersAsync();
          await vi.runOnlyPendingTimersAsync();

          // Assert
          expect(dialWebRTCMock).toHaveBeenCalledTimes(3);
        }
      );

      it('should succeed on reconnection retry after transient error', async () => {
        // Arrange
        vi.useFakeTimers();
        let closeHandler: ((event: Event) => void) | undefined;

        const dcAddEventListener = vi.fn<[string, (event: unknown) => void]>(
          (event: string, handler: (event: unknown) => void) => {
            if (event === 'close') {
              closeHandler = handler as (event: Event) => void;
            }
          }
        );

        const dataChannel = createMockDataChannel(
          vi.fn(),
          dcAddEventListener,
          vi.fn(),
          'open'
        );

        const dialWebRTCMock = vi
          .mocked(rpcModule.dialWebRTC)
          .mockResolvedValueOnce({
            transport: createMockRobotServiceTransport(),
            peerConnection: createMockPeerConnection(),
            dataChannel,
          })
          .mockRejectedValueOnce(errors.createUnavailableError())
          .mockRejectedValueOnce(errors.createUnavailableError())
          .mockRejectedValueOnce(errors.createUnavailableError())
          .mockResolvedValueOnce({
            transport: createMockRobotServiceTransport(),
            peerConnection: createMockPeerConnection(),
            dataChannel,
          });

        const client = new RobotClient();

        await client.dial({
          ...baseDialConfig,
          noReconnect: false,
          reconnectMaxAttempts: 10,
        });

        // Reset mock call count after initial connection
        dialWebRTCMock.mockClear();

        // Act
        expect(closeHandler).toBeDefined();
        closeHandler!(new Event('close'));

        // Wait for reconnection to succeed
        await vi.runAllTimersAsync();
        await vi.runOnlyPendingTimersAsync();

        // Assert
        expect(dialWebRTCMock).toHaveBeenCalledTimes(4);
      });
    });

    describe('WebRTC to gRPC fallback', () => {
      it('should not retry gRPC on non-retryable error after WebRTC fails', async () => {
        // Arrange
        vi.useFakeTimers();
        const client = new RobotClient();

        const dialWebRTCMock = vi
          .mocked(rpcModule.dialWebRTC)
          .mockRejectedValue(errors.createUnavailableError());

        const dialDirectMock = vi
          .mocked(rpcModule.dialDirect)
          .mockRejectedValue(errors.createPermissionDeniedError());

        // Act
        const dialPromise = client.dial({
          host: 'test.local',
          signalingAddress: TEST_SIGNALING_ADDRESS,
          noReconnect: false,
          reconnectMaxAttempts: TEST_MAX_RETRY_ATTEMPTS,
        });

        // Ensure promise rejection is handled to prevent unhandled rejections
        // The backOff library creates internal promises that reject asynchronously
        dialPromise.catch(() => {
          // Expected rejection - handled to prevent unhandled rejection warnings
        });

        // Run timers to allow backOff to complete
        await vi.runAllTimersAsync();

        // Assert - await the rejection to ensure it's handled
        await expect(dialPromise).rejects.toThrow();
        expect(dialWebRTCMock).toHaveBeenCalledTimes(TEST_MAX_RETRY_ATTEMPTS);
        expect(dialDirectMock).toHaveBeenCalledTimes(1);
      });

      it('should retry both WebRTC and gRPC on retryable errors', async () => {
        // Arrange
        vi.useFakeTimers();
        const client = new RobotClient();
        const maxAttempts = 3;

        const dialWebRTCMock = vi
          .mocked(rpcModule.dialWebRTC)
          .mockRejectedValue(errors.createUnavailableError());

        const dialDirectMock = vi
          .mocked(rpcModule.dialDirect)
          .mockRejectedValue(errors.createUnavailableError());

        // Act
        const dialPromise = client.dial({
          host: 'test.local',
          signalingAddress: TEST_SIGNALING_ADDRESS,
          noReconnect: false,
          reconnectMaxAttempts: maxAttempts,
        });

        // Ensure promise rejection is handled to prevent unhandled rejections
        // The backOff library creates internal promises that reject asynchronously
        dialPromise.catch(() => {
          // Expected rejection - handled to prevent unhandled rejection warnings
        });

        // Run timers to allow backOff to complete
        await vi.runAllTimersAsync();

        // Assert - await the rejection to ensure it's handled
        await expect(dialPromise).rejects.toThrow();
        expect(dialWebRTCMock).toHaveBeenCalledTimes(maxAttempts);
        expect(dialDirectMock).toHaveBeenCalledTimes(maxAttempts);
      });
    });
  });
});
