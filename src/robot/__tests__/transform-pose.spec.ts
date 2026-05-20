// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { create } from '@bufbuild/protobuf';
import { createRouterTransport } from '@connectrpc/connect';

import {
  createMockDataChannel,
  createMockPeerConnection,
} from '../../__tests__/mocks/webrtc';
import { PoseInFrameSchema } from '../../gen/common/v1/common_pb';
import {
  RobotService,
  TransformPoseResponseSchema,
} from '../../gen/robot/v1/robot_pb';
import * as rpcModule from '../../rpc';
import { RobotClient } from '../client';
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
    const sourcePose = create(PoseInFrameSchema, { referenceFrame: 'world' });

    const mockTransport = createRouterTransport(({ service }) => {
      service(RobotService, {
        resourceNames: () => ({ resources: [] }),
        getOperations: () => ({ operations: [] }),
        transformPose: (req) =>
          create(TransformPoseResponseSchema, { pose: req.source }),
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
          return create(TransformPoseResponseSchema, { pose: req.source });
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

    await client.transformPose(create(PoseInFrameSchema), 'world', [], {
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
        transformPose: () => create(TransformPoseResponseSchema),
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
      client.transformPose(create(PoseInFrameSchema), 'world', [], {
        signal: controller.signal,
      })
    ).rejects.toThrow();
  });
});
