/*
 *  @vitest-environment happy-dom
 */

import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { MotionServiceClient } from '../../gen/service/motion/v1/motion_pb_service';
import pb from '../../gen/service/motion/v1/motion_pb';
import { RobotClient } from '../../robot';
vi.mock('../../gen/service/motion/v1/motion_pb_service');
vi.mock('../../robot');

import { MotionClient } from './client';

const motionClientName = 'test-motion';
const date = new Date(1, 1, 1, 1, 1, 1);

let motion: MotionClient;

beforeEach(() => {
  RobotClient.prototype.createServiceClient = vi
    .fn()
    .mockImplementation(() => new MotionServiceClient(motionClientName));

  motion = new MotionClient(new RobotClient('host'), motionClientName);
});

const testExecutionId = 'some execution id';

describe('moveOnGlobe', () => {
  let executionId: Mock<[], string>;

  it('return executionID', async () => {
    executionId = vi.fn(() => testExecutionId);

    const expectedMotionName = motionClientName;
    const expectedDestination = { latitude: 1, longitude: 2 };
    const expectedObstaclesList: pb.ObstacleDetector[] = [];
    const expectedHeading = 0;
    const expectedComponentName = {
      namespace: 'viam',
      type: 'component',
      subtype: 'base',
      name: 'myBase',
      machinePartId: '',
    };
    const expectedMovementSensorName = {
      namespace: 'viam',
      type: 'component',
      subtype: 'movementsensor',
      name: 'myMovementsensor',
      machinePartId: '',
    };
    const expectedMotionConfiguration = undefined;
    const expectedExtra = {};
    const mock = vi
      .fn()
      .mockImplementation((req: pb.MoveOnGlobeRequest, _md, cb) => {
        expect(req.getName()).toStrictEqual(expectedMotionName);
        expect(req.getDestination()?.toObject()).toStrictEqual(
          expectedDestination
        );
        expect(req.getHeading()).toStrictEqual(expectedHeading);
        expect(req.getComponentName()?.toObject()).toStrictEqual(
          expectedComponentName
        );
        expect(req.getMovementSensorName()?.toObject()).toStrictEqual(
          expectedMovementSensorName
        );
        expect(req.getObstaclesList()).toEqual(expectedObstaclesList);
        expect(req.getMotionConfiguration()).toStrictEqual(
          expectedMotionConfiguration
        );
        expect(req.getExtra()?.toObject()).toStrictEqual(
          Struct.fromJavaScript(expectedExtra).toObject()
        );
        cb(null, {
          toObject: () => ({
            executionId: executionId(),
          }),
        });
      });
    MotionServiceClient.prototype.moveOnGlobe = mock;

    await expect(
      motion.moveOnGlobe(
        { latitude: 1, longitude: 2 },
        {
          namespace: 'viam',
          type: 'component',
          subtype: 'base',
          name: 'myBase',
          machinePartId: '',
        },
        {
          namespace: 'viam',
          type: 'component',
          subtype: 'movementsensor',
          name: 'myMovementsensor',
          machinePartId: '',
        }
      )
    ).resolves.toStrictEqual(testExecutionId);

    expect(mock).toHaveBeenCalledOnce();
    expect(executionId).toHaveBeenCalledOnce();
  });

  it('allows optionally specifying heading, obstacles, motionConfig & extra', async () => {
    executionId = vi.fn(() => testExecutionId);
    const expectedMotionName = motionClientName;
    const expectedDestination = { latitude: 1, longitude: 2 };
    const expectedObstaclesList = [
      {
        location: { latitude: 3, longitude: 5 },
        geometriesList: [
          {
            center: {
              x: 1,
              y: 2,
              z: 3,
              oX: 4,
              oY: 5,
              oZ: 6,
              theta: 7,
            },
            sphere: { radiusMm: 100 },
            label: 'my label',
          },
        ],
      },
    ];
    const expectedHeading = 60;
    const expectedComponentName = {
      namespace: 'viam',
      type: 'component',
      subtype: 'base',
      name: 'myBase',
      machinePartId: '',
    };
    const expectedMovementSensorName = {
      namespace: 'viam',
      type: 'component',
      subtype: 'movementsensor',
      name: 'myMovementsensor',
      machinePartId: '',
    };
    const expectedMotionConfiguration = {
      obstacleDetectorsList: [
        {
          visionService: {
            namespace: 'viam',
            type: 'service',
            subtype: 'vision',
            name: 'myVisionService',
            machinePartId: '',
          },
          camera: {
            namespace: 'viam',
            type: 'component',
            subtype: 'camera',
            name: 'myCamera',
            machinePartId: '',
          },
        },
      ],
      positionPollingFrequencyHz: 20,
      obstaclePollingFrequencyHz: 30,
      planDeviationM: 2,
      linearMPerSec: 2,
      angularDegsPerSec: 180,
    };
    const expectedExtra = { some: 'extra' };
    const mock = vi
      .fn()
      .mockImplementation((req: pb.MoveOnGlobeRequest, _md, cb) => {
        expect(req.getName()).toStrictEqual(expectedMotionName);
        expect(req.getDestination()?.toObject()).toStrictEqual(
          expectedDestination
        );
        expect(req.getHeading()).toStrictEqual(expectedHeading);
        expect(req.getComponentName()?.toObject()).toStrictEqual(
          expectedComponentName
        );
        expect(req.getMovementSensorName()?.toObject()).toStrictEqual(
          expectedMovementSensorName
        );
        expect(req.getObstaclesList().map((x) => x.toObject())).toEqual(
          expectedObstaclesList
        );
        expect(req.getMotionConfiguration()?.toObject()).toStrictEqual(
          expectedMotionConfiguration
        );
        expect(req.getExtra()?.toObject()).toStrictEqual(
          Struct.fromJavaScript(expectedExtra).toObject()
        );
        cb(null, {
          toObject: () => ({
            executionId: executionId(),
          }),
        });
      });

    MotionServiceClient.prototype.moveOnGlobe = mock;
    await expect(
      motion.moveOnGlobe(
        expectedDestination,
        expectedComponentName,
        expectedMovementSensorName,
        expectedHeading,
        expectedObstaclesList,
        expectedMotionConfiguration,
        expectedExtra
      )
    ).resolves.toStrictEqual(testExecutionId);
    expect(mock).toHaveBeenCalledOnce();

    expect(executionId).toHaveBeenCalledOnce();
  });
});

