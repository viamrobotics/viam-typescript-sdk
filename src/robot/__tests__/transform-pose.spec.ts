// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { RobotClient } from '../client';
import * as rpcModule from '../../rpc';
import { createRouterTransport } from '@connectrpc/connect';
import { RobotService } from '../../gen/robot/v1/robot_connect';
import { TransformPoseResponse } from '../../gen/robot/v1/robot_pb';
import { PoseInFrame } from '../../types';
import {
  createMockDataChannel,
  createMockPeerConnection,
} from '../../__tests__/mocks/webrtc';
import { withNoReconnect } from './fixtures/dial-configs';

vi.mock('../../rpc', async () => {
  const actual = await vi.importActual('../../rpc');
  return {
    ...actual,
    dialWebRTC: vi.fn(),
    dialDirect: vi.fn(),
  };
});

describe('transformPose', () => {
  it('works normally without callOptions', async () => {
    const sourcePose = new PoseInFrame({ referenceFrame: 'world' });

    const mockTransport = createRouterTransport(({ service }) => {
      service(RobotService, {
        resourceNames: () => ({ resources: [] }),
        getOperations: () => ({ operations: [] }),
        transformPose: (req) => new TransformPoseResponse({ pose: req.source }),
      });
    });

    vi.mocked(rpcModule.dialWebRTC).mockResolvedValue({
      transport: mockTransport,
      peerConnection: createMockPeerConnection(
        vi.fn(),
        vi.fn(),
        vi.fn(),
        'connected'
      ),
      dataChannel: createMockDataChannel(vi.fn(), vi.fn(), vi.fn(), 'open'),
    });

    const client = new RobotClient();
    await client.dial(withNoReconnect);

    const result = await client.transformPose(sourcePose, 'world', []);
    expect(result).toBeDefined();
  });

  it('passes signal through to the RPC via callOptions', async () => {
    const controller = new AbortController();
    let signalAbortedDuringHandler: boolean | undefined;

    const mockTransport = createRouterTransport(({ service }) => {
      service(RobotService, {
        resourceNames: () => ({ resources: [] }),
        getOperations: () => ({ operations: [] }),
        transformPose: (req, ctx) => {
          // Capture abort state while the RPC is live — Connect aborts its
          // internal linked signal on teardown, so checking after await is too late
          signalAbortedDuringHandler = ctx.signal.aborted;
          return new TransformPoseResponse({ pose: req.source });
        },
      });
    });

    vi.mocked(rpcModule.dialWebRTC).mockResolvedValue({
      transport: mockTransport,
      peerConnection: createMockPeerConnection(
        vi.fn(),
        vi.fn(),
        vi.fn(),
        'connected'
      ),
      dataChannel: createMockDataChannel(vi.fn(), vi.fn(), vi.fn(), 'open'),
    });

    const client = new RobotClient();
    await client.dial(withNoReconnect);

    await client.transformPose(new PoseInFrame(), 'world', [], {
      signal: controller.signal,
    });

    expect(signalAbortedDuringHandler).toBe(false);
  });

  it('rejects when signal is pre-aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    const mockTransport = createRouterTransport(({ service }) => {
      service(RobotService, {
        resourceNames: () => ({ resources: [] }),
        getOperations: () => ({ operations: [] }),
        transformPose: () => new TransformPoseResponse(),
      });
    });

    vi.mocked(rpcModule.dialWebRTC).mockResolvedValue({
      transport: mockTransport,
      peerConnection: createMockPeerConnection(
        vi.fn(),
        vi.fn(),
        vi.fn(),
        'connected'
      ),
      dataChannel: createMockDataChannel(vi.fn(), vi.fn(), vi.fn(), 'open'),
    });

    const client = new RobotClient();
    await client.dial(withNoReconnect);

    await expect(
      client.transformPose(new PoseInFrame(), 'world', [], {
        signal: controller.signal,
      })
    ).rejects.toThrow();
  });
});
