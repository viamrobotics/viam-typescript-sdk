import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import { MimeType } from '../../gen/app/datasync/v1/data_sync_pb.js';
import { DataManagerService } from '../../gen/service/datamanager/v1/data_manager_connect.js';
import {
  SyncRequest,
  UploadBinaryDataToDatasetsRequest,
} from '../../gen/service/datamanager/v1/data_manager_pb.js';
import type { RobotClient } from '../../robot';
import type { Options, StructInput } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { DataManager } from './data-manager';

export class DataManagerClient implements DataManager {
  private client: Client<typeof DataManagerService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(DataManagerService);
    this.name = name;
    this.options = options;
  }

  /**
   * Sync data stored on the machine to the cloud.
   *
   * @example
   *
   * ```ts
   * const dataManager = new VIAM.DataManagerClient(
   *   machine,
   *   'my_data_manager'
   * );
   * await dataManager.sync();
   * ```
   *
   * For more information, see [Data Manager
   * API](https://docs.viam.com/dev/reference/apis/services/data/#sync).
   *
   * @param extra - Extra arguments to pass to the sync request.
   * @param callOptions - Call options for the sync request.
   */
  async sync(extra = {}, callOptions = this.callOptions) {
    const request = new SyncRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.sync(request, callOptions);
  }

  /**
   * Do a command on the data manager.
   *
   * @example
   *
   * ```ts
   * const dataManager = new VIAM.DataManagerClient(
   *   machine,
   *   'my_data_manager'
   * );
   * await dataManager.doCommand({ cmd: 'test', data1: 500 });
   * ```
   *
   * For more information, see [Data Manager
   * API](https://docs.viam.com/dev/reference/apis/services/data/#docommand).
   *
   * @param command - The command to execute, as a plain object or a Struct.
   * @param callOptions - Call options for the command.
   */
  async doCommand(
    command: StructInput,
    callOptions = this.callOptions
  ): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions
    );
  }

  /**
   * Uploads binary data to specified datasets.
   *
   * @example
   *
   * ```ts
   * const dataManager = new VIAM.DataManagerClient(
   *   machine,
   *   'my_data_manager'
   * );
   * await dataManager.uploadBinaryDataToDatasets(
   *   new Uint8Array([1, 2, 3]),
   *   ['tag1', 'tag2'],
   *   ['datasetId1', 'datasetId2'],
   *   MimeType.MIME_TYPE_JPEG
   * );
   * ```
   *
   * @param binaryData - The binary data to upload.
   * @param tags - Tags to associate with the binary data.
   * @param datasetIds - IDs of the datasets to associate the binary data with.
   * @param mimeType - The MIME type of the binary data.
   * @param extra - Extra arguments to pass to the upload request.
   * @param callOptions - Call options for the upload request.
   */
  async uploadBinaryDataToDatasets(
    binaryData: Uint8Array,
    tags: string[],
    datasetIds: string[],
    mimeType: MimeType,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new UploadBinaryDataToDatasetsRequest({
      name: this.name,
      binaryData,
      tags,
      datasetIds,
      mimeType,
      extra: Struct.fromJson(extra),
    });
    this.options.requestLogger?.(request);
    await this.client.uploadBinaryDataToDatasets(request, callOptions);
  }
}
