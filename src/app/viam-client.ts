import { grpc } from '@improbable-eng/grpc-web';
import { type DialOptions } from '@viamrobotics/rpc/src/dial';
import { createViamTransportFactory } from './viam-transport';
import { DataClient } from './data-client';

export interface ViamClientOptions {
  serviceHost: string;
  authEntity?: string;
  credential?: Credential;
}

export interface Credential {
  type: CredentialType;
  payload: string;
}

export type CredentialType =
  | 'robot-location-secret'
  | 'robot-secret'
  | 'api-key'
  | 'access-token';

/** Instantiate a connected Viam client */
export const createViamClient = async (
  options: ViamClientOptions
): Promise<ViamClient> => {
  const client = new ViamClient(
    { authEntity: options.authEntity, credentials: options.credential },
    options.serviceHost
  );
  await client.connect();
  return client;
};

// TODO: deprecate and expose constructor
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
