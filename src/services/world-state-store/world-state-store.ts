import type { Struct } from '@bufbuild/protobuf';
import type { Transform, Resource } from '../../types';
import type { TransformChangeEvent, TransformWithUUID } from './types';
import { UuidTool } from 'uuid-tool';

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
  listUUIDs: (extra?: Struct) => Promise<string[]>;

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
  getTransform: (uuid: string, extra?: Struct) => Promise<TransformWithUUID>;

  /**
   * StreamTransformChanges streams changes to world state transforms.
   *
   * The returned transform will only contain the fields that have changed.
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
  streamTransformChanges: (
    extra?: Struct
  ) => AsyncGenerator<TransformChangeEvent, void>;
}

export const uuidToString = (uuid: Uint8Array) => UuidTool.toString([...uuid]);
export const uuidFromString = (uuid: string): Uint8Array =>
  new Uint8Array(UuidTool.toBytes(uuid));

export const transformWithUUID = (transform: Transform): TransformWithUUID => {
  return {
    ...transform,
    uuidString: uuidToString(transform.uuid),
  };
};
