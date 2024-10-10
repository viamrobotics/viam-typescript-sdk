import type { Transport } from '@connectrpc/connect';
import { SharedSecret_State } from '../gen/app/v1/app_pb';
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

  public async connectToMachine({
    host = undefined,
    id = undefined,
  }: ViamClientMachineConnectionOpts) {
    if (host === undefined && id === undefined) {
      throw new Error('Either a machine address or ID must be provided');
    }
    let address = host;
    let locationId: string | undefined = undefined;

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
      locationId = mainPart.locationId;
    }

    if (address === undefined || address === '') {
      throw new Error(
        'Host was not provided and could not be obtained from the machine ID'
      );
    }

    // If credentials is AccessToken, then attempt to get the robot location secret
    let creds = this.credentials;
    if (!isCredential(creds)) {
      if (locationId === undefined) {
        // If we don't have a location, try to get it from the address
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const firstHalf = address.split('.viam.');
        const locationSplit = firstHalf[0]?.split('.');
        if (locationSplit !== undefined) {
          locationId = locationSplit.at(-1);
        }
      }
      if (locationId !== undefined) {
        // If we found the location, then attempt to get its secret
        const location = await this.appClient.getLocation(locationId);
        const secret = location?.auth?.secrets.find(
          // eslint-disable-next-line camelcase
          (sec) => sec.state === SharedSecret_State.ENABLED
        );
        creds = {
          type: 'robot-location-secret',
          payload: secret?.secret,
          authEntity: address,
        } as Credential;
      }
    }

    return createRobotClient({
      host: address,
      credentials: creds,
      signalingAddress: 'https://app.viam.com:443',
      reconnectMaxAttempts: 1,
    });
  }
}
