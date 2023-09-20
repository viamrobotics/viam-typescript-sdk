import { grpc } from '@improbable-eng/grpc-web';
import { type DialOptions } from '@viamrobotics/rpc/src/dial';
import { DataServiceClient } from '../gen/app/data/v1/data_pb_service';
import { createViamTransportFactory } from '../robot/dial';
import { DataClient } from './data-client';

export class ViamClient {
  private serviceHost: string;
  private dialOpts: DialOptions;
  private transportFactory: grpc.TransportFactory | undefined;
  public dataServiceClient: DataServiceClient | undefined;
  public dataClient: DataClient | undefined;

  constructor(dialOpts: DialOptions, serviceHost: string | undefined) {
    this.serviceHost = serviceHost || 'https://app.viam.com:443';
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
    this.dataClient = new DataClient(this.serviceHost, grpcOptions);
  }
}
