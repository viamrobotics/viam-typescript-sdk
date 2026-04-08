import { create } from "@bufbuild/protobuf";
import type { CallOptions, Client } from "@connectrpc/connect";
import {
  DiscoverResourcesRequestSchema,
  DiscoveryService,
} from "../../gen/service/discovery/v1/discovery_pb";
import type { RobotClient } from "../../robot";
import type { JsonObject, Options } from "../../types";
import { doCommandFromClient, getStatusFromClient } from "../../utils";
import type { Discovery } from "./discovery";

/**
 * A gRPC-web client for a Vision service.
 *
 * @group Clients
 */
export class DiscoveryClient implements Discovery {
  private client: Client<typeof DiscoveryService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(DiscoveryService);
    this.name = name;
    this.options = options;
  }

  async discoverResources(extra = {}, callOptions = this.callOptions) {
    const request = create(DiscoverResourcesRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.discoverResources(request, callOptions);
    return resp.discoveries;
  }

  async getStatus(callOptions = this.callOptions): Promise<JsonObject> {
    return getStatusFromClient(
      this.client.getStatus,
      this.name,
      this.options,
      callOptions,
    );
  }

  async doCommand(
    command: JsonObject,
    callOptions = this.callOptions,
  ): Promise<JsonObject> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions,
    );
  }
}
