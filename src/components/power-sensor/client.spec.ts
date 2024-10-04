// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Value } from '@bufbuild/protobuf';
import {
  createPromiseClient,
  createRouterTransport,
} from '@connectrpc/connect';
import { GetReadingsResponse } from '../../gen/common/v1/common_pb';
import { PowerSensorService } from '../../gen/component/powersensor/v1/powersensor_connect';
import {
  GetCurrentResponse,
  GetPowerResponse,
  GetVoltageResponse,
} from '../../gen/component/powersensor/v1/powersensor_pb';
import { RobotClient } from '../../robot';
import { PowerSensorClient } from './client';

let sensor: PowerSensorClient;
const testPower = 0.5;
const testVoltage = 1.5;
const testCurrent = 1;
const testIsAc = true;

describe('PowerSensorClient tests', () => {
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(PowerSensorService, {
        getVoltage: () => {
          return new GetVoltageResponse({
            volts: testVoltage,
            isAc: testIsAc,
          });
        },
        getCurrent: () => {
          return new GetCurrentResponse({
            amperes: testCurrent,
            isAc: testIsAc,
          });
        },
        getPower: () => {
          return new GetPowerResponse({
            watts: testPower,
          });
        },
        getReadings: () => {
          return new GetReadingsResponse({
            readings: {
              readings: Value.fromJson('readings'),
            },
          });
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() =>
        createPromiseClient(PowerSensorService, mockTransport)
      );

    sensor = new PowerSensorClient(new RobotClient('host'), 'test-sensor');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('individual readings', async () => {
    await expect(sensor.getVoltage()).resolves.toStrictEqual([
      testVoltage,
      testIsAc,
    ]);
    await expect(sensor.getCurrent()).resolves.toStrictEqual([
      testCurrent,
      testIsAc,
    ]);
    await expect(sensor.getPower()).resolves.toStrictEqual(testPower);
  });

  it('get readings', async () => {
    await expect(sensor.getReadings()).resolves.toStrictEqual({
      readings: 'readings',
    });
  });
});
