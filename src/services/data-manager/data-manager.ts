import { MimeType } from "../../gen/app/datasync/v1/data_sync_pb.js";
import type { JsonObject, Resource } from "../../types";

export interface DataManager extends Resource {
  sync: (extra?: JsonObject) => Promise<void>;
  uploadBinaryDataToDatasets: (
    binaryData: Uint8Array,
    tags: string[],
    datasetIds: string[],
    mimeType: MimeType,
    extra?: JsonObject,
  ) => Promise<void>;
}
