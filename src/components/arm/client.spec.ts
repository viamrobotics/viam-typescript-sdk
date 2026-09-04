// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createClient, createRouterTransport } from '@connectrpc/connect';
import { ArmService } from '../../gen/component/arm/v1/arm_connect';
import {
  type GetManualModeRequest,
  GetManualModeResponse,
  type GetPropertiesRequest,
  GetPropertiesResponse,
  type SetManualModeRequest,
  SetManualModeResponse,
} from '../../gen/component/arm/v1/arm_pb';
import { RobotClient } from '../../robot';
import { ArmClient } from './client';
vi.mock('../../robot');

let arm: ArmClient;
const testSupportManualMode = true;
const testSupportCartesianCommands = false;
const testManualMode = true;

let capturedSetManualModeRequest: SetManualModeRequest | undefined;
let capturedGetManualModeRequest: GetManualModeRequest | undefined;
let capturedGetPropertiesRequest: GetPropertiesRequest | undefined;

describe('ArmClient tests', () => {
  beforeEach(() => {
    capturedSetManualModeRequest = undefined;
    capturedGetManualModeRequest = undefined;
    capturedGetPropertiesRequest = undefined;

    const mockTransport = createRouterTransport(({ service }) => {
      service(ArmService, {
        getProperties: (request) => {
          capturedGetPropertiesRequest = request;
          return new GetPropertiesResponse({
            supportManualMode: testSupportManualMode,
            supportCartesianCommands: testSupportCartesianCommands,
          });
        },
        setManualMode: (request) => {
          capturedSetManualModeRequest = request;
          return new SetManualModeResponse();
        },
        getManualMode: (request) => {
          capturedGetManualModeRequest = request;
          return new GetManualModeResponse({ manualMode: testManualMode });
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(ArmService, mockTransport));

    arm = new ArmClient(new RobotClient('host'), 'test-arm');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getProperties', async () => {
    await expect(arm.getProperties()).resolves.toStrictEqual({
      supportManualMode: testSupportManualMode,
      supportCartesianCommands: testSupportCartesianCommands,
    });
    expect(capturedGetPropertiesRequest?.name).toBe('test-arm');
  });

  it('setManualMode', async () => {
    await expect(arm.setManualMode(true, 60)).resolves.toBeUndefined();
    expect(capturedSetManualModeRequest?.name).toBe('test-arm');
    expect(capturedSetManualModeRequest?.manualMode).toBe(true);
    expect(capturedSetManualModeRequest?.enabledFor).toBe(60);
  });

  it('setManualMode with no time limit', async () => {
    await expect(arm.setManualMode(false)).resolves.toBeUndefined();
    expect(capturedSetManualModeRequest?.manualMode).toBe(false);
    expect(capturedSetManualModeRequest?.enabledFor).toBe(0);
  });

  it('getManualMode', async () => {
    await expect(arm.getManualMode()).resolves.toBe(testManualMode);
    expect(capturedGetManualModeRequest?.name).toBe('test-arm');
  });
});
