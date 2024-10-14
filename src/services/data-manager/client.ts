import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, PromiseClient } from '@connectrpc/connect';
import { DataManagerService } from '../../gen/service/datamanager/v1/data_manager_connect.js';
import { SyncRequest } from '../../gen/service/datamanager/v1/data_manager_pb.js';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { DataManager } from './data-manager';

export class DataManagerClient implements DataManager {
  private client: PromiseClient<typeof DataManagerService>;
  private readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(DataManagerService);
    this.name = name;
    this.options = options;
  }

  async sync(extra = {}, callOptions = this.callOptions) {
    const request = new SyncRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.sync(request, callOptions);
  }

  async doCommand(
    command: Struct,
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
}
