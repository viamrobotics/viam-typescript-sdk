// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Value } from '@bufbuild/protobuf';
import { createClient, createRouterTransport } from '@connectrpc/connect';
import {
  Geometry,
  GetGeometriesResponse,
  GetReadingsResponse,
} from '../../gen/common/v1/common_pb';
import { MovementSensorService } from '../../gen/component/movementsensor/v1/movementsensor_connect';
import { RobotClient } from '../../robot';
import { MovementSensorClient } from './client';

let sensor: MovementSensorClient;

const testGeometries = [new Geometry({ label: 'test-geometry' })];

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
        getGeometries: () => {
          return new GetGeometriesResponse({ geometries: testGeometries });
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() =>
        createClient(MovementSensorService, mockTransport)
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

  it('get geometries', async () => {
    await expect(sensor.getGeometries()).resolves.toEqual(testGeometries);
  });
});
