import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';
import type { MimeType } from '../../app/datasync/v1/data_sync_pb.js';

export interface DataManager extends Resource {
  sync: (extra?: Struct) => Promise<void>;
  /**
   * Uploads binary data to specified datasets.
   *
   * @param binaryData - The binary data to upload.
   * @param tags - Tags to associate with the binary data.
   * @param datasetIds - IDs of the datasets to upload the data to.
   * @param mimeType - The MIME type of the binary data.
   * @param extra - Additional arguments to pass to the method.
   */
  uploadBinaryDataToDatasets: (
    binaryData: Uint8Array,
    tags: string[],
    datasetIds: string[],
    mimeType: MimeType,
    extra?: Struct
  ) => Promise<void>;
}
