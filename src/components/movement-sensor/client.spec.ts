// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Value } from '@bufbuild/protobuf';
import {
  createPromiseClient,
  createRouterTransport,
} from '@connectrpc/connect';
import { GetReadingsResponse } from '../../gen/common/v1/common_pb';
import { MovementSensorService } from '../../gen/component/movementsensor/v1/movementsensor_connect';
import { RobotClient } from '../../robot';
import { MovementSensorClient } from './client';

let sensor: MovementSensorClient;

describe('MovementSensorClient tests', () => {
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(MovementSensorService, {
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
        createPromiseClient(MovementSensorService, mockTransport)
      );

    sensor = new MovementSensorClient(new RobotClient('host'), 'test-sensor');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('get readings', async () => {
    await expect(sensor.getReadings()).resolves.toStrictEqual({
      readings: 'readings',
    });
  });
});
