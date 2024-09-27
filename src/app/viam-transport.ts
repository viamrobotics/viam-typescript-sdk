import { dialDirect } from '../rpc';

import type { Transport } from '@connectrpc/connect';
import { clientHeaders } from '../utils';

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

export const isCredential = (
  object: Credentials | undefined
): object is Credential => {
  return object !== undefined && 'authEntity' in object;
};

/** Initialize an authenticated transport that can access protected resources. */
export const createViamTransport = async (
  serviceHost: string,
  credential: Credential | AccessToken
): Promise<Transport> => {
  if (credential.type === 'access-token') {
    return dialDirect(serviceHost, {
      accessToken: credential.payload,
      extraHeaders: clientHeaders,
    });
  }
  return dialDirect(serviceHost, {
    credentials: credential,
    extraHeaders: clientHeaders,
  });
};
