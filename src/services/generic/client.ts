import type { JsonValue, Struct } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import { GenericService } from '../../gen/service/generic/v1/generic_connect';
import { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Generic } from './generic';

/**
 * A gRPC-web client for a Generic service.
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

  async doCommand(
    command: Struct | Record<string, JsonValue>,
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
