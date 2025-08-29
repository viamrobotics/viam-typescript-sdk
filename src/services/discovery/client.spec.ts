// @vitest-environment happy-dom

import { createClient, createRouterTransport } from '@connectrpc/connect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiscoveryService } from '../../gen/service/discovery/v1/discovery_connect';
import { DiscoverResourcesResponse } from '../../gen/service/discovery/v1/discovery_pb';
import { RobotClient } from '../../robot';
import { DiscoveryClient } from './client';
import { ComponentConfig } from '../../gen/app/v1/robot_pb';
vi.mock('../../robot');
vi.mock('../../gen/service/discovery/v1/discovery_pb_service');

const discoveryClientName = 'test-discovery';

let discovery: DiscoveryClient;

const discoveries: ComponentConfig = new ComponentConfig();

describe('DiscoveryClient Tests', () => {
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(DiscoveryService, {
        discoverResources: () =>
          new DiscoverResourcesResponse({ discoveries: [discoveries] }),
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
