import type { RobotClient } from '../../robot';
import { GenericServiceClient } from '../../gen/component/generic/v1/generic_pb_service';
import type { Options, StructType } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Generic } from './generic';

/**
 * A gRPC-web client for the Generic component.
 *
 * @group Clients
 */
export class GenericClient implements Generic {
  private client: GenericServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(GenericServiceClient);
    this.name = name;
    this.options = options;
  }

  private get genericService() {
    return this.client;
  }

  async doCommand(command: StructType): Promise<StructType> {
    const { genericService } = this;
    return doCommandFromClient(genericService, this.name, command, this.options);
  }
}
