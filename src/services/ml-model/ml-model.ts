import type { Struct } from '@bufbuild/protobuf';
import type { MetadataResponse } from '../../gen/service/mlmodel/v1/mlmodel_pb';

export interface MLModel {
  metadata: (extra?: Struct) => Promise<MetadataResponse>;
}
