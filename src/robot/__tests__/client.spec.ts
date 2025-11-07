// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
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
  TEST_SIGNALING_ADDRESS,
} from '../../__fixtures__/test-constants';
import { baseDialConfig } from '../__fixtures__/dial-configs';
import {
  createMockDataChannel,
  createMockPeerConnection,
} from '../../__mocks__/webrtc';

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
        expect(firstCallArgs).toBeDefined();
        const firstHandler = firstCallArgs?.[1];

        addSpy.mockClear();
        removeSpy.mockClear();

        // Act
        await mocks.client.connect();

        // Assert
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
    interface DisconnectedEventCapture {
      events: unknown[];
      setupListener: (client: RobotClient) => void;
    }

    const captureDisconnectedEvents = (): DisconnectedEventCapture => {
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

    it('should throw an error when both WebRTC and gRPC connections fail', async () => {
      // Arrange
      const client = new RobotClient();
      const webrtcError = new Error('WebRTC connection failed');
      const grpcError = new Error('gRPC connection failed');

      vi.mocked(rpcModule.dialWebRTC).mockRejectedValue(webrtcError);
      vi.mocked(rpcModule.dialDirect).mockRejectedValue(grpcError);

      // Act & Assert
      await expect(
        client.dial({
          ...baseDialConfig,
          noReconnect: true,
        })
      ).rejects.toThrow('Failed to connect via all methods');
    });

    it('should emit DISCONNECTED event with error when WebRTC fails', async () => {
      // Arrange
      const client = new RobotClient();
      const webrtcError = new Error('WebRTC connection failed');
      const { events, setupListener } = captureDisconnectedEvents();

      vi.mocked(rpcModule.dialWebRTC).mockRejectedValue(webrtcError);
      setupListener(client);

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

    it('should emit DISCONNECTED event with error when gRPC fails', async () => {
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

    it('should emit DISCONNECTED events even for non-Error objects', async () => {
      // Arrange
      const client = new RobotClient();
      const webrtcError = 'string error';
      const { events, setupListener } = captureDisconnectedEvents();

      vi.mocked(rpcModule.dialWebRTC).mockRejectedValue(webrtcError);
      setupListener(client);

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
      const errorEvent = findEventWithError(events);
      expect(errorEvent).toBeDefined();
      expect((errorEvent as { error: Error }).error).toBeInstanceOf(Error);
    });

    it('should include both errors in the thrown error cause', async () => {
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

    it('should handle non-Error objects thrown from dial methods', async () => {
      // Arrange
      const client = new RobotClient();
      const webrtcError = 'string error';
      const grpcError = { message: 'object error' };

      vi.mocked(rpcModule.dialWebRTC).mockRejectedValue(webrtcError);
      vi.mocked(rpcModule.dialDirect).mockRejectedValue(grpcError);

      // Act & Assert
      await expect(
        client.dial({
          ...baseDialConfig,
          noReconnect: true,
        })
      ).rejects.toThrow('Failed to connect via all methods');
    });

    it('should not throw when WebRTC succeeds', async () => {
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

    it('should not throw when gRPC succeeds after WebRTC fails', async () => {
      // Arrange
      const client = new RobotClient();
      const webrtcError = new Error('WebRTC connection failed');

      vi.mocked(rpcModule.dialWebRTC).mockRejectedValue(webrtcError);
      vi.mocked(rpcModule.dialDirect).mockResolvedValue(
        createMockRobotServiceTransport()
      );

      // Act
      // Use a local host so dialDirect validation passes
      const result = await client.dial({
        host: 'localhost:8080',
        noReconnect: true,
      });

      // Assert
      expect(result).toBe(client);
    });

    it('should not throw when only gRPC dial is attempted (no WebRTC config)', async () => {
      // Arrange
      const client = new RobotClient();
      vi.mocked(rpcModule.dialDirect).mockResolvedValue(
        createMockRobotServiceTransport()
      );

      // Act
      // Use a local host so dialDirect validation passes
      const result = await client.dial({
        host: 'localhost:8080',
        noReconnect: true,
      });

      // Assert
      expect(result).toBe(client);
    });
  });
});
