import type { Credential, AccessToken } from '../main';

export const testCredential: Credential = {
  authEntity: 'test-entity',
  type: 'api-key',
  payload: 'test-payload',
};

export const differentCredential: Credential = {
  authEntity: 'different-entity',
  type: 'api-key',
  payload: 'different-payload',
};

export const testAccessToken: AccessToken = {
  type: 'access-token',
  payload: 'test-access-token',
};

export const differentAccessToken: AccessToken = {
  type: 'access-token',
  payload: 'different-access-token',
};

