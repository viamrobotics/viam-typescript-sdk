import type { Transform } from '../../gen/common/v1/common_pb';
import type { StreamTransformChangesResponse } from '../../gen/service/worldstatestore/v1/world_state_store_pb';

export interface TransformWithUUID extends Transform {
  uuidString: string;
}

export type TransformChangeEvent = Omit<
  StreamTransformChangesResponse,
  'transform'
> & {
  transform: TransformWithUUID | undefined;
};
