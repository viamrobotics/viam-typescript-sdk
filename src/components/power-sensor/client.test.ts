// @vitest-environment happy-dom

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { RobotClient } from '../../robot';
import { PowerSensorServiceClient } from '../../gen/component/powersensor/v1/powersensor_pb_service';
import { PowerSensorClient } from './client';

let sensor: PowerSensorClient;
const testPower = { Watts: 0.5 };
const testVoltage = [{ Volts: 1 }, { IsAc: true }];
const testCurrent = [{ Amperes: 1 }, { IsAc: true }];

beforeEach(() => {
  RobotClient.prototype.createServiceClient = vi
    .fn()
    .mockImplementation(() => new PowerSensorServiceClient('mysensor'));

  PowerSensorServiceClient.prototype.getVoltage = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getVolts: () => {
          return {
            Volts: 1,
          };
        },
        getIsAc: () => {
          return {
            IsAc: true,
          };
        },
      });
    });
  PowerSensorServiceClient.prototype.getCurrent = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getAmperes: () => {
          return {
            Amperes: 1,
          };
        },
        getIsAc: () => {
          return {
            IsAc: true,
          };
        },
      });
    });

  PowerSensorServiceClient.prototype.getPower = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getWatts: () => {
          return {
            Watts: 0.5,
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
