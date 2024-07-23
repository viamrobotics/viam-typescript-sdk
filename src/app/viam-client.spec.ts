// @vitest-environment happy-dom

import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createViamTransportFactory,
  type Credential,
  type AccessToken,
} from './viam-transport';
vi.mock('./viam-transport', async (actualImport) => {
  const actual = await actualImport<typeof import('./viam-transport')>();
  return {
    ...actual,
    createViamTransportFactory: vi
      .fn()
      .mockReturnValue(() => new FakeTransportBuilder().build()),
  };
});
import { createRobotClient } from '../robot/dial';
vi.mock('../robot/dial', () => {
  return { createRobotClient: vi.fn() };
});
import { DataClient } from './data-client';
import { BillingClient } from './billing-client';
import { createViamClient, type ViamClientOptions } from './viam-client';
import { MlTrainingClient } from './ml-training-client';
import { ProvisioningClient } from './provisioning-client';
import { AppClient } from './app-client';
import { Location, RobotPart, SharedSecret } from '../gen/app/v1/app_pb';

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
    it('errors if neither host nor id are provided', async () => {
      options = { credential: testCredential };
      const client = await subject();
      await expect(async () =>
        client.connectToMachine({})
      ).rejects.toThrowError('must be provided');
    });

    it('errors if no main part found', async () => {
      options = { credential: testCredential };
      const client = await subject();

      const getRobotPartsMock = vi.fn().mockImplementation(() => []);
      AppClient.prototype.getRobotParts = getRobotPartsMock;

      await expect(async () =>
        client.connectToMachine({ id: 'test-machine-uuid' })
      ).rejects.toThrowError('not find a main part');
    });

    it('gets main part address', async () => {
      const MAIN_PART = new RobotPart();
      MAIN_PART.setMainPart(true);
      MAIN_PART.setFqdn('main.part.fqdn');

      const robotParts = [MAIN_PART.toObject()];
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < 1000; i++) {
        const part = new RobotPart();
        part.setMainPart(false);
        robotParts.push(part.toObject());
      }
      robotParts.sort(() => Math.random() - 0.5);

      const getRobotPartsMock = vi.fn().mockImplementation(() => robotParts);
      AppClient.prototype.getRobotParts = getRobotPartsMock;

      options = { credential: testCredential };
      const client = await subject();
      await client.connectToMachine({ id: 'test-machine-uuid' });

      expect(getRobotPartsMock).toHaveBeenCalledWith('test-machine-uuid');
      expect(createRobotClient).toHaveBeenCalledWith(
        expect.objectContaining({ host: MAIN_PART.getFqdn() })
      );
    });

    it('errors if no address could be found', async () => {
      options = { credential: testCredential };
      const client = await subject();

      const MAIN_PART = new RobotPart();
      MAIN_PART.setMainPart(true);
      const robotParts = [MAIN_PART.toObject()];
      const getRobotPartsMock = vi.fn().mockImplementation(() => robotParts);
      AppClient.prototype.getRobotParts = getRobotPartsMock;

      await expect(async () =>
        client.connectToMachine({ id: 'test-machine-uuid' })
      ).rejects.toThrowError('not provided and could not be obtained');
    });

    it('gets location secret if credential is access token -- host', async () => {
      options = { credential: testAccessToken };
      const client = await subject();

      const location = new Location().toObject();
      location.auth = {
        secretsList: [
          {
            id: '0',
            state: SharedSecret.State.STATE_DISABLED,
            secret: 'disabled secret',
          },
          {
            id: '1',
            state: SharedSecret.State.STATE_UNSPECIFIED,
            secret: 'unspecified secret',
          },
          {
            id: '2',
            state: SharedSecret.State.STATE_ENABLED,
            secret: 'enabled secret',
          },
        ],
        locationId: 'location',
        secret: 'secret',
      };
      const getLocationMock = vi.fn().mockImplementation(() => location);
      AppClient.prototype.getLocation = getLocationMock;

      await client.connectToMachine({
        host: 'main-part.location.viam.cloud',
      });
      expect(getLocationMock).toHaveBeenCalledWith('location');
      expect(createRobotClient).toHaveBeenCalledWith(
        expect.objectContaining({
          credential: expect.objectContaining({
            type: 'robot-location-secret',
            payload: 'enabled secret',
          }),
        })
      );
    });

    it('gets location secret if credential is access token -- id', async () => {
      options = { credential: testAccessToken };
      const client = await subject();

      const MAIN_PART = new RobotPart();
      MAIN_PART.setMainPart(true);
      MAIN_PART.setLocationId('location-id');
      MAIN_PART.setFqdn('main-part.fqdn');
      const robotParts = [MAIN_PART.toObject()];
      const getRobotPartsMock = vi.fn().mockImplementation(() => robotParts);
      AppClient.prototype.getRobotParts = getRobotPartsMock;

      const location = new Location().toObject();
      location.auth = {
        secretsList: [
          {
            id: '0',
            state: SharedSecret.State.STATE_DISABLED,
            secret: 'disabled secret',
          },
          {
            id: '1',
            state: SharedSecret.State.STATE_UNSPECIFIED,
            secret: 'unspecified secret',
          },
          {
            id: '2',
            state: SharedSecret.State.STATE_ENABLED,
            secret: 'enabled secret',
          },
        ],
        locationId: 'location',
        secret: 'secret',
      };
      const getLocationMock = vi.fn().mockImplementation(() => location);
      AppClient.prototype.getLocation = getLocationMock;

      await client.connectToMachine({
        id: 'machine-uuid',
      });
      expect(getLocationMock).toHaveBeenCalledWith('location-id');
      expect(createRobotClient).toHaveBeenCalledWith(
        expect.objectContaining({
          credential: expect.objectContaining({
            type: 'robot-location-secret',
            payload: 'enabled secret',
          }),
        })
      );
    });
  });
});
