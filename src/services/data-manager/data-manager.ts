import type { Struct } from '@bufbuild/protobuf';
import { MimeType } from '../../gen/app/datasync/v1/data_sync_pb.js';
import type { Resource } from '../../types';

export interface DataManager extends Resource {
  sync: (extra?: Struct) => Promise<void>;
  uploadBinaryDataToDatasets: (
    binaryData: Uint8Array,
    tags: string[],
    datasetIds: string[],
    mimeType: MimeType,
    extra?: Struct
  ) => Promise<void>;
}
