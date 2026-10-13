import type { JsonObject } from '@bufbuild/protobuf';
import type * as mlModelAPI from '../../gen/service/mlmodel/v1/mlmodel_pb';

export type Metadata = mlModelAPI.Metadata;
export type TensorInfo = mlModelAPI.TensorInfo;
export type FlatTensors = mlModelAPI.FlatTensors;

export interface MLModel {
  metadata: (extra?: JsonObject) => Promise<mlModelAPI.MetadataResponse>;

  infer: (inputTensors: FlatTensors, extra?: JsonObject) => Promise<mlModelAPI.InferResponse>;
}