describe('stopPlan', () => {
  it('return null', async () => {
    const expectedComponentName = {
      namespace: 'viam',
      type: 'component',
      subtype: 'base',
      name: 'myBase',
      machinePartId: '',
    };
    const expectedExtra = {};
    const mock = vi
      .fn()
      .mockImplementation((req: pb.StopPlanRequest, _md, cb) => {
        expect(req.getComponentName()?.toObject()).toStrictEqual(
          expectedComponentName
        );
        expect(req.getExtra()?.toObject()).toStrictEqual(
          Struct.fromJavaScript(expectedExtra).toObject()
        );
        cb(null, {});
      });
    MotionServiceClient.prototype.stopPlan = mock;
    await expect(motion.stopPlan(expectedComponentName)).resolves.toStrictEqual(
      null
    );
  });

  it('allows optionally specifying extra', async () => {
    const expectedComponentName = {
      namespace: 'viam',
      type: 'component',
      subtype: 'base',
      name: 'myBase',
      machinePartId: '',
    };
    const expectedExtra = { some: 'extra' };
    const mock = vi
      .fn()
      .mockImplementation((req: pb.StopPlanRequest, _md, cb) => {
        expect(req.getComponentName()?.toObject()).toStrictEqual(
          expectedComponentName
        );
        expect(req.getExtra()?.toObject()).toStrictEqual(
          Struct.fromJavaScript(expectedExtra).toObject()
        );
        cb(null, {});
      });
    MotionServiceClient.prototype.stopPlan = mock;
    await expect(
      motion.stopPlan(expectedComponentName, expectedExtra)
    ).resolves.toStrictEqual(null);
  });
});

