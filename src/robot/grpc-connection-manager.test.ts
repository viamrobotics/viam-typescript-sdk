// @vitest-environment happy-dom

import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { events } from '../events';
import { RobotServiceClient } from '../gen/robot/v1/robot_pb_service';
vi.mock('../gen/robot/v1/robot_pb_service');
import GRPCConnectionManager from './grpc-connection-manager';

const host = 'fakeServiceHsot';
const transport = new FakeTransportBuilder().build();

let cm: GRPCConnectionManager;

describe('GPRCConnectionManager', () => {
  beforeEach(() => {
    cm = new GRPCConnectionManager(host, transport);
    vi.mock('./gen/robot/v1/robot_pb_service');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('no connecting attempt initially', () => {
    expect(cm.connecting).toBe(undefined);
  });

  test('connect successfully', async () => {
    const heartbeat = vi.spyOn(cm, 'heartbeat');
    RobotServiceClient.prototype.getOperations = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {});
      });

    await expect(cm.start()).resolves.toBe(undefined);
    expect(heartbeat).toHaveBeenCalledOnce();
  });

  test('check connection when not connected', async () => {
    const heartbeat = vi.spyOn(cm, 'heartbeat');
    RobotServiceClient.prototype.getOperations = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(new Error('not connected'), null);
      });
    await expect(cm.start()).rejects.toThrow(new Error('not connected'));
    expect(heartbeat).not.toHaveBeenCalled();
  });

  test('successfully detect connection and then disconnect', async () => {
    const heartbeat = vi.spyOn(cm, 'heartbeat');
    const disconnected = vi.spyOn(events, 'emit');
    RobotServiceClient.prototype.getOperations = vi
      .fn()
      .mockImplementationOnce((_req, _md, cb) => {
        cb(null, {});
      })
      .mockImplementation((_req, _md, cb) => {
        cb(new Error('disconnected'), null);
      });
    await expect(cm.start()).resolves.toBe(undefined);
    expect(heartbeat).toHaveBeenCalledOnce();
    expect(disconnected).toHaveBeenCalledWith('disconnected', {});
  });
});
