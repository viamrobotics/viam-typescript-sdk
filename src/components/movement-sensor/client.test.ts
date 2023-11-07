// @vitest-environment happy-dom

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { RobotClient } from '../../robot';
import { MovementSensorServiceClient } from '../../gen/component/movementsensor/v1/movementsensor_pb_service';
import { MovementSensorClient } from './client';

let sensor: MovementSensorClient;

interface Val {
  toJavaScript(): string;
}

const mapVals: Val = {
  toJavaScript: () => {
    return 'readings';
  },
};

beforeEach(() => {
  RobotClient.prototype.createServiceClient = vi
    .fn()
    .mockImplementation(() => new MovementSensorServiceClient('mysensor'));

  MovementSensorServiceClient.prototype.getReadings = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getReadingsMap: () => {
          return {
            entries: () => new Map<string, unknown>([['readings', mapVals]]),
          };
        },
      });
    });

  MovementSensorServiceClient.prototype.getPosition = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, { toObject: () => 'pos' });
    });
  MovementSensorServiceClient.prototype.getLinearVelocity = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getLinearVelocity: () => {
          return {
            toObject: () => 'vel',
          };
        },
      });
    });
  MovementSensorServiceClient.prototype.getLinearAcceleration = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getLinearAcceleration: () => {
          return {
            toObject: () => 'acc',
          };
        },
      });
    });
  MovementSensorServiceClient.prototype.getAngularVelocity = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getAngularVelocity: () => {
          return {
            toObject: () => 'ang',
          };
        },
      });
    });
  MovementSensorServiceClient.prototype.getCompassHeading = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getValue: () => 'comp',
      });
    });
  MovementSensorServiceClient.prototype.getOrientation = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getOrientation: () => {
          return {
            toObject: () => 'ori',
          };
        },
      });
    });

  sensor = new MovementSensorClient(new RobotClient('host'), 'test-sensor');
});

afterEach(() => {
  vi.clearAllMocks();
});

test('individual readings', async () => {
  await expect(sensor.getPosition()).resolves.toStrictEqual('pos');
  await expect(sensor.getLinearVelocity()).resolves.toStrictEqual('vel');
  await expect(sensor.getLinearAcceleration()).resolves.toStrictEqual('acc');
  await expect(sensor.getAngularVelocity()).resolves.toStrictEqual('ang');
  await expect(sensor.getCompassHeading()).resolves.toStrictEqual('comp');
  await expect(sensor.getOrientation()).resolves.toStrictEqual('ori');
});

test('get readings', async () => {
  await expect(sensor.getReadings()).resolves.toStrictEqual({
    readings: 'readings',
  });
});

test('get readings returns without unimplemented fields', async () => {
  const unimplementedError = new Error('Unimplemented');

  MovementSensorServiceClient.prototype.getLinearVelocity = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(unimplementedError, null);
    });

  await expect(sensor.getLinearVelocity()).rejects.toStrictEqual(
    unimplementedError
  );
  await expect(sensor.getReadings()).resolves.toStrictEqual({
    readings: 'readings',
  });
});
