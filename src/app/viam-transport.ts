import { grpc } from '@improbable-eng/grpc-web';
import { dialDirect } from '@viamrobotics/rpc';

import {
  AuthenticateRequest,
  Credentials as PBCredentials,
} from '../gen/proto/rpc/v1/auth_pb';
import { AuthServiceClient } from '../gen/proto/rpc/v1/auth_pb_service';
import { MetadataTransport } from '../utils';

/**
 * Credentials are either used to obtain an access token or provide an existing
 * one
 */
export type Credentials = Credential | AccessToken;

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

export const isCredential = (object: Credentials): object is Credential => {
  return 'authEntity' in object;
};

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

export const getAccessTokenFromCredential = async (
  host: string,
  credential: Credential
) => {
  if (credential.type === 'robot-secret') {
    throw new Error(
      `credential type cannot be 'robot-secret'. Must be either 'robot-location-secret' or 'api-key'.`
    );
  } else if (!credential.authEntity) {
    throw new Error(
      `auth entity cannot be null, undefined, or an empty value.`
    );
  }

  const transportFactory = await dialDirect(host);
  const authClient = new AuthServiceClient(host, {
    transport: transportFactory,
  });

  const entity = credential.authEntity;
  const creds = new PBCredentials();
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

  return { type: 'access-token', payload: accessToken } as AccessToken;
};

const createWithCredential = async (
  serviceHost: string,
  credential: Credential
): Promise<grpc.TransportFactory> => {
  const accessToken = await getAccessTokenFromCredential(
    serviceHost,
    credential
  );

  const transportFactory = await dialDirect(serviceHost);
  return (opts: grpc.TransportOptions): ViamTransport =>
    new ViamTransport(transportFactory, opts, accessToken.payload);
};

export class ViamTransport extends MetadataTransport {
  constructor(
    transportFactory: grpc.TransportFactory,
    opts: grpc.TransportOptions,
    accessToken: string
  ) {
    const md = new grpc.Metadata({ authorization: `Bearer ${accessToken}` });
    super(transportFactory, opts, md);
  }
}
