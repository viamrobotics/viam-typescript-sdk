import { grpc } from '@improbable-eng/grpc-web';
import { type DialOptions } from '@viamrobotics/rpc/src/dial';
import { createViamTransportFactory } from '../robot/dial';
import { DataClient } from './data-client';

export class ViamClient {
  private serviceHost: string;
  private dialOpts: DialOptions;
  private transportFactory: grpc.TransportFactory | undefined;
  public dataClient: DataClient | undefined;

  constructor(dialOpts: DialOptions, serviceHost?: string) {
    this.serviceHost = serviceHost ?? 'https://app.viam.com:443';
    this.dialOpts = dialOpts;
  }

  private getTransportFactory = async () => {
    return createViamTransportFactory(this.serviceHost, this.dialOpts);
  };

  public async connect() {
    this.transportFactory = await this.getTransportFactory();
    const grpcOptions = { transport: this.transportFactory };
    this.dataClient = new DataClient(this.serviceHost, grpcOptions);
  }
}
