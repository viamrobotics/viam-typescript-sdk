import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
import { createRobotClient } from '../robot';
vi.mock('../robot', () => {
  return { createRobotClient: vi.fn() };
});
import { DataClient } from './data-client';
import { BillingClient } from './billing-client';
import { createViamClient, type ViamClientOptions } from './viam-client';
import { MlTrainingClient } from './ml-training-client';
import { ProvisioningClient } from './provisioning-client';
import { AppClient } from './app-client';
import { RobotPart } from '../gen/app/v1/app_pb';

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

  const subject = async () => createViamClient(options!);

  beforeEach(() => {
    options = undefined;
  });

  it('create client with an api key credential', async () => {
    options = { credential: testCredential };
    const client = await subject();
    expect(createViamTransportFactory).toHaveBeenCalledWith(
      defaultServiceHost,
      testCredential
    );
    expect(client.appClient).toBeInstanceOf(AppClient);
    expect(client.dataClient).toBeInstanceOf(DataClient);
    expect(client.mlTrainingClient).toBeInstanceOf(MlTrainingClient);
    expect(client.provisioningClient).toBeInstanceOf(ProvisioningClient);
    expect(client.billingClient).toBeInstanceOf(BillingClient);
  });

  it('create client with an api key credential and a custom service host', async () => {
    const serviceHost = 'https://test.service.host';
    options = { serviceHost, credential: testCredential };
    const client = await subject();

    expect(createViamTransportFactory).toHaveBeenCalledWith(
      serviceHost,
      testCredential
    );
    expect(client.appClient).toBeInstanceOf(AppClient);
    expect(client.dataClient).toBeInstanceOf(DataClient);
    expect(client.mlTrainingClient).toBeInstanceOf(MlTrainingClient);
    expect(client.provisioningClient).toBeInstanceOf(ProvisioningClient);
    expect(client.billingClient).toBeInstanceOf(BillingClient);
  });

  it('create client with an access token', async () => {
    options = { credential: testAccessToken };
    const client = await subject();

    expect(createViamTransportFactory).toHaveBeenCalledWith(
      defaultServiceHost,
      testAccessToken
    );
    expect(client.appClient).toBeInstanceOf(AppClient);
    expect(client.dataClient).toBeInstanceOf(DataClient);
    expect(client.mlTrainingClient).toBeInstanceOf(MlTrainingClient);
    expect(client.provisioningClient).toBeInstanceOf(ProvisioningClient);
    expect(client.billingClient).toBeInstanceOf(BillingClient);
  });

  describe('ViamClient.connectToMachine', () => {
    it('gets main part address', async () => {
      const MAIN_PART = new RobotPart();
      MAIN_PART.setMainPart(true);
      MAIN_PART.setFqdn('main.part.fqdn');

      const robotParts = [MAIN_PART];
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < 1000; i++) {
        const part = new RobotPart();
        part.setMainPart(false);
        robotParts.push(part);
      }
      robotParts.sort(() => Math.random() - 0.5);

      const getRobotPartsMock = vi.fn().mockImplementation(() => robotParts);
      AppClient.prototype.getRobotParts = getRobotPartsMock;

      options = { credential: testCredential };
      const client = await subject();
      await client.connectToMachine({ id: 'test-machine-uuid' });

      expect(getRobotPartsMock).toHaveBeenCalledWith('test-machine-id');
    });
  });
});
