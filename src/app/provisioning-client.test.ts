// @vitest-environment happy-dom

import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { beforeEach, expect, it, vi } from 'vitest';
import {
  CloudConfig,
  SetNetworkCredentialsRequest,
  SetSmartMachineCredentialsRequest,
} from '../gen/provisioning/v1/provisioning_pb';
import { ProvisioningServiceClient } from '../gen/provisioning/v1/provisioning_pb_service';
import { ProvisioningClient } from './provisioning-client';

const subject = () =>
  new ProvisioningClient('fakeServiceHost', {
    transport: new FakeTransportBuilder().build(),
  });

const testProvisioningInfo = {
  fragmentId: 'id',
  model: 'model',
  manufacturer: 'manufacturer',
};
const testNetworkInfo = {
  type: 'type',
  ssid: 'ssid',
  security: 'security',
  signal: 999,
  connected: 'true',
  lastError: 'last error',
};
const testSmartMachineStatus = {
  provisioningInfo: testProvisioningInfo,
  hasSmartMachineCredentials: true,
  isOnline: true,
  latestConnectionAttempt: testNetworkInfo,
  errorsList: ['error', 'err'],
};
const type = 'type';
const ssid = 'ssid';
const psk = 'psk';
const cloud = new CloudConfig();
cloud.setId('id');
cloud.setSecret('secret');
cloud.setAppAddress('app_address');

beforeEach(() => {
  ProvisioningServiceClient.prototype.getSmartMachineStatus = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        toObject: () => testSmartMachineStatus,
      });
    });

  ProvisioningServiceClient.prototype.getNetworkList = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        toObject: () => ({ networksList: [testNetworkInfo] }),
      });
    });

  ProvisioningServiceClient.prototype.setNetworkCredentials = vi
    .fn()
    .mockImplementation((req: SetNetworkCredentialsRequest, _md, cb) => {
      expect(req.getType()).toStrictEqual(type);
      expect(req.getSsid()).toStrictEqual(ssid);
      expect(req.getPsk()).toStrictEqual(psk);
      cb(null, {});
    });

  ProvisioningServiceClient.prototype.setSmartMachineCredentials = vi
    .fn()
    .mockImplementation((req: SetSmartMachineCredentialsRequest, _md, cb) => {
      expect(req.getCloud()).toStrictEqual(cloud);
      cb(null, {});
    });
});

it('getSmartMachineStatus', async () => {
  await expect(subject().getSmartMachineStatus()).resolves.toStrictEqual(
    testSmartMachineStatus
  );
});

it('getNetworkList', async () => {
  await expect(subject().getNetworkList()).resolves.toStrictEqual([
    testNetworkInfo,
  ]);
});

it('setNetworkCredentials', async () => {
  await expect(
    subject().setNetworkCredentials(type, ssid, psk)
  ).resolves.toStrictEqual(undefined);
});

it('setSmartMachineCredentials', async () => {
  await expect(
    subject().setSmartMachineCredentials(cloud.toObject())
  ).resolves.toStrictEqual(undefined);
});
