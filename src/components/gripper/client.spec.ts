// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { create } from '@bufbuild/protobuf';
import { createClient, createRouterTransport } from '@connectrpc/connect';
import { GripperService } from '../../gen/component/gripper/v1/gripper_pb';
import {
  GrabResponseSchema,
  IsHoldingSomethingResponseSchema,
  IsMovingResponseSchema,
  OpenResponseSchema,
  StopResponseSchema,
} from '../../gen/component/gripper/v1/gripper_pb';
import { RobotClient } from '../../robot';
import { GripperClient } from './client';
vi.mock('../../robot');

let gripper: GripperClient;
const testIsMoving = true;
const testIsHoldingSomething = true;

describe('GripperClient tests', () => {
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(GripperService, {
        open: () => {
          return create(OpenResponseSchema, {});
        },
        grab: () => {
          return create(GrabResponseSchema, { success: true });
        },
        stop: () => {
          return create(StopResponseSchema, {});
        },
        isMoving: () => {
          return create(IsMovingResponseSchema, { isMoving: testIsMoving });
        },
        isHoldingSomething: () => {
          return create(IsHoldingSomethingResponseSchema, {
            isHoldingSomething: testIsHoldingSomething,
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
    await expect(gripper.isHoldingSomething()).resolves.toBe(
      testIsHoldingSomething
    );
  });
});
