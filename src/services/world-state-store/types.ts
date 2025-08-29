import type { PlainMessage } from '@bufbuild/protobuf';
import type { Transform } from '../../gen/common/v1/common_pb';
import type { StreamTransformChangesResponse } from '../../gen/service/worldstatestore/v1/world_state_store_pb';

export interface TransformWithUUID extends PlainMessage<Transform> {
  uuidString: string;
}

export type TransformChangeStream = AsyncIterable<
  Omit<PlainMessage<StreamTransformChangesResponse>, 'transform'> & {
    transform: TransformWithUUID | undefined;
  }
>;
