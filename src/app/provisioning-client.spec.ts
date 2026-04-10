// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest';
import { create } from '@bufbuild/protobuf';
import { createRouterTransport, type Transport } from '@connectrpc/connect';

import {
  APIKeySchema,
  CloudConfigSchema,
  GetNetworkListResponseSchema,
  GetSmartMachineStatusResponseSchema,
  NetworkInfoSchema,
  ProvisioningService,
  type SetNetworkCredentialsRequest,
  SetNetworkCredentialsResponseSchema,
  type SetSmartMachineCredentialsRequest,
  SetSmartMachineCredentialsResponseSchema,
} from '../gen/provisioning/v1/provisioning_pb';
import { ProvisioningClient } from './provisioning-client';

let mockTransport: Transport;
const subject = () => new ProvisioningClient(mockTransport);

const testProvisioningInfo = {
  fragmentId: 'id',
  model: 'model',
  manufacturer: 'manufacturer',
};
const testNetworkInfo = create(NetworkInfoSchema, {
  type: 'type',
  ssid: 'ssid',
  security: 'security',
  signal: 999,
  connected: true,
  lastError: 'last error',
});
const testSmartMachineStatus = create(GetSmartMachineStatusResponseSchema, {
  provisioningInfo: testProvisioningInfo,
  hasSmartMachineCredentials: true,
  isOnline: true,
  latestConnectionAttempt: testNetworkInfo,
  errors: ['error', 'err'],
});
const type = 'type';
const ssid = 'ssid';
const psk = 'psk';
const apiKey = create(APIKeySchema, {
  id: 'api_key_id',
  key: 'api_key_value',
});
const cloud = create(CloudConfigSchema, {
  id: 'id',
  secret: 'secret',
  appAddress: 'app_address',
  apiKey,
});

let setNetworkCredentialsReq: SetNetworkCredentialsRequest;
let setSmartMachineCredentialsReq: SetSmartMachineCredentialsRequest;
describe('ProvisioningClient tests', () => {
  beforeEach(() => {
    mockTransport = createRouterTransport(({ service }) => {
      service(ProvisioningService, {
        getSmartMachineStatus: () => testSmartMachineStatus,
        getNetworkList: () => {
          return create(GetNetworkListResponseSchema, {
            networks: [testNetworkInfo],
          });
        },
        setNetworkCredentials: (req) => {
          setNetworkCredentialsReq = req;
          return create(SetNetworkCredentialsResponseSchema);
        },
        setSmartMachineCredentials: (req) => {
          setSmartMachineCredentialsReq = req;
          return create(SetSmartMachineCredentialsResponseSchema);
        },
      });
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
    expect(setNetworkCredentialsReq.type).toStrictEqual(type);
    expect(setNetworkCredentialsReq.ssid).toStrictEqual(ssid);
    expect(setNetworkCredentialsReq.psk).toStrictEqual(psk);
  });

  it('setSmartMachineCredentials', async () => {
    await expect(
      subject().setSmartMachineCredentials(cloud)
    ).resolves.toStrictEqual(undefined);
    expect(setSmartMachineCredentialsReq.cloud).toStrictEqual(cloud);
  });
});
