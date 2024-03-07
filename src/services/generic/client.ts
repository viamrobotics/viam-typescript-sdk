import { RobotClient } from '../../robot';
import { GenericServiceClient } from '../../gen/service/generic/v1/generic_pb_service';
import { doCommandFromClient, encodeGeoPoint, promisify } from '../../utils';
import type { Options, StructType } from '../../types';
import type { Generic } from './generic';

/**
 * A gRPC-web client for a Generic service.
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

  private get service() {
    return this.client;
  }

  async doCommand(command: StructType): Promise<StructType> {
    const { service } = this;
    return doCommandFromClient(service, this.name, command, this.options);
  }
}
