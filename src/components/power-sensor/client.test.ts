// @vitest-environment happy-dom

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { RobotClient } from '../../robot';
import { PowerSensorServiceClient } from '../../gen/component/powersensor/v1/powersensor_pb_service';
import { PowerSensorClient } from './client';

let sensor: PowerSensorClient;
const testVoltage: (number | boolean)[] = [0.5, true];
const testCurrent: (number | boolean)[] = [1, false];
let testPower: 2;

beforeEach(() => {
  RobotClient.prototype.createServiceClient = vi
    .fn()
    .mockImplementation(() => new PowerSensorServiceClient('mysensor'));

  PowerSensorServiceClient.prototype.getVoltage = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getVoltage: () => {
          return {
            testVoltage,
          };
        },
      });
    });
  PowerSensorServiceClient.prototype.getCurrent = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getCurrent: () => {
          return {
            testCurrent,
          };
        },
      });
    });

  PowerSensorServiceClient.prototype.getPower = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getPower: () => {
          return {
            testPower,
          };
        },
      });
    });

  sensor = new PowerSensorClient(new RobotClient('host'), 'test-sensor');
});

afterEach(() => {
  vi.clearAllMocks();
});

test('individual readings', async () => {
  await expect(sensor.getVoltage()).resolves.toStrictEqual(testVoltage);
  await expect(sensor.getCurrent()).resolves.toStrictEqual(testCurrent);
  await expect(sensor.getPower()).resolves.toStrictEqual(testPower);
});

test('get readings', async () => {
  await expect(sensor.getReadings()).resolves.toStrictEqual({
    voltage: testVoltage,
    current: testCurrent,
    power: testPower,
  });
});

test('get readings returns without unimplemented fields', async () => {
  const unimplementedError = new Error('Unimplemented');

  PowerSensorServiceClient.prototype.getVoltage = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(unimplementedError, null);
    });

  await expect(sensor.getVoltage()).rejects.toStrictEqual(unimplementedError);
  await expect(sensor.getReadings()).resolves.toStrictEqual({
    current: testCurrent,
    power: testPower,
  });
});

test('get readings fails on other errors', async () => {
  const unexpectedError = new Error('Jank!');

  PowerSensorServiceClient.prototype.getPower = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(unexpectedError, null);
    });

  await expect(sensor.getPower()).rejects.toStrictEqual(unexpectedError);
  await expect(sensor.getReadings()).rejects.toStrictEqual(unexpectedError);
});
