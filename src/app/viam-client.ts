import { grpc } from '@improbable-eng/grpc-web';
import {
  createViamTransportFactory,
  type Credential,
  type AccessToken,
} from './viam-transport';
import { DataClient } from './data-client';

export interface ViamClientOptions {
  /** URI of the Viam app. Defaults to 'https://app.viam.com' */
  serviceHost?: string;
  /**
   * Either an access token that can access protected resources directly or a
   * credential that can be exchanged for an access token.
   */
  credential: Credential | AccessToken;
}

/** Instantiate a connected gRPC client that interfaces with Viam app. */
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

/** A gRPC client for method calls to Viam app. */
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
