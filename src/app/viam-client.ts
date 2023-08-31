import { grpc } from '@improbable-eng/grpc-web';
import { type DialOptions } from '@viamrobotics/rpc/src/dial';
import { DataServiceClient } from '../gen/app/data/v1/data_pb_service';
import { createViamTransportFactory } from '../robot/dial';

export class ViamClient {
  private serviceHost: string;
  private dialOpts: DialOptions;
  private dataServiceClient: DataServiceClient | undefined;
  private transportFactory: grpc.TransportFactory | undefined;

  constructor(serviceHost: string, dialOpts: DialOptions) {
    this.serviceHost = serviceHost;
    this.dialOpts = dialOpts;
  }

  public getTransportFactory = async () => {
    return createViamTransportFactory(this.serviceHost, this.dialOpts);
  };

  get dataService() {
    if (!this.dataServiceClient) {
      throw new Error('not connected yet');
    }
    return this.dataServiceClient;
  }

  public async connect() {
    this.transportFactory = await this.getTransportFactory();
    const grpcOptions = { transport: this.transportFactory };
    this.dataServiceClient = new DataServiceClient(
      this.serviceHost,
      grpcOptions
    );
  }
}
