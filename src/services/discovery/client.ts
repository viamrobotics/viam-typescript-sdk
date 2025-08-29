import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import { DiscoveryService } from '../../gen/service/discovery/v1/discovery_connect';
import { DiscoverResourcesRequest } from '../../gen/service/discovery/v1/discovery_pb';
import type { RobotClient } from '../../robot';
import { doCommandFromClient } from '../../utils';
import type { Options } from '../../types';
import type { Discovery } from './discovery';

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
    const request = new DiscoverResourcesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.discoverResources(request, callOptions);
    return resp.discoveries;
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
