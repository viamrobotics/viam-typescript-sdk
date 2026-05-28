import type { MessageInitShape } from '@bufbuild/protobuf';

import {
  FlatTensorSchema,
  FlatTensorsSchema,
  MetadataSchema,
  TensorInfoSchema,
  type InferResponse,
  type MetadataResponse,
} from '../../gen/service/mlmodel/v1/mlmodel_pb';
import type { JsonObject } from '../../types';

export type FlatTensors = MessageInitShape<typeof FlatTensorSchema>;
export type Metadata = MessageInitShape<typeof MetadataSchema>;
export type TensorInfo = MessageInitShape<typeof TensorInfoSchema>;

export interface MLModel {
  metadata: (extra?: JsonObject) => Promise<MetadataResponse>;

  infer: (
    inputTensors: MessageInitShape<typeof FlatTensorsSchema>,
    extra?: JsonObject,
  ) => Promise<InferResponse>;
}
