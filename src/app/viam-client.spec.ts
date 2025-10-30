// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GetRobotPartByNameAndLocationResponse,
  RobotPart,
} from '../gen/app/v1/app_pb';
import { createRobotClient } from '../robot/dial';
import { AppClient } from './app-client';
import { BillingClient } from './billing-client';
import { DataClient } from './data-client';
import { MlTrainingClient } from './ml-training-client';
import { ProvisioningClient } from './provisioning-client';
import { createViamClient, type ViamClientOptions } from './viam-client';
import {
  createViamTransport,
  type AccessToken,
  type Credential,
} from './viam-transport';
vi.mock('./viam-transport', async (actualImport) => {
  const actual = await actualImport<typeof import('./viam-transport')>();
  return {
    ...actual,
    createViamTransport: vi.fn().mockReturnValue(() => undefined),
  };
});
vi.mock('../robot/dial', () => {
  return { createRobotClient: vi.fn() };
});

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
    options = { credentials: testCredential };
    const client = await subject();
    expect(createViamTransport).toHaveBeenCalledWith(
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
    options = { serviceHost, credentials: testCredential };
    const client = await subject();

    expect(createViamTransport).toHaveBeenCalledWith(
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
    options = { credentials: testAccessToken };
    const client = await subject();

    expect(createViamTransport).toHaveBeenCalledWith(
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
    it('errors if neither host nor id are provided', async () => {
      options = { credentials: testCredential };
      const client = await subject();
      await expect(async () =>
        client.connectToMachine({})
      ).rejects.toThrowError('must be provided');
    });

    it('errors if no main part found', async () => {
      options = { credentials: testCredential };
      const client = await subject();

      const getRobotPartsMock = vi.fn().mockImplementation(() => []);
      AppClient.prototype.getRobotParts = getRobotPartsMock;

      await expect(async () =>
        client.connectToMachine({ id: 'test-machine-uuid' })
      ).rejects.toThrowError('not find a main part');
    });

    it('gets main part address', async () => {
      const MAIN_PART = new RobotPart({
        mainPart: true,
        fqdn: 'main.part.fqdn',
      });

      const robotParts = [MAIN_PART];
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < 1000; i++) {
        const part = new RobotPart({
          mainPart: false,
        });
        robotParts.push(part);
      }
      robotParts.sort(() => Math.random() - 0.5);

      const getRobotPartsMock = vi.fn().mockImplementation(() => robotParts);
      AppClient.prototype.getRobotParts = getRobotPartsMock;

      options = { credentials: testCredential };
      const client = await subject();
      await client.connectToMachine({ id: 'test-machine-uuid' });

      expect(getRobotPartsMock).toHaveBeenCalledWith('test-machine-uuid');
      expect(createRobotClient).toHaveBeenCalledWith(
        expect.objectContaining({ host: MAIN_PART.fqdn })
      );
    });

    it('errors if no address could be found', async () => {
      options = { credentials: testCredential };
      const client = await subject();

      const MAIN_PART = new RobotPart({
        mainPart: true,
      });
      const robotParts = [MAIN_PART];
      const getRobotPartsMock = vi.fn().mockImplementation(() => robotParts);
      AppClient.prototype.getRobotParts = getRobotPartsMock;

      await expect(async () =>
        client.connectToMachine({ id: 'test-machine-uuid' })
      ).rejects.toThrowError('not provided and could not be obtained');
    });

    it('gets robot secret if credential is access token -- host', async () => {
      options = { credentials: testAccessToken };
      const client = await subject();

      const MAIN_PART = new RobotPart({
        mainPart: true,
        name: 'main-part',
        secret: 'fake-robot-secret',
      });
      const partByNameAndLocationResponse =
        new GetRobotPartByNameAndLocationResponse({
          part: MAIN_PART,
        });
      const getRobotPartByNameAndLocationMock = vi
        .fn()
        .mockImplementation(() => partByNameAndLocationResponse);
      AppClient.prototype.getRobotPartByNameAndLocation =
        getRobotPartByNameAndLocationMock;

      await client.connectToMachine({
        host: 'main-part.location.viam.cloud',
      });
      expect(getRobotPartByNameAndLocationMock).toHaveBeenCalledWith(
        'main-part',
        'location'
      );
      expect(createRobotClient).toHaveBeenCalledWith(
        expect.objectContaining({
          credentials: expect.objectContaining({
            type: 'robot-secret',
            payload: 'fake-robot-secret',
          }),
        })
      );
    });

    it('gets robot secret if credential is access token -- id', async () => {
      options = { credentials: testAccessToken };
      const client = await subject();

      const MAIN_PART = new RobotPart({
        mainPart: true,
        fqdn: 'main-part.fqdn',
        secret: 'fake-robot-secret',
      });
      const robotParts = [MAIN_PART];
      const getRobotPartsMock = vi.fn().mockImplementation(() => robotParts);
      AppClient.prototype.getRobotParts = getRobotPartsMock;

      await client.connectToMachine({
        id: 'machine-uuid',
      });
      expect(getRobotPartsMock).toHaveBeenCalledWith('machine-uuid');
      expect(createRobotClient).toHaveBeenCalledWith(
        expect.objectContaining({
          credentials: expect.objectContaining({
            type: 'robot-secret',
            payload: 'fake-robot-secret',
          }),
        })
      );
    });
  });
});
