import { grpc } from '@improbable-eng/grpc-web';
import {
  createViamTransportFactory,
  type Credential,
  type AccessToken,
} from './viam-transport';
import { DataClient } from './data-client';
import { BillingClient } from './billing-client';
import { MlTrainingClient } from './ml-training-client';
import { ProvisioningClient } from './provisioning-client';

export interface ViamClientOptions {
  serviceHost?: string;
  credential: Credential | AccessToken;
}

/** Instantiate a connected gRPC client that interfaces with Viam app. */
export const createViamClient = async ({
  serviceHost = 'https://app.viam.com',
  credential,
}: ViamClientOptions): Promise<ViamClient> => {
  const transportFactory = await createViamTransportFactory(
    serviceHost,
    credential
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
  public mlTrainingClient: MlTrainingClient | undefined;
  public provisioningClient: ProvisioningClient | undefined;
  public billingClient: BillingClient | undefined;

  constructor(transportFactory: grpc.TransportFactory, serviceHost: string) {
    this.transportFactory = transportFactory;
    this.serviceHost = serviceHost;
  }

  public connect() {
    const grpcOptions = { transport: this.transportFactory };
    this.dataClient = new DataClient(this.serviceHost, grpcOptions);
    this.mlTrainingClient = new MlTrainingClient(this.serviceHost, grpcOptions);
    this.provisioningClient = new ProvisioningClient(
      this.serviceHost,
      grpcOptions
    );
    this.billingClient = new BillingClient(this.serviceHost, grpcOptions);
  }
}
