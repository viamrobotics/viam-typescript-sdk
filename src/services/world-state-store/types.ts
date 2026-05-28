import type { Transform } from '../../gen/common/v1/common_pb';
import type { StreamTransformChangesResponse } from '../../gen/service/worldstatestore/v1/world_state_store_pb';
import { DeepOmitProtobufInternals } from '../../internal/types';

export type TransformWithUUID = DeepOmitProtobufInternals<Transform> & {
  uuidString: string;
};

export type TransformChangeEvent = Omit<
  DeepOmitProtobufInternals<StreamTransformChangesResponse>,
  'transform'
> & {
  transform: TransformWithUUID | undefined;
};
