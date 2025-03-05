import type { PlainMessage, Struct } from '@bufbuild/protobuf';
import type * as mlModelAPI from '../../gen/service/mlmodel/v1/mlmodel_pb';

export type FlatTensors = PlainMessage<mlModelAPI.FlatTensors>;

export interface MLModel {
  metadata: (extra?: Struct) => Promise<mlModelAPI.MetadataResponse>;

  infer: (
    inputTensors: FlatTensors,
    extra?: Struct
  ) => Promise<mlModelAPI.InferResponse>;
}
