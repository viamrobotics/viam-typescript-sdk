// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { create, fromJson } from '@bufbuild/protobuf';
import { ValueSchema } from '@bufbuild/protobuf/wkt';
import { createClient, createRouterTransport } from '@connectrpc/connect';
import {
  GeometrySchema,
  GetGeometriesResponseSchema,
  GetReadingsResponseSchema,
} from '../../gen/common/v1/common_pb';
import { MovementSensorService } from '../../gen/component/movementsensor/v1/movementsensor_pb';
import { RobotClient } from '../../robot';
import { MovementSensorClient } from './client';

let sensor: MovementSensorClient;

const testGeometries = [create(GeometrySchema, { label: 'test-geometry' })];

describe('MovementSensorClient tests', () => {
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(MovementSensorService, {
        getReadings: () => {
          return create(GetReadingsResponseSchema, {
            readings: {
              readings: fromJson(ValueSchema, 'readings'),
            },
          });
        },
        getGeometries: () => {
          return create(GetGeometriesResponseSchema, { geometries: testGeometries });
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(MovementSensorService, mockTransport));

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
