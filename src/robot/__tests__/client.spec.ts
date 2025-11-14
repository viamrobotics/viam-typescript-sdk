// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RobotClient } from '../client';
import * as rpcModule from '../../rpc';
import { createMockRobotServiceTransport } from '../__mocks__/robot-service';
import {
  testCredential,
  differentCredential,
  testAccessToken,
  differentAccessToken,
} from '../../__fixtures__/credentials';
import {
  TEST_HOST,
  TEST_LOCAL_HOST,
  TEST_SIGNALING_ADDRESS,
} from '../../__fixtures__/test-constants';
import { baseDialConfig } from '../__fixtures__/dial-configs';
import {
  createMockDataChannel,
  createMockPeerConnection,
} from '../../__mocks__/webrtc';
import * as errors from '../../__fixtures__/errors';

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
      'should remove old $description handler before adding new one',
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

        const firstCallArgs = addSpy.mock.calls.find(
          (call) => call[0] === eventType
        );
        const firstHandler = firstCallArgs?.[1];

        addSpy.mockClear();
        removeSpy.mockClear();

        // Act
        await mocks.client.connect();

        // Assert
        expect(firstCallArgs).toBeDefined();
        expect(firstHandler).toBeDefined();

        const removeCallArgs = removeSpy.mock.calls.find(
          (call) => call[0] === eventType
        );
        const secondCallArgs = addSpy.mock.calls.find(
          (call) => call[0] === eventType
        );

        expect(removeCallArgs).toBeDefined();
        expect(removeCallArgs?.[1]).toBe(firstHandler);
        expect(secondCallArgs).toBeDefined();
      }
    );

    it.each([
      {
        eventType: 'iceconnectionstatechange',
        getAddSpy: (mocks: EventListenerMocks) => mocks.pcAddEventListener,
        getRemoveSpy: (mocks: EventListenerMocks) =>
          mocks.pcRemoveEventListener,
        description: 'iceconnectionstatechange',
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
        description: 'track',
      },
    ])(
      'should only have one $description handler at a time',
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

        const firstConnectionCalls = addSpy.mock.calls.filter(
          (call) => call[0] === eventType
        );
        expect(firstConnectionCalls).toHaveLength(1);

        // Act
        await mocks.client.connect();

        // Assert
        const totalCalls = addSpy.mock.calls.filter(
          (call) => call[0] === eventType
        );
        const removeCalls = removeSpy.mock.calls.filter(
          (call) => call[0] === eventType
        );

        expect(totalCalls).toHaveLength(2);
        expect(removeCalls).toHaveLength(1);
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

  describe('session management on reconnection', () => {
    it('should reset session when connecting for the first time', async () => {
      // Arrange
      const client = setupClientMocks();
      // eslint-disable-next-line vitest/no-restricted-vi-methods, @typescript-eslint/dot-notation
      const mockResetFn = vi.spyOn(client['sessionManager'], 'reset');

      // Act
      await client.dial({
        host: TEST_HOST,
        signalingAddress: TEST_SIGNALING_ADDRESS,
        credentials: testCredential,
        disableSessions: false,
        noReconnect: true,
      });

      // Assert
      expect(mockResetFn).toHaveBeenCalledTimes(1);
    });

    it.each([
      {
        description:
          'should reset session when credentials change during reconnection',
        initialCreds: testCredential,
        disableSessions: false,
        reconnectCreds: differentCredential,
      },
      {
        description: 'should reset session when sessions are disabled',
        initialCreds: testCredential,
        disableSessions: true,
        reconnectCreds: testCredential,
      },
      {
        description:
          'should reset session when reconnecting with no saved credentials',
        initialCreds: undefined,
        disableSessions: false,
        reconnectCreds: undefined,
      },
      {
        description:
          'should reset session when access token changes during reconnection',
        initialCreds: testAccessToken,
        disableSessions: false,
        reconnectCreds: differentAccessToken,
      },
    ])(
      '$description',
      async ({ initialCreds, disableSessions, reconnectCreds }) => {
        // Arrange
        const client = setupClientMocks();
        // eslint-disable-next-line vitest/no-restricted-vi-methods, @typescript-eslint/dot-notation
        const mockResetFn = vi.spyOn(client['sessionManager'], 'reset');

        await client.dial({
          host: TEST_HOST,
          signalingAddress: TEST_SIGNALING_ADDRESS,
          credentials: initialCreds,
          disableSessions,
          noReconnect: true,
        });

        mockResetFn.mockClear();

        // Act
        await client.connect({ creds: reconnectCreds });

        // Assert
        expect(mockResetFn).toHaveBeenCalledTimes(1);
      }
    );

    it.each([
      {
        description:
          'should NOT reset session when reconnecting with same credentials',
        initialCreds: testCredential,
        reconnectCreds: testCredential,
      },
      {
        description:
          'should NOT reset session when reconnecting without explicitly passing creds (uses savedCreds)',
        initialCreds: testCredential,
        reconnectCreds: undefined,
      },
      {
        description:
          'should NOT reset session when using access token and reconnecting with same token',
        initialCreds: testAccessToken,
        reconnectCreds: testAccessToken,
      },
    ])('$description', async ({ initialCreds, reconnectCreds }) => {
      // Arrange
      const client = setupClientMocks();
      // eslint-disable-next-line vitest/no-restricted-vi-methods, @typescript-eslint/dot-notation
      const mockResetFn = vi.spyOn(client['sessionManager'], 'reset');

      await client.dial({
        host: TEST_HOST,
        signalingAddress: TEST_SIGNALING_ADDRESS,
        credentials: initialCreds,
        disableSessions: false,
        noReconnect: true,
      });

      mockResetFn.mockClear();

      // Act
      await client.connect({ creds: reconnectCreds });

      // Assert
      expect(mockResetFn).not.toHaveBeenCalled();
    });
  });

  describe('dial error handling', () => {
    const captureDisconnectedEvents = () => {
      const events: unknown[] = [];
      const setupListener = (client: RobotClient) => {
        client.on('disconnected', (event) => {
          events.push(event);
        });
      };
      return { events, setupListener };
    };

    const findEventWithError = (
      events: unknown[],
      errorMessage?: string
    ): unknown => {
      return events.find((event) => {
        if (
          typeof event !== 'object' ||
          event === null ||
          !('error' in event)
        ) {
          return false;
        }
        if (errorMessage === undefined || errorMessage === '') {
          return true;
        }
        const { error } = event as { error: Error };
        return error.message === errorMessage;
      });
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
      const { events, setupListener } = captureDisconnectedEvents();

      setupListener(client);
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
      const webrtcEvent = findEventWithError(
        events,
        'WebRTC connection failed'
      );
      expect(webrtcEvent).toBeDefined();
      expect(webrtcEvent).toMatchObject({ error: webrtcError });
    });

    it('should emit DISCONNECTED event when gRPC fails and throw', async () => {
      // Arrange
      const client = new RobotClient();
      const { events, setupListener } = captureDisconnectedEvents();

      setupListener(client);

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
      const errorEvent = findEventWithError(events);
      expect(errorEvent).toBeDefined();
      expect((errorEvent as { error: Error }).error).toBeInstanceOf(Error);
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
      const { events, setupListener } = captureDisconnectedEvents();

      setupListener(client);
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
      const webrtcEvent = findEventWithError(
        events,
        'WebRTC connection failed'
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
  });

  describe('retry logic', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('dial() - non-retryable errors', () => {
      it.each([
        { error: errors.canceledError, description: 'Canceled' },
        { error: errors.invalidArgumentError, description: 'InvalidArgument' },
        { error: errors.notFoundError, description: 'NotFound' },
        { error: errors.alreadyExistsError, description: 'AlreadyExists' },
        {
          error: errors.permissionDeniedError,
          description: 'PermissionDenied',
        },
        {
          error: errors.failedPreconditionError,
          description: 'FailedPrecondition',
        },
        { error: errors.outOfRangeError, description: 'OutOfRange' },
        { error: errors.unimplementedError, description: 'Unimplemented' },
        { error: errors.unauthenticatedError, description: 'Unauthenticated' },
        {
          error: errors.configurationError,
          description: 'configuration error',
        },
        { error: errors.cannotDialError, description: 'cannot dial error' },
      ])('should not retry on $description', async ({ error }) => {
        // Arrange
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
        { error: errors.unavailableError, description: 'Unavailable' },
        {
          error: errors.deadlineExceededError,
          description: 'DeadlineExceeded',
        },
        { error: errors.abortedError, description: 'Aborted' },
        { error: errors.internalError, description: 'Internal' },
        { error: errors.unknownError, description: 'Unknown' },
        { error: errors.networkError, description: 'network error' },
        { error: errors.timeoutError, description: 'timeout error' },
      ])(
        'should retry on $description up to max attempts',
        async ({ error }) => {
          // Arrange
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
        const client = new RobotClient();

        const dialWebRTCMock = vi
          .mocked(rpcModule.dialWebRTC)
          .mockRejectedValueOnce(errors.unavailableError)
          .mockRejectedValueOnce(errors.unavailableError)
          .mockResolvedValueOnce({
            transport: createMockRobotServiceTransport(),
            peerConnection: createMockPeerConnection(),
            dataChannel: createMockDataChannel(),
          });

        // Act
        const dialPromise = client.dial({
          ...baseDialConfig,
          noReconnect: false,
          reconnectMaxAttempts: 5,
        });

        await vi.runAllTimersAsync();

        // Assert
        await expect(dialPromise).resolves.toBeDefined();
        expect(dialWebRTCMock).toHaveBeenCalledTimes(3);
      });
    });

    describe('reconnection - non-retryable errors', () => {
      it.each([
        { error: errors.canceledError, description: 'Canceled' },
        { error: errors.invalidArgumentError, description: 'InvalidArgument' },
        { error: errors.notFoundError, description: 'NotFound' },
        { error: errors.alreadyExistsError, description: 'AlreadyExists' },
        {
          error: errors.permissionDeniedError,
          description: 'PermissionDenied',
        },
        {
          error: errors.failedPreconditionError,
          description: 'FailedPrecondition',
        },
        { error: errors.outOfRangeError, description: 'OutOfRange' },
        { error: errors.unimplementedError, description: 'Unimplemented' },
        { error: errors.unauthenticatedError, description: 'Unauthenticated' },
        {
          error: errors.configurationError,
          description: 'configuration error',
        },
      ])('should not retry reconnection on $description', async ({ error }) => {
        // Arrange
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
          reconnectMaxAttempts: 5,
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
        { error: errors.unavailableError, description: 'Unavailable' },
        {
          error: errors.deadlineExceededError,
          description: 'DeadlineExceeded',
        },
        { error: errors.abortedError, description: 'Aborted' },
        { error: errors.internalError, description: 'Internal' },
        { error: errors.unknownError, description: 'Unknown' },
      ])(
        'should retry reconnection on $description error',
        async ({ error }) => {
          // Arrange
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
          .mockRejectedValueOnce(errors.unavailableError)
          .mockRejectedValueOnce(errors.unavailableError)
          .mockRejectedValueOnce(errors.unavailableError)
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
        const client = new RobotClient();

        const dialWebRTCMock = vi
          .mocked(rpcModule.dialWebRTC)
          .mockRejectedValue(errors.unavailableError);

        const dialDirectMock = vi
          .mocked(rpcModule.dialDirect)
          .mockRejectedValue(errors.permissionDeniedError);

        // Act
        const dialPromise = client.dial({
          host: 'test.local',
          signalingAddress: TEST_SIGNALING_ADDRESS,
          noReconnect: false,
          reconnectMaxAttempts: 5,
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
        expect(dialWebRTCMock).toHaveBeenCalledTimes(5);
        expect(dialDirectMock).toHaveBeenCalledTimes(1);
      });

      it('should retry both WebRTC and gRPC on retryable errors', async () => {
        // Arrange
        const client = new RobotClient();
        const maxAttempts = 3;

        const dialWebRTCMock = vi
          .mocked(rpcModule.dialWebRTC)
          .mockRejectedValue(errors.unavailableError);

        const dialDirectMock = vi
          .mocked(rpcModule.dialDirect)
          .mockRejectedValue(errors.unavailableError);

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
