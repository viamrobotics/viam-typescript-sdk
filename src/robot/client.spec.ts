// @vitest-environment happy-dom

import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import type { Transport } from '@connectrpc/connect';
import { createRouterTransport } from '@connectrpc/connect';
import { RobotService } from '../gen/robot/v1/robot_connect';
import { RobotClient } from './client';
import * as rpcModule from '../rpc';

vi.mock('../rpc', async () => {
  const actual = await vi.importActual('../rpc');
  return {
    ...actual,
    dialWebRTC: vi.fn(),
    dialDirect: vi.fn(),
  };
});

describe('RobotClient', () => {
  let mockTransport: Transport;
  let mockPeerConnection: RTCPeerConnection;
  let mockDataChannel: RTCDataChannel;
  let client: RobotClient;

  beforeEach(() => {
    mockTransport = createRouterTransport(({ service }) => {
      service(RobotService, {
        resourceNames: () => ({ resources: [] }),
        getOperations: () => ({ operations: [] }),
      });
    });

    mockPeerConnection = {
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      iceConnectionState: 'connected',
    } as unknown as RTCPeerConnection;

    mockDataChannel = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      readyState: 'open',
    } as unknown as RTCDataChannel;

    vi.mocked(rpcModule.dialWebRTC).mockResolvedValue({
      transport: mockTransport,
      peerConnection: mockPeerConnection,
      dataChannel: mockDataChannel,
    });

    client = new RobotClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('event listeners', () => {
    let pcAddEventListenerSpy: ReturnType<typeof vi.fn>;
    let pcRemoveEventListenerSpy: ReturnType<typeof vi.fn>;

    let dcAddEventListenerSpy: ReturnType<typeof vi.fn>;
    let dcRemoveEventListenerSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      pcAddEventListenerSpy = vi.fn();
      pcRemoveEventListenerSpy = vi.fn();
      dcAddEventListenerSpy = vi.fn();
      dcRemoveEventListenerSpy = vi.fn();

      mockPeerConnection = {
        close: vi.fn(),
        addEventListener: pcAddEventListenerSpy,
        removeEventListener: pcRemoveEventListenerSpy,
        iceConnectionState: 'connected',
      } as unknown as RTCPeerConnection;

      mockDataChannel = {
        close: vi.fn(),
        addEventListener: dcAddEventListenerSpy,
        removeEventListener: dcRemoveEventListenerSpy,
        readyState: 'open',
      } as unknown as RTCDataChannel;

      vi.mocked(rpcModule.dialWebRTC).mockResolvedValue({
        transport: mockTransport,
        peerConnection: mockPeerConnection,
        dataChannel: mockDataChannel,
      });
    });

    it.each([
      {
        eventType: 'iceconnectionstatechange',
        addSpy: () => pcAddEventListenerSpy,
        removeSpy: () => pcRemoveEventListenerSpy,
        description: 'peer connection iceconnectionstatechange',
      },
      {
        eventType: 'close',
        addSpy: () => dcAddEventListenerSpy,
        removeSpy: () => dcRemoveEventListenerSpy,
        description: 'data channel close',
      },
      {
        eventType: 'track',
        addSpy: () => pcAddEventListenerSpy,
        removeSpy: () => pcRemoveEventListenerSpy,
        description: 'peer connection track',
      },
    ])(
      'should remove old $description handler before adding new one',
      async ({ eventType, addSpy, removeSpy }) => {
        await client.dial({
          host: 'test-host',
          signalingAddress: 'https://test.local',
          disableSessions: true,
          noReconnect: true,
        });

        const firstCallArgs = addSpy().mock.calls.find(
          (call) => call[0] === eventType
        );

        expect(firstCallArgs).toBeDefined();

        const firstHandler = firstCallArgs?.[1];

        addSpy().mockClear();
        removeSpy().mockClear();

        // simulate reconnection
        await client.connect();

        const removeCallArgs = removeSpy().mock.calls.find(
          (call) => call[0] === eventType
        );

        const secondCallArgs = addSpy().mock.calls.find(
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
        addSpy: () => pcAddEventListenerSpy,
        removeSpy: () => pcRemoveEventListenerSpy,
        description: 'iceconnectionstatechange',
      },
      {
        eventType: 'close',
        addSpy: () => dcAddEventListenerSpy,
        removeSpy: () => dcRemoveEventListenerSpy,
        description: 'data channel close',
      },
      {
        eventType: 'track',
        addSpy: () => pcAddEventListenerSpy,
        removeSpy: () => pcRemoveEventListenerSpy,
        description: 'track',
      },
    ])(
      'should only have one $description handler at a time',
      async ({ eventType, addSpy, removeSpy }) => {
        await client.dial({
          host: 'test-host',
          signalingAddress: 'https://test.local',
          disableSessions: true,
          noReconnect: true,
        });

        const firstConnectionCalls = addSpy().mock.calls.filter(
          (call) => call[0] === eventType
        );

        expect(firstConnectionCalls).toHaveLength(1);

        // simulate reconnection
        await client.connect();

        const totalCalls = addSpy().mock.calls.filter(
          (call) => call[0] === eventType
        );
        const removeCalls = removeSpy().mock.calls.filter(
          (call) => call[0] === eventType
        );

        expect(totalCalls).toHaveLength(2);
        expect(removeCalls).toHaveLength(1);
      }
    );

    it('should not accumulate handlers over multiple reconnections', async () => {
      await client.dial({
        host: 'test-host',
        signalingAddress: 'https://test.local',
        disableSessions: true,
        noReconnect: true,
      });

      for (let i = 0; i < 5; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await client.connect();
      }

      const iceAddCalls = pcAddEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'iceconnectionstatechange'
      );
      const iceRemoveCalls = pcRemoveEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'iceconnectionstatechange'
      );

      expect(iceAddCalls).toHaveLength(6);
      expect(iceRemoveCalls).toHaveLength(5);
      expect(iceAddCalls.length - iceRemoveCalls.length).toBe(1);
    });

    it('should clean up all event handlers when disconnecting', async () => {
      await client.dial({
        host: 'test-host',
        signalingAddress: 'https://test.local',
        disableSessions: true,
        noReconnect: true,
      });

      pcRemoveEventListenerSpy.mockClear();
      dcRemoveEventListenerSpy.mockClear();

      await client.disconnect();

      const iceRemoveCalls = pcRemoveEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'iceconnectionstatechange'
      );
      const trackRemoveCalls = pcRemoveEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'track'
      );

      const dcRemoveCalls = dcRemoveEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'close'
      );

      expect(iceRemoveCalls.length).toBeGreaterThanOrEqual(1);
      expect(trackRemoveCalls.length).toBeGreaterThanOrEqual(1);
      expect(dcRemoveCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('session management on reconnection', () => {
    let mockResetFn: MockInstance<[], void>;

    const testCredential = {
      authEntity: 'test-entity',
      type: 'api-key' as const,
      payload: 'test-payload',
    };

    const differentCredential = {
      authEntity: 'different-entity',
      type: 'api-key' as const,
      payload: 'different-payload',
    };

    const accessToken = {
      type: 'access-token' as const,
      payload: 'test-access-token',
    };

    const differentAccessToken = {
      type: 'access-token' as const,
      payload: 'different-access-token',
    };

    beforeEach(() => {
      // Spy on the SessionManager's reset method to verify conditional reset behavior
      // eslint-disable-next-line vitest/no-restricted-vi-methods, @typescript-eslint/dot-notation
      mockResetFn = vi.spyOn(client['sessionManager'], 'reset');
    });

    afterEach(() => {
      mockResetFn.mockRestore();
    });

    it('should reset session when connecting for the first time', async () => {
      await client.dial({
        host: 'test-host',
        signalingAddress: 'https://test.local',
        credentials: testCredential,
        disableSessions: false,
        noReconnect: true,
      });

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
        initialCreds: accessToken,
        disableSessions: false,
        reconnectCreds: differentAccessToken,
      },
    ])(
      '$description',
      async ({ initialCreds, disableSessions, reconnectCreds }) => {
        await client.dial({
          host: 'test-host',
          signalingAddress: 'https://test.local',
          credentials: initialCreds,
          disableSessions,
          noReconnect: true,
        });

        mockResetFn.mockClear();

        await client.connect({ creds: reconnectCreds });

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
        initialCreds: accessToken,
        reconnectCreds: accessToken,
      },
    ])('$description', async ({ initialCreds, reconnectCreds }) => {
      await client.dial({
        host: 'test-host',
        signalingAddress: 'https://test.local',
        credentials: initialCreds,
        disableSessions: false,
        noReconnect: true,
      });

      mockResetFn.mockClear();

      await client.connect({ creds: reconnectCreds });

      expect(mockResetFn).not.toHaveBeenCalled();
    });
  });
});
