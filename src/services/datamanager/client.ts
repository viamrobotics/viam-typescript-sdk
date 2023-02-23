import * as googleProtobufStructPb from 'google-protobuf/google/protobuf/struct_pb';

import type Client from '../../Client';
import pb from '../../gen/service/datamanager/v1/data_manager_pb.js';
import { DataManagerServiceClient } from '../../gen/service/datamanager/v1/data_manager_pb_service.js';
import type { Options } from '../../types';
import { promisify } from '../../utils';
import type { DataManager } from './datamanager';

export class DataManagerClient implements DataManager {
  private client: DataManagerServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: Client, name: string, options: Options = {}) {
    this.client = client.createServiceClient(DataManagerServiceClient);
    this.name = name;
    this.options = options;
  }

  private get datamanagerService() {
    return this.client;
  }

  async Sync(extra = {}) {
    const datamanagerService = this.datamanagerService;
    const request = new pb.SyncRequest();
    request.setName(this.name);
    request.setExtra(googleProtobufStructPb.Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<pb.SyncRequest, pb.SyncResponse>(
      datamanagerService.sync.bind(datamanagerService),
      request
    );
  }
}
