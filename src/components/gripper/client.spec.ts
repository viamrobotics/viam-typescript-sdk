// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createClient, createRouterTransport } from '@connectrpc/connect';
import { GripperService } from '../../gen/component/gripper/v1/gripper_connect';
import {
  GetCurrentInputsResponse,
  GoToInputsResponse,
  GrabResponse,
  IsHoldingSomethingResponse,
  IsMovingResponse,
  OpenResponse,
  StopResponse,
} from '../../gen/component/gripper/v1/gripper_pb';
import {
  type GetKinematicsRequest,
  GetKinematicsResponse,
  JointType,
} from '../../gen/common/v1/common_pb';
import { RobotClient } from '../../robot';
import { GripperClient } from './client';
vi.mock('../../robot');

let gripper: GripperClient;
const testIsMoving = true;
const testIsHoldingSomething = true;
const testCurrentInputs = [0.5, 1];
let kinematicsRequest: GetKinematicsRequest | undefined;

describe('GripperClient tests', () => {
  beforeEach(() => {
    kinematicsRequest = undefined;

    const mockTransport = createRouterTransport(({ service }) => {
      service(GripperService, {
        open: () => {
          return new OpenResponse();
        },
        grab: () => {
          return new GrabResponse({ success: true });
        },
        stop: () => {
          return new StopResponse();
        },
        isMoving: () => {
          return new IsMovingResponse({ isMoving: testIsMoving });
        },
        isHoldingSomething: () => {
          return new IsHoldingSomethingResponse({
            isHoldingSomething: testIsHoldingSomething,
          });
        },
        getCurrentInputs: () => {
          return new GetCurrentInputsResponse({ values: testCurrentInputs });
        },
        goToInputs: () => {
          return new GoToInputsResponse();
        },
        getKinematics: (request) => {
          kinematicsRequest = request;
          return new GetKinematicsResponse({
            model: {
              name: request.name,
              joints: [
                {
                  id: 'finger',
                  type: JointType.PRISMATIC,
                  limits: { min: 0, max: 80, maxVelocity: 100 },
                },
              ],
            },
          });
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(GripperService, mockTransport));

    gripper = new GripperClient(new RobotClient('host'), 'test-gripper');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getKinematicModel', async () => {
    const model = await gripper.getKinematicModel({ includeCollisionMeshes: true });

    expect(kinematicsRequest?.name).toBe('test-gripper');
    expect(kinematicsRequest?.includeCollisionMeshes).toBe(true);
    expect(kinematicsRequest?.includeVisualMeshes).toBe(false);

    expect(model.name).toBe('test-gripper');
    expect(model.joints[0]?.limits?.maxVelocity).toBe(100);
  });

  it('open', async () => {
    await expect(gripper.open()).resolves.toBeUndefined();
  });

  it('grab', async () => {
    await expect(gripper.grab()).resolves.toBeUndefined();
  });

  it('stop', async () => {
    await expect(gripper.stop()).resolves.toBeUndefined();
  });

  it('isMoving', async () => {
    await expect(gripper.isMoving()).resolves.toBe(testIsMoving);
  });

  it('isHoldingSomething', async () => {
    await expect(gripper.isHoldingSomething()).resolves.toBe(testIsHoldingSomething);
  });

  it('getCurrentInputs', async () => {
    await expect(gripper.getCurrentInputs()).resolves.toStrictEqual(testCurrentInputs);
  });

  it('goToInputs', async () => {
    await expect(gripper.goToInputs([0.5, 1])).resolves.toBeUndefined();
  });
});
