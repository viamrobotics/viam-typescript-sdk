// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient, createRouterTransport } from '@connectrpc/connect';

import { ComponentConfigSchema } from '../../gen/app/v1/robot_pb';
import {
  DiscoverResourcesResponseSchema,
  DiscoveryService,
} from '../../gen/service/discovery/v1/discovery_pb';
import { RobotClient } from '../../robot';
import { DiscoveryClient } from './client';
vi.mock('../../robot');

import { create } from '@bufbuild/protobuf';

const discoveryClientName = 'test-discovery';

let discovery: DiscoveryClient;

const discoveries = create(ComponentConfigSchema, {});

describe('DiscoveryClient Tests', () => {
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(DiscoveryService, {
        discoverResources: () =>
          create(DiscoverResourcesResponseSchema, {
            discoveries: [discoveries],
          }),
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(DiscoveryService, mockTransport));
    discovery = new DiscoveryClient(
      new RobotClient('host'),
      discoveryClientName
    );
  });

  describe('Discovery Resources Tests', () => {
    it('returns resources from a machine', async () => {
      const expected = [discoveries];

      await expect(discovery.discoverResources()).resolves.toStrictEqual(
        expected
      );
    });
  });
});
