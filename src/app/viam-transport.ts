import { grpc } from '@improbable-eng/grpc-web';
import { dialDirect } from '@viamrobotics/rpc/src/dial';

import { AuthenticateRequest, Credentials } from '../gen/proto/rpc/v1/auth_pb';
import { AuthServiceClient } from '../gen/proto/rpc/v1/auth_pb_service';

export interface Credential {
  authEntity: string;
  type: CredentialType;
  payload: string;
}

export type CredentialType =
  | 'robot-location-secret'
  | 'api-key'
  | 'robot-secret';

export interface AccessToken {
  type: 'access-token';
  payload: string;
}

/**
 * Get a Viam Transport Factory after getting the accessToken.
 *
 * In dialOpts.credentials, the credential type cannot be a robot secret. The
 * credential type to use would preferably be the organization api key.
 */
export const createViamTransportFactory = async (
  serviceHost: string,
  credential: Credential | AccessToken
): Promise<grpc.TransportFactory> => {
  if (credential.type === 'access-token') {
    return createWithAccessToken(serviceHost, credential);
  }
  return createWithCredential(serviceHost, credential);
};

const createWithAccessToken = async (
  serviceHost: string,
  accessToken: AccessToken
): Promise<grpc.TransportFactory> => {
  const transportFactory = await dialDirect(serviceHost);

  return (opts: grpc.TransportOptions): ViamTransport =>
    new ViamTransport(transportFactory, opts, accessToken.payload);
};

const createWithCredential = async (
  serviceHost: string,
  credential: Credential
): Promise<grpc.TransportFactory> => {
  const transportFactory = await dialDirect(serviceHost);

  /**
   * If a token is not provided, we need to obtain one with either a
   * 'robot-location-secret' or an 'api-key'
   */
  const authClient = new AuthServiceClient(serviceHost, {
    transport: transportFactory,
  });
  if (credential.type === 'robot-secret') {
    throw new Error(
      `credential type cannot be 'robot-secret'. Must be either 'robot-location-secret' or 'api-key'.`
    );
  } else if (!credential.authEntity) {
    throw new Error(
      `auth entity cannot be null, undefined, or an empty value.`
    );
  }

  const entity = credential.authEntity;
  const creds = new Credentials();
  creds.setType(credential.type);
  creds.setPayload(credential.payload);

  const req = new AuthenticateRequest();
  req.setEntity(entity);
  req.setCredentials(creds);

  const accessToken = await new Promise<string>((resolve, reject) => {
    authClient.authenticate(req, new grpc.Metadata(), (err, response) => {
      if (err) {
        return reject(err);
      }
      return resolve(response?.getAccessToken().toString() ?? '');
    });
  });

  return (opts: grpc.TransportOptions): ViamTransport =>
    new ViamTransport(transportFactory, opts, accessToken);
};

export class ViamTransport implements grpc.Transport {
  private accessToken: string;
  protected readonly transport: grpc.Transport;

  constructor(
    transportFactory: grpc.TransportFactory,
    opts: grpc.TransportOptions,
    accessToken: string
  ) {
    this.transport = transportFactory(opts);
    this.accessToken = accessToken;
  }

  public start(metadata: grpc.Metadata): void {
    metadata.set('authorization', `Bearer ${this.accessToken}`);
    this.transport.start(metadata);
  }

  public sendMessage(msgBytes: Uint8Array): void {
    this.transport.sendMessage(msgBytes);
  }

  public finishSend(): void {
    this.transport.finishSend();
  }

  public cancel(): void {
    this.transport.cancel();
  }
}
