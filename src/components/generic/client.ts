import { type JsonValue, Struct } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import { GenericService } from '../../gen/component/generic/v1/generic_connect';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Generic } from './generic';
import { GetGeometriesRequest } from '../../gen/common/v1/common_pb';

/**
 * A gRPC-web client for the Generic component.
 *
 * @group Clients
 */
export class GenericClient implements Generic {
  private client: Client<typeof GenericService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(GenericService);
    this.name = name;
    this.options = options;
  }

  async getGeometries(extra = {}, callOptions = this.callOptions) {
    const request = new GetGeometriesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    const response = await this.client.getGeometries(request, callOptions);
    return response.geometries;
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
