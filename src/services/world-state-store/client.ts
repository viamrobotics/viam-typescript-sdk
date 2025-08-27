import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import { WorldStateStoreService } from '../../gen/service/worldstatestore/v1/world_state_store_connect';
import {
  GetTransformRequest,
  ListUUIDsRequest,
  StreamTransformChangesRequest,
} from '../../gen/service/worldstatestore/v1/world_state_store_pb';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { WorldStateStore } from './world-state-store';
import { transformWithUUID, uuidToString } from './world-state-store';

/**
 * A gRPC-web client for a WorldStateStore service.
 *
 * @group Clients
 */
export class WorldStateStoreClient implements WorldStateStore {
  private client: Client<typeof WorldStateStoreService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(WorldStateStoreService);
    this.name = name;
    this.options = options;
  }

  async listUUIDs(extra = {}, callOptions = this.callOptions) {
    const request = new ListUUIDsRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.listUUIDs(request, callOptions);
    return response.uuids.map((uuid) => uuidToString(uuid));
  }

  async getTransform(
    uuid: Uint8Array,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new GetTransformRequest({
      name: this.name,
      uuid,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getTransform(request, callOptions);
    if (!response.transform) {
      throw new Error('No transform returned from server');
    }

    return response.transform;
  }

  async *streamTransformChanges(extra = {}, callOptions = this.callOptions) {
    const request = new StreamTransformChangesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const stream = this.client.streamTransformChanges(request, callOptions);

    for await (const response of stream) {
      yield {
        changeType: response.changeType,
        transform: transformWithUUID(response.transform),
        updatedFields: response.updatedFields,
      };
    }
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