describe('getPlan', () => {
  const expectedResponse = {
    toObject: () => ({
      currentPlanWithStatus: {
        plan: {
          id: 'planId',
          componentName: {
            namespace: 'viam',
            type: 'component',
            subtype: 'base',
            name: 'myBase',
          },
          executionId: 'executionId',
          stepsList: [
            [
              'viam:component:base/myBase',
              {
                pose: {
                  x: 10,
                  y: 20,
                  z: 30,
                  oX: 40,
                  oY: 50,
                  oZ: 60,
                  theta: 70,
                },
              },
            ],
          ],
        },
        status: {
          status: pb.PlanState.PLAN_STATE_IN_PROGRESS,
          timestamp: Timestamp.fromDate(date),
        },
        statusHistoryList: [],
      },
      replanHistoryList: [],
    }),
  };

  it('return GetPlanResponse', async () => {
    const expectedComponentName = {
      namespace: 'viam',
      type: 'component',
      subtype: 'base',
      name: 'myBase',
      machinePartId: '',
    };
    const expectedLastPlanOnly = false;
    const expectedExecutionID = '';
    const expectedExtra = {};
    const mock = vi
      .fn()
      .mockImplementation((req: pb.GetPlanRequest, _md, cb) => {
        expect(req.getComponentName()?.toObject()).toStrictEqual(
          expectedComponentName
        );
        expect(req.getLastPlanOnly()).toStrictEqual(expectedLastPlanOnly);
        expect(req.getExecutionId()).toStrictEqual(expectedExecutionID);
        expect(req.getExtra()?.toObject()).toStrictEqual(
          Struct.fromJavaScript(expectedExtra).toObject()
        );
        cb(null, expectedResponse);
      });
    MotionServiceClient.prototype.getPlan = mock;
    await expect(motion.getPlan(expectedComponentName)).resolves.toStrictEqual(
      expectedResponse.toObject()
    );
    expect(mock).toHaveBeenCalledOnce();
  });

  it('allows optionally specifying lastPlanOnly, executionID, and extra', async () => {
    const expectedComponentName = {
      namespace: 'viam',
      type: 'component',
      subtype: 'base',
      name: 'myBase',
      machinePartId: '',
    };
    const expectedLastPlanOnly = true;
    const expectedExecutionID = 'some specific executionID';
    const expectedExtra = { some: 'extra' };
    const mock = vi
      .fn()
      .mockImplementation((req: pb.GetPlanRequest, _md, cb) => {
        expect(req.getComponentName()?.toObject()).toStrictEqual(
          expectedComponentName
        );
        expect(req.getLastPlanOnly()).toStrictEqual(expectedLastPlanOnly);
        expect(req.getExecutionId()).toStrictEqual(expectedExecutionID);
        expect(req.getExtra()?.toObject()).toStrictEqual(
          Struct.fromJavaScript(expectedExtra).toObject()
        );
        cb(null, expectedResponse);
      });
    MotionServiceClient.prototype.getPlan = mock;
    await expect(
      motion.getPlan(
        expectedComponentName,
        expectedLastPlanOnly,
        expectedExecutionID,
        expectedExtra
      )
    ).resolves.toStrictEqual(expectedResponse.toObject());
    expect(mock).toHaveBeenCalledOnce();
  });
});

describe('listPlanStatuses', () => {
  const expectedResponse = {
    toObject: () => ({
      planStatusesWithIdsList: [
        {
          planId: 'some plan id',
          componentName: {
            namespace: 'viam',
            type: 'component',
            subtype: 'base',
            name: 'myBase',
          },
          executionId: 'some execution id',
          state: pb.PlanState.PLAN_STATE_STOPPED,
        },
      ],
    }),
  };

  it('return listPlanStatusesResponse', async () => {
    const expectedOnlyActivePlans = false;
    const expectedExtra = {};
    const mock = vi
      .fn()
      .mockImplementation((req: pb.ListPlanStatusesRequest, _md, cb) => {
        expect(req.getOnlyActivePlans()).toStrictEqual(expectedOnlyActivePlans);
        expect(req.getExtra()?.toObject()).toStrictEqual(
          Struct.fromJavaScript(expectedExtra).toObject()
        );
        cb(null, expectedResponse);
      });
    MotionServiceClient.prototype.listPlanStatuses = mock;
    await expect(motion.listPlanStatuses()).resolves.toStrictEqual(
      expectedResponse.toObject()
    );
    expect(mock).toHaveBeenCalledOnce();
  });

  it('allows optionally specifying onlyActivePlans and extra', async () => {
    const expectedOnlyActivePlans = true;
    const expectedExtra = { some: 'extra' };
    const mock = vi
      .fn()
      .mockImplementation((req: pb.ListPlanStatusesRequest, _md, cb) => {
        expect(req.getOnlyActivePlans()).toStrictEqual(expectedOnlyActivePlans);
        expect(req.getExtra()?.toObject()).toStrictEqual(
          Struct.fromJavaScript(expectedExtra).toObject()
        );
        cb(null, expectedResponse);
      });
    MotionServiceClient.prototype.listPlanStatuses = mock;
    await expect(
      motion.listPlanStatuses(expectedOnlyActivePlans, expectedExtra)
    ).resolves.toStrictEqual(expectedResponse.toObject());
    expect(mock).toHaveBeenCalledOnce();
  });
});
