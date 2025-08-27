import type { Struct } from '@bufbuild/protobuf';
import type { Transform, Resource } from '../../types';
import type { TransformChangeType } from '../../gen/service/worldstatestore/v1/world_state_store_pb';

/**
 * A service that manages world state transforms, allowing storage and retrieval
 * of spatial relationships between reference frames.
 */
export interface WorldStateStore extends Resource {
  /**
   * ListUUIDs returns all world state transform UUIDs.
   *
   * @example
   *
   * ```ts
   * const worldStateStore = new VIAM.WorldStateStoreClient(
   *   machine,
   *   'builtin'
   * );
   *
   * // Get all transform UUIDs
   * const uuids = await worldStateStore.listUUIDs();
   * ```
   *
   * @param extra - Additional arguments to the method
   */
  listUUIDs: (extra?: Struct) => Promise<Uint8Array[]>;

  /**
   * GetTransform returns a world state transform by UUID.
   *
   * @example
   *
   * ```ts
   * const worldStateStore = new VIAM.WorldStateStoreClient(
   *   machine,
   *   'builtin'
   * );
   *
   * // Get a specific transform by UUID
   * const transform = await worldStateStore.getTransform(uuid);
   * ```
   *
   * @param uuid - The UUID of the transform to retrieve
   * @param extra - Additional arguments to the method
   */
  getTransform: (uuid: Uint8Array, extra?: Struct) => Promise<Transform>;

  /**
   * StreamTransformChanges streams changes to world state transforms.
   *
   * @example
   *
   * ```ts
   * const worldStateStore = new VIAM.WorldStateStoreClient(
   *   machine,
   *   'builtin'
   * );
   *
   * // Stream transform changes
   * const stream = worldStateStore.streamTransformChanges();
   * for await (const change of stream) {
   *   console.log(
   *     'Transform change:',
   *     change.changeType,
   *     change.transform
   *   );
   * }
   * ```
   *
   * @param extra - Additional arguments to the method
   */
  streamTransformChanges: (extra?: Struct) => AsyncIterable<{
    changeType: TransformChangeType;
    transform?: Transform;
    updatedFields?: { paths: string[] } | undefined;
  }>;
}
