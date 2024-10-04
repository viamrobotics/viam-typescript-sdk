// @vitest-environment happy-dom

import {
  ConnectError,
  createRouterTransport,
  type Transport,
} from '@connectrpc/connect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RobotService } from '../gen/robot/v1/robot_connect';
import { GetOperationsResponse } from '../gen/robot/v1/robot_pb';
import GRPCConnectionManager from './grpc-connection-manager';
vi.mock('../gen/robot/v1/robot_pb_service');

let mockTransport: Transport;
let cm: GRPCConnectionManager;

describe('GPRCConnectionManager', () => {
  const onDisconnect = vi.fn();

  beforeEach(() => {
    cm = new GRPCConnectionManager(() => mockTransport, onDisconnect);
    vi.mock('./gen/robot/v1/robot_pb_service');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('no connecting attempt initially', () => {
    expect(cm.connecting).toBe(undefined);
  });

  it('connect successfully', async () => {
    // eslint-disable-next-line vitest/no-restricted-vi-methods
    const heartbeat = vi.spyOn(cm, 'heartbeat');
    mockTransport = createRouterTransport(({ service }) => {
      service(RobotService, {
        getOperations: () => {
          return new GetOperationsResponse();
        },
      });
    });

    await expect(cm.start()).resolves.toBe(undefined);
    expect(heartbeat).toHaveBeenCalledOnce();
  });

  it('check connection when not connected', async () => {
    // eslint-disable-next-line vitest/no-restricted-vi-methods
    const heartbeat = vi.spyOn(cm, 'heartbeat');
    mockTransport = createRouterTransport(({ service }) => {
      service(RobotService, {
        getOperations: () => {
          throw ConnectError.from(new Error('not connected'));
        },
      });
    });
    await expect(cm.start()).rejects.toThrow(
      ConnectError.from(new Error('not connected'))
    );
    expect(heartbeat).not.toHaveBeenCalled();
  });

  it('successfully detect connection and then disconnect', async () => {
    // eslint-disable-next-line vitest/no-restricted-vi-methods
    const heartbeat = vi.spyOn(cm, 'heartbeat');
    let once = false;
    mockTransport = createRouterTransport(({ service }) => {
      service(RobotService, {
        getOperations: () => {
          if (!once) {
            once = true;
            return new GetOperationsResponse();
          }
          throw ConnectError.from(new Error('disconnected'));
        },
      });
    });
    await expect(cm.start()).resolves.toBe(undefined);
    await delay(250);
    expect(heartbeat).toHaveBeenCalledOnce();
    expect(onDisconnect).toHaveBeenCalled();
  });
});

const delay = async (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
