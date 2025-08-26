import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';
import type { MimeType } from '../../app/datasync/v1/data_sync_pb.js';

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