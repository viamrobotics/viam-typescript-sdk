import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { type DialOptions } from '@viamrobotics/rpc/src/dial';
import { describe, expect, test, vi } from 'vitest';
import { createViamTransportFactory } from './viam-transport';
vi.mock('./viam-transport', () => {
  return {
    createViamTransportFactory: vi
      .fn()
      .mockReturnValue(() => new FakeTransportBuilder().build()),
  };
});
import { DataClient } from './data-client';
import { ViamClient } from './viam-client';

describe('ViamClient', () => {
  let dialOpts: DialOptions = {};
  let serviceHost: string | undefined;
  const defaultServiceHost = 'https://app.viam.com:443';
  const subject = () => new ViamClient(dialOpts, serviceHost);

  test('create client with defaults', async () => {
    const client = subject();
    expect(client.dataClient).toBeUndefined();

    await client.connect();
    expect(createViamTransportFactory).toHaveBeenCalledWith(
      defaultServiceHost,
      dialOpts
    );
    expect(client.dataClient).toBeInstanceOf(DataClient);
  });

  test('create client with custom service host', async () => {
    serviceHost = 'https://test.service.host';
    const client = subject();
    await client.connect();

    expect(createViamTransportFactory).toHaveBeenCalledWith(
      serviceHost,
      dialOpts
    );
    expect(client.dataClient).toBeInstanceOf(DataClient);

    serviceHost = undefined;
  });

  test('create client with custom dial options', async () => {
    dialOpts = {
      authEntity: 'test-auth-entity',
      credentials: {
        type: 'api-key',
        payload: 'testApiKey',
      },
    };
    const client = subject();
    await client.connect();

    expect(createViamTransportFactory).toHaveBeenCalledWith(
      defaultServiceHost,
      dialOpts
    );
    expect(client.dataClient).toBeInstanceOf(DataClient);
  });
});
