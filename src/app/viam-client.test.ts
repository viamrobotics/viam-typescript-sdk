import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createViamTransportFactory,
  type Credential,
  type AccessToken,
} from './viam-transport';
vi.mock('./viam-transport', () => {
  return {
    createViamTransportFactory: vi
      .fn()
      .mockReturnValue(() => new FakeTransportBuilder().build()),
  };
});
import { DataClient } from './data-client';
import { createViamClient, type ViamClientOptions } from './viam-client';

describe('ViamClient', () => {
  let options: ViamClientOptions | undefined;

  const defaultServiceHost = 'https://app.viam.com';
  const testCredential: Credential = {
    authEntity: 'test-auth-entity',
    type: 'api-key',
    payload: 'testApiKey',
  };
  const testAccessToken: AccessToken = {
    type: 'access-token',
    payload: 'testAccessToken',
  };

  const subject = () => createViamClient(options!);

  beforeEach(() => {
    options = undefined;
  });

  test('create client with api key and default service host', async () => {
    options = { credential: testCredential };
    const client = await subject();
    expect(createViamTransportFactory).toHaveBeenCalledWith(
      defaultServiceHost,
      testCredential
    );
    expect(client.dataClient).toBeInstanceOf(DataClient);
  });

  test('create client with api key custom service host', async () => {
    const serviceHost = 'https://test.service.host';
    options = { serviceHost, credential: testCredential };
    const client = await subject();

    expect(createViamTransportFactory).toHaveBeenCalledWith(
      serviceHost,
      testCredential
    );
    expect(client.dataClient).toBeInstanceOf(DataClient);
  });

  test('create client with access token', async () => {
    options = { credential: testAccessToken };
    const client = await subject();

    expect(createViamTransportFactory).toHaveBeenCalledWith(
      defaultServiceHost,
      testAccessToken
    );
    expect(client.dataClient).toBeInstanceOf(DataClient);
  });
});
