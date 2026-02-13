// @vitest-environment happy-dom

import { createClient, createRouterTransport } from '@connectrpc/connect';
import { Struct } from '@bufbuild/protobuf';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorldStateStoreService } from '../../gen/service/worldstatestore/v1/world_state_store_connect';
import {
  GetTransformResponse,
  ListUUIDsResponse,
  StreamTransformChangesResponse,
} from '../../gen/service/worldstatestore/v1/world_state_store_pb';
import { RobotClient } from '../../robot';
import { WorldStateStoreClient } from './client';
import { TransformChangeType } from '../../gen/service/worldstatestore/v1/world_state_store_pb';
import { Transform, PoseInFrame, Pose } from '../../gen/common/v1/common_pb';
import { transformWithUUID, uuidToString } from './world-state-store';

vi.mock('../../robot');

const worldStateStoreClientName = 'test-world-state-store';

let worldStateStore: WorldStateStoreClient;

const mockUuids = [new Uint8Array([1, 2, 3, 4]), new Uint8Array([5, 6, 7, 8])];
const mockTransform = new Transform({
  referenceFrame: 'test-frame',
  poseInObserverFrame: new PoseInFrame({
    referenceFrame: 'observer-frame',
    pose: new Pose({
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
        listUUIDs: () => new ListUUIDsResponse({ uuids: mockUuids }),
        getTransform: () =>
          new GetTransformResponse({ transform: mockTransform }),
        streamTransformChanges: async function* mockStream() {
          // Add await to satisfy linter
          await Promise.resolve();
          yield new StreamTransformChangesResponse({
            changeType: TransformChangeType.ADDED,
            transform: mockTransform,
          });
          yield new StreamTransformChangesResponse({
            changeType: TransformChangeType.UPDATED,
            transform: mockTransform,
            updatedFields: { paths: ['pose_in_observer_frame'] },
          });
        },
        doCommand: () => ({ result: Struct.fromJson({ success: true }) }),
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
      expect(results[0]).toEqual({
        changeType: TransformChangeType.ADDED,
        transform: transformWithUUID(mockTransform),
        updatedFields: undefined,
      });
      expect(results[1]).toEqual({
        changeType: TransformChangeType.UPDATED,
        transform: transformWithUUID(mockTransform),
        updatedFields: { paths: ['pose_in_observer_frame'] },
      });
    });
  });

  describe('doCommand', () => {
    it('executes arbitrary commands with a Struct', async () => {
      const command = Struct.fromJson({ test: 'value' });
      const expected = { success: true };

      await expect(worldStateStore.doCommand(command)).resolves.toStrictEqual(
        expected
      );
    });

    it('accepts a plain object instead of a Struct', async () => {
      const expected = { success: true };

      await expect(
        worldStateStore.doCommand({ test: 'value' })
      ).resolves.toStrictEqual(expected);
    });
  });
});
