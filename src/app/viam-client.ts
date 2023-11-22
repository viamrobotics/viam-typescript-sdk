import { grpc } from '@improbable-eng/grpc-web';
import {
  createViamTransportFactory,
  type Credential,
  type AccessToken,
} from './viam-transport';
import { DataClient } from './data-client';

export interface ViamClientOptions {
  serviceHost?: string;
  credential: Credential | AccessToken;
}

/** Instantiate a connected Viam client */
export const createViamClient = async (
  options: ViamClientOptions
): Promise<ViamClient> => {
  const serviceHost = options.serviceHost ?? 'https://app.viam.com';

  const transportFactory = await createViamTransportFactory(
    serviceHost,
    options.credential
  );
  const client = new ViamClient(transportFactory, serviceHost);
  client.connect();
  return client;
};

export class ViamClient {
  private transportFactory: grpc.TransportFactory;
  private serviceHost: string;

  public dataClient: DataClient | undefined;

  constructor(transportFactory: grpc.TransportFactory, serviceHost: string) {
    this.transportFactory = transportFactory;
    this.serviceHost = serviceHost;
  }

  public connect() {
    const grpcOptions = { transport: this.transportFactory };
    this.dataClient = new DataClient(this.serviceHost, grpcOptions);
  }
}
