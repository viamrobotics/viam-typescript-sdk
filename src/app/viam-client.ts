import type { Transport } from '@connectrpc/connect';
import { createRobotClient } from '../robot/dial';
import { AppClient } from './app-client';
import { BillingClient } from './billing-client';
import { DataClient } from './data-client';
import { MlTrainingClient } from './ml-training-client';
import { ProvisioningClient } from './provisioning-client';
import {
  createViamTransport,
  isCredential,
  type Credential,
  type Credentials,
} from './viam-transport';

export interface ViamClientOptions {
  serviceHost?: string;
  credentials: Credentials;
}

/** Instantiate a connected gRPC client that interfaces with Viam app. */
export const createViamClient = async ({
  serviceHost = 'https://app.viam.com',
  credentials,
}: ViamClientOptions): Promise<ViamClient> => {
  const transport = await createViamTransport(serviceHost, credentials);
  return new ViamClient(transport, credentials);
};

interface ViamClientMachineConnectionOpts {
  host?: string;
  id?: string;
}

/** A gRPC client for method calls to Viam app. */
export class ViamClient {
  private transport: Transport;
  private credentials: Credentials;

  public readonly dataClient: DataClient;
  public readonly appClient: AppClient;
  public readonly mlTrainingClient: MlTrainingClient;
  public readonly provisioningClient: ProvisioningClient;
  public readonly billingClient: BillingClient;

  constructor(transport: Transport, credentials: Credentials) {
    this.transport = transport;
    this.credentials = credentials;

    this.dataClient = new DataClient(this.transport);
    this.appClient = new AppClient(this.transport);
    this.mlTrainingClient = new MlTrainingClient(this.transport);
    this.provisioningClient = new ProvisioningClient(this.transport);
    this.billingClient = new BillingClient(this.transport);
  }

  async getRobotSecretFromHost(host: string): Promise<string | undefined> {
    const firstHalf = host.split('.viam.');
    const locationSplit = firstHalf[0]?.split('.');
    if (locationSplit !== undefined) {
      const locationId = locationSplit.at(-1);
      if (locationId === undefined) {
        return undefined;
      }
      const name = host.split('.').at(0);
      if (name !== undefined) {
        const resp = await this.appClient.getRobotPartByNameAndLocation(
          name,
          locationId
        );
        return resp.part?.secret;
      }
    }
    return undefined;
  }

  public async connectToMachine({
    host = undefined,
    id = undefined,
  }: ViamClientMachineConnectionOpts) {
    if (host === undefined && id === undefined) {
      throw new Error('Either a machine address or ID must be provided');
    }
    let address = host;
    let robotSecret: string | undefined = undefined;

    // Get address if only ID was provided
    if (id !== undefined && host === undefined) {
      const parts = await this.appClient.getRobotParts(id);
      const mainPart = parts.find((part) => part.mainPart);
      if (!mainPart) {
        throw new Error(
          `Could not find a main part for the machine with UUID: ${id}`
        );
      }
      address = mainPart.fqdn;
      robotSecret = mainPart.secret;
    }

    if (address === undefined || address === '') {
      throw new Error(
        'Host was not provided and could not be obtained from the machine ID'
      );
    }

    // If credentials is AccessToken, then attempt to use the robot part secret
    let creds = this.credentials;
    if (!isCredential(creds)) {
      if (robotSecret === undefined) {
        robotSecret = await this.getRobotSecretFromHost(address);
      }
      creds =
        robotSecret === undefined
          ? creds
          : ({
              type: 'robot-secret',
              payload: robotSecret,
              authEntity: address,
            } as Credential);
    }

    return createRobotClient({
      host: address,
      credentials: creds,
      signalingAddress: 'https://app.viam.com:443',
      reconnectMaxAttempts: 1,
    });
  }
}
