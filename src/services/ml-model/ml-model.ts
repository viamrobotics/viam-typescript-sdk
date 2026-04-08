import type { MessageInitShape } from "@bufbuild/protobuf";
import {
  FlatTensorsSchema,
  type InferResponse,
  type MetadataResponse,
} from "../../gen/service/mlmodel/v1/mlmodel_pb";
import type { JsonObject } from "../../types";

export {
  type FlatTensors,
  type Metadata,
  type TensorInfo,
} from "../../gen/service/mlmodel/v1/mlmodel_pb";

export interface MLModel {
  metadata: (extra?: JsonObject) => Promise<MetadataResponse>;

  infer: (
    inputTensors: MessageInitShape<typeof FlatTensorsSchema>,
    extra?: JsonObject,
  ) => Promise<InferResponse>;
}
