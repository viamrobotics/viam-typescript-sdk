import { grpc } from '@improbable-eng/grpc-web';
import { dialDirect } from '@viamrobotics/rpc';

import { AuthenticateRequest, Credentials } from '../gen/proto/rpc/v1/auth_pb';
import { AuthServiceClient } from '../gen/proto/rpc/v1/auth_pb_service';

/** A credential that can be exchanged to obtain an access token */
export interface Credential {
  authEntity: string;
  type: CredentialType;
  payload: string;
}

export type CredentialType =
  | 'robot-location-secret'
  | 'api-key'
  | 'robot-secret';

/** An access token used to access protected resources. */
export interface AccessToken {
  type: 'access-token';
  payload: string;
}

/**
 * Initialize an authenticated transport factory that can access protected
 * resources.
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
        reject(err);
        return;
      }
      resolve(response?.getAccessToken().toString() ?? '');
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
