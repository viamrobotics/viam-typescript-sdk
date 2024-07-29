import { grpc } from '@improbable-eng/grpc-web';
import {
  createViamTransportFactory,
  type Credential,
  type AccessToken,
  isCredential,
} from './viam-transport';
import { createRobotClient } from '../robot/dial';
import { DataClient } from './data-client';
import { AppClient } from './app-client';
import { BillingClient } from './billing-client';
import { MlTrainingClient } from './ml-training-client';
import { ProvisioningClient } from './provisioning-client';
import { SharedSecret } from '../gen/app/v1/app_pb';

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
  const client = new ViamClient(transportFactory, serviceHost, credential);
  client.connect();
  return client;
};

interface ViamClientMachineConnectionOpts {
  host?: string;
  id?: string;
}

/** A gRPC client for method calls to Viam app. */
export class ViamClient {
  private transportFactory: grpc.TransportFactory;
  private serviceHost: string;
  private credential: Credential | AccessToken;

  public dataClient: DataClient | undefined;
  public appClient: AppClient | undefined;
  public mlTrainingClient: MlTrainingClient | undefined;
  public provisioningClient: ProvisioningClient | undefined;
  public billingClient: BillingClient | undefined;

  constructor(
    transportFactory: grpc.TransportFactory,
    serviceHost: string,
    credential: Credential | AccessToken
  ) {
    this.transportFactory = transportFactory;
    this.serviceHost = serviceHost;
    this.credential = credential;
  }

  public connect() {
    const grpcOptions = { transport: this.transportFactory };
    this.dataClient = new DataClient(this.serviceHost, grpcOptions);
    this.appClient = new AppClient(this.serviceHost, grpcOptions);
    this.mlTrainingClient = new MlTrainingClient(this.serviceHost, grpcOptions);
    this.provisioningClient = new ProvisioningClient(
      this.serviceHost,
      grpcOptions
    );
    this.billingClient = new BillingClient(this.serviceHost, grpcOptions);
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
      const parts = await this.appClient?.getRobotParts(id);
      const mainPart = parts?.find((part) => part.mainPart);
      if (!mainPart) {
        throw new Error(
          `Could not find a main part for the machine with UUID: ${id}`
        );
      }
      address = mainPart.fqdn;
      locationId = mainPart.locationId;
    }

    if (!address) {
      throw new Error(
        'Host was not provided and could not be obtained from the machine ID'
      );
    }

    // If credential is AccessToken, then attempt to get the robot location secret
    let creds = this.credential;
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
        const location = await this.appClient?.getLocation(locationId);
        const secret = location?.auth?.secretsList.find(
          (sec) => sec.state === SharedSecret.State.STATE_ENABLED
        );
        creds = {
          type: 'robot-location-secret',
          payload: secret?.secret,
          authEntity: address,
        } as Credential;
      }
    }

    return createRobotClient({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      host: address,
      credential: creds,
      authEntity: (creds as Credential).authEntity,
      signalingAddress: 'https://app.viam.com:443',
      reconnectMaxAttempts: 1,
    });
  }
}
