// @vitest-environment happy-dom

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
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
  describe('event listeners', () => {
    let mockTransport: Transport;

    let mockPeerConnection: RTCPeerConnection;
    let pcAddEventListenerSpy: ReturnType<typeof vi.fn>;
    let pcRemoveEventListenerSpy: ReturnType<typeof vi.fn>;

    let mockDataChannel: RTCDataChannel;
    let dcAddEventListenerSpy: ReturnType<typeof vi.fn>;
    let dcRemoveEventListenerSpy: ReturnType<typeof vi.fn>;

    let client: RobotClient;

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

      mockTransport = createRouterTransport(({ service }) => {
        service(RobotService, {
          resourceNames: () => ({ resources: [] }),
          getOperations: () => ({ operations: [] }),
        });
      });

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
});
