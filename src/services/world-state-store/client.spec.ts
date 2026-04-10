// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient, createRouterTransport } from '@connectrpc/connect';

import {
  PoseInFrameSchema,
  PoseSchema,
  TransformSchema,
} from '../../gen/common/v1/common_pb';
import { WorldStateStoreService } from '../../gen/service/worldstatestore/v1/world_state_store_pb';
import {
  GetTransformResponseSchema,
  ListUUIDsResponseSchema,
  StreamTransformChangesResponseSchema,
  TransformChangeType,
} from '../../gen/service/worldstatestore/v1/world_state_store_pb';
import { RobotClient } from '../../robot';
import { WorldStateStoreClient } from './client';
import { transformWithUUID, uuidToString } from './world-state-store';

vi.mock('../../robot');

import { create } from '@bufbuild/protobuf';

const worldStateStoreClientName = 'test-world-state-store';

let worldStateStore: WorldStateStoreClient;

const mockUuids = [new Uint8Array([1, 2, 3, 4]), new Uint8Array([5, 6, 7, 8])];
const mockTransform = create(TransformSchema, {
  referenceFrame: 'test-frame',
  poseInObserverFrame: create(PoseInFrameSchema, {
    referenceFrame: 'observer-frame',
    pose: create(PoseSchema, {
      x: 10,
      y: 20,
      z: 30,
      oX: 0,
      oY: 0,
      oZ: 1,
      theta: 90,
    }),
  }),
  uuid: mockUuids[0],
});

describe('WorldStateStoreClient Tests', () => {
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(WorldStateStoreService, {
        listUUIDs: () => create(ListUUIDsResponseSchema, { uuids: mockUuids }),
        getTransform: () =>
          create(GetTransformResponseSchema, { transform: mockTransform }),
        streamTransformChanges: async function* mockStream() {
          // Add await to satisfy linter
          await Promise.resolve();
          yield create(StreamTransformChangesResponseSchema, {
            changeType: TransformChangeType.ADDED,
            transform: mockTransform,
          });
          yield create(StreamTransformChangesResponseSchema, {
            changeType: TransformChangeType.UPDATED,
            transform: mockTransform,
            updatedFields: { paths: ['pose_in_observer_frame'] },
          });
        },
        doCommand: () => ({ result: { success: true } }),
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() =>
        createClient(WorldStateStoreService, mockTransport)
      );
    worldStateStore = new WorldStateStoreClient(
      new RobotClient('host'),
      worldStateStoreClientName
    );
  });

  describe('listUUIDs', () => {
    it('returns all transform UUIDs', async () => {
      const expected = mockUuids.map((uuid) => uuidToString(uuid));

      await expect(worldStateStore.listUUIDs()).resolves.toStrictEqual(
        expected
      );
    });
  });

  describe('getTransform', () => {
    it('returns a transform by UUID', async () => {
      const uuid = '01020304';
      const expected = mockTransform;

      await expect(worldStateStore.getTransform(uuid)).resolves.toStrictEqual({
        ...expected,
        uuidString: uuid,
      });
    });
  });

  describe('streamTransformChanges', () => {
    it('streams transform changes', async () => {
      const stream = worldStateStore.streamTransformChanges();
      const results = [];

      for await (const result of stream) {
        results.push(result);
      }

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(
        create(StreamTransformChangesResponseSchema, {
          changeType: TransformChangeType.ADDED,
          transform: transformWithUUID(mockTransform),
          updatedFields: undefined,
        })
      );
      expect(results[1]).toEqual(
        create(StreamTransformChangesResponseSchema, {
          changeType: TransformChangeType.UPDATED,
          transform: transformWithUUID(mockTransform),
          updatedFields: { paths: ['pose_in_observer_frame'] },
        })
      );
    });
  });

  describe('doCommand', () => {
    it('executes arbitrary commands', async () => {
      const command = { test: 'value' };
      const expected = { success: true };

      await expect(worldStateStore.doCommand(command)).resolves.toStrictEqual(
        expected
      );
    });
  });
});
