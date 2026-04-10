import { create } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';

import {
  GetTransformRequestSchema,
  ListUUIDsRequestSchema,
  StreamTransformChangesRequestSchema,
  WorldStateStoreService,
} from '../../gen/service/worldstatestore/v1/world_state_store_pb';
import type { RobotClient } from '../../robot';
import type { JsonObject, Options } from '../../types';
import { doCommandFromClient, getStatusFromClient } from '../../utils';
import type { TransformChangeEvent } from './types';
import type { WorldStateStore } from './world-state-store';
import {
  transformWithUUID,
  uuidFromString,
  uuidToString,
} from './world-state-store';

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
    const request = create(ListUUIDsRequestSchema, {
      name: this.name,
      extra,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.listUUIDs(request, callOptions);
    return response.uuids.map((uuid) => uuidToString(uuid));
  }

  async getTransform(uuid: string, extra = {}, callOptions = this.callOptions) {
    const request = create(GetTransformRequestSchema, {
      name: this.name,
      uuid: uuidFromString(uuid),
      extra,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getTransform(request, callOptions);
    if (!response.transform) {
      throw new Error('No transform returned from server');
    }

    return transformWithUUID(response.transform);
  }

  async *streamTransformChanges(
    extra = {},
    callOptions = this.callOptions
  ): AsyncGenerator<TransformChangeEvent, void> {
    const request = create(StreamTransformChangesRequestSchema, {
      name: this.name,
      extra,
    });

    this.options.requestLogger?.(request);

    const stream = this.client.streamTransformChanges(request, callOptions);

    for await (const response of stream) {
      if (!response.transform) {
        continue;
      }

      yield {
        ...response,
        transform: transformWithUUID(response.transform),
      };
    }
  }

  async getStatus(callOptions = this.callOptions): Promise<JsonObject> {
    return getStatusFromClient(
      this.client.getStatus,
      this.name,
      this.options,
      callOptions
    );
  }

  async doCommand(
    command: JsonObject,
    callOptions = this.callOptions
  ): Promise<JsonObject> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions
    );
  }
}
