// @vitest-environment happy-dom

import { expect } from 'chai';
import { beforeEach, it, vi } from 'vitest';
import { ProvisioningServiceClient } from '../gen/provisioning/v1/provisioning_pb_service';
import { RobotClient } from '../robot';
import { ProvisioningClient } from './client';


let provisioning: ProvisioningClient;

const testProvisioningInfo = {fragmentId: "id", model: "model", manufacturer: "manufacturer"};
const testNetworkInfo = {type: "type", ssid: "ssid", security: "security", signal: 999, connected: "true", lastError: "last error"};
const testSmartMachineStatus = {provisioningInfo: testProvisioningInfo, hasSmartMachineCredentials: true, isOnline: true, latestConnectionAttempt: testNetworkInfo, errorsList: ["error", "err"]};

beforeEach(() => {
  RobotClient.prototype.createServiceClient = vi
    .fn()
    .mockImplementation(
      () => new ProvisioningServiceClient('test-provisioning')
    );

  ProvisioningServiceClient.prototype.getSmartMachineStatus = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        toObject: () => testSmartMachineStatus,
      })
    });

  ProvisioningServiceClient.prototype.getNetworkList = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        toObject: () => ({"networksList": [testNetworkInfo]}),
      })
    });
  
  provisioning = new ProvisioningClient(
    new RobotClient('host')
  );
});

it('getSmartMachineStatus', async () => {
  await expect(provisioning.getSmartMachineStatus()).resolves.toStrictEqual(testSmartMachineStatus);
});

it('getNetworkList', async () => {
  await expect(provisioning.getNetworkList()).resolves.toStrictEqual([testNetworkInfo]);
})
