/*
 *  @vitest-environment happy-dom
 */

import { describe, expect, it, vi, type Mock } from 'vitest';
import { RobotClient } from '../../robot';
vi.mock('../../gen/service/motion/v1/motion_pb_service');
vi.mock('../../robot');

import { Struct, Timestamp } from '@bufbuild/protobuf';
import { createClient, createRouterTransport } from '@connectrpc/connect';
import { MotionService } from '../../gen/service/motion/v1/motion_connect';
import {
  GetPlanRequest,
  ListPlanStatusesRequest,
  MoveOnGlobeRequest,
  MoveOnGlobeResponse,
  MoveRequest,
  StopPlanRequest,
} from '../../gen/service/motion/v1/motion_pb';
import {
  GeoGeometry,
  GeoPoint,
  Pose,
  PoseInFrame,
  ResourceName,
} from '../../types';
import { MotionClient } from './client';
import {
  Constraints,
  GetPlanResponse,
  ListPlanStatusesResponse,
  MotionConfiguration,
  ObstacleDetector,
  PlanState,
  PseudolinearConstraint,
} from './types';

const motionClientName = 'test-motion';
const date = new Date(1970, 1, 1, 1, 1, 1);

let motion: MotionClient;

const testExecutionId = 'some execution id';

describe('moveOnGlobe', () => {
  let executionId: Mock<[], string>;

  it('return executionID', async () => {
    executionId = vi.fn(() => testExecutionId);

    const expectedMotionName = motionClientName;
    const expectedDestination = new GeoPoint({ latitude: 1, longitude: 2 });
    const expectedObstaclesList: ObstacleDetector[] = [];
    const expectedHeading = undefined;
    const expectedComponentName = new ResourceName({
      namespace: 'viam',
      type: 'component',
      subtype: 'base',
      name: 'myBase',
    });
    const expectedMovementSensorName = new ResourceName({
      namespace: 'viam',
      type: 'component',
      subtype: 'movementsensor',
      name: 'myMovementsensor',
    });
    const expectedMotionConfiguration = undefined;
    const expectedExtra = {};

    let capturedReq: MoveOnGlobeRequest | undefined;
    const mockTransport = createRouterTransport(({ service }) => {
      service(MotionService, {
        moveOnGlobe: (req) => {
          capturedReq = req;
          return new MoveOnGlobeResponse({
            executionId: executionId(),
          });
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(MotionService, mockTransport));

    motion = new MotionClient(new RobotClient('host'), motionClientName);

    await expect(
      motion.moveOnGlobe(
        { latitude: 1, longitude: 2 },
        {
          namespace: 'viam',
          type: 'component',
          subtype: 'base',
          name: 'myBase',
          remotePath: [],
          localName: '',
        },
        {
          namespace: 'viam',
          type: 'component',
          subtype: 'movementsensor',
          name: 'myMovementsensor',
          remotePath: [],
          localName: '',
        }
      )
    ).resolves.toStrictEqual(testExecutionId);

    expect(capturedReq?.name).toStrictEqual(expectedMotionName);
    expect(capturedReq?.destination).toStrictEqual(expectedDestination);
    expect(capturedReq?.heading).toStrictEqual(expectedHeading);
    expect(capturedReq?.componentName).toStrictEqual(expectedComponentName);
    expect(capturedReq?.movementSensorName).toStrictEqual(
      expectedMovementSensorName
    );
    expect(capturedReq?.obstacles).toEqual(expectedObstaclesList);
    expect(capturedReq?.motionConfiguration).toStrictEqual(
      expectedMotionConfiguration
    );
    expect(capturedReq?.extra).toStrictEqual(Struct.fromJson(expectedExtra));

    expect(executionId).toHaveBeenCalledOnce();
  });

  it('allows optionally specifying heading, obstacles, motionConfig & extra', async () => {
    executionId = vi.fn(() => testExecutionId);
    const expectedMotionName = motionClientName;
    const expectedDestination = new GeoPoint({ latitude: 1, longitude: 2 });
    const expectedObstaclesList = [
      new GeoGeometry({
        location: { latitude: 3, longitude: 5 },
        geometries: [
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
            geometryType: {
              case: 'sphere',
              value: {
                radiusMm: 100,
              },
            },
            label: 'my label',
          },
        ],
      }),
    ];
    const expectedBoundingRegionsList = [
      new GeoGeometry({
        location: { latitude: 1, longitude: 2 },
        geometries: [
          {
            center: {
              x: 2,
              y: 3,
              z: 4,
              oX: 5,
              oY: 6,
              oZ: 7,
              theta: 8,
            },
            geometryType: {
              case: 'sphere',
              value: {
                radiusMm: 1,
              },
            },
            label: 'my label 2',
          },
        ],
      }),
    ];
    const expectedHeading = 60;
    const expectedComponentName = new ResourceName({
      namespace: 'viam',
      type: 'component',
      subtype: 'base',
      name: 'myBase',
    });
    const expectedMovementSensorName = new ResourceName({
      namespace: 'viam',
      type: 'component',
      subtype: 'movementsensor',
      name: 'myMovementsensor',
    });
    const expectedMotionConfiguration = new MotionConfiguration({
      obstacleDetectors: [
        {
          visionService: {
            namespace: 'viam',
            type: 'service',
            subtype: 'vision',
            name: 'myVisionService',
          },
          camera: {
            namespace: 'viam',
            type: 'component',
            subtype: 'camera',
            name: 'myCamera',
          },
        },
      ],
      positionPollingFrequencyHz: 20,
      obstaclePollingFrequencyHz: 30,
      planDeviationM: 2,
      linearMPerSec: 2,
      angularDegsPerSec: 180,
    });
    const expectedExtra = { some: 'extra' };

    let capturedReq: MoveOnGlobeRequest | undefined;
    const mockTransport = createRouterTransport(({ service }) => {
      service(MotionService, {
        moveOnGlobe: (req) => {
          capturedReq = req;
          return new MoveOnGlobeResponse({
            executionId: executionId(),
          });
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(MotionService, mockTransport));

    motion = new MotionClient(new RobotClient('host'), motionClientName);

    await expect(
      motion.moveOnGlobe(
        expectedDestination,
        expectedComponentName,
        expectedMovementSensorName,
        expectedHeading,
        expectedObstaclesList,
        expectedMotionConfiguration,
        expectedBoundingRegionsList,
        expectedExtra
      )
    ).resolves.toStrictEqual(testExecutionId);
    expect(capturedReq).not.toBeUndefined();
    expect(capturedReq?.name).toStrictEqual(expectedMotionName);
    expect(capturedReq?.destination).toStrictEqual(expectedDestination);
    expect(capturedReq?.heading).toStrictEqual(expectedHeading);
    expect(capturedReq?.componentName).toStrictEqual(expectedComponentName);
    expect(capturedReq?.movementSensorName).toStrictEqual(
      expectedMovementSensorName
    );
    expect(capturedReq?.obstacles).toEqual(expectedObstaclesList);
    expect(capturedReq?.boundingRegions).toEqual(expectedBoundingRegionsList);
    expect(capturedReq?.motionConfiguration).toStrictEqual(
      expectedMotionConfiguration
    );
    expect(capturedReq?.extra).toStrictEqual(Struct.fromJson(expectedExtra));

    expect(executionId).toHaveBeenCalledOnce();
  });
});

describe('move', () => {
  it('sends a move request with pseudolinear constraints', async () => {
    const expectedComponentName = new ResourceName({
      namespace: 'viam',
      type: 'component',
      subtype: 'base',
      name: 'myBase',
    });
    const expectedDestination = new PoseInFrame({
      referenceFrame: 'world',
      pose: new Pose({
        x: 1,
        y: 2,
        z: 3,
        oX: 0,
        oY: 0,
        oZ: 1,
        theta: 90,
      }),
    });
    const expectedPseudolinearConstraint = new PseudolinearConstraint({
      lineToleranceFactor: 5,
      orientationToleranceFactor: 10,
    });
    const expectedConstraints = new Constraints({
      pseudolinearConstraint: [expectedPseudolinearConstraint],
    });
    const expectedExtra = { some: 'extra' };
    let capturedReq: MoveRequest | undefined;
    const mockTransport = createRouterTransport(({ service }) => {
      service(MotionService, {
        move: (req) => {
          capturedReq = req;
          return { success: true };
        },
      });
    });
    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(MotionService, mockTransport));
    motion = new MotionClient(new RobotClient('host'), motionClientName);
    await expect(
      motion.move(
        expectedDestination,
        expectedComponentName,
        undefined,
        expectedConstraints,
        expectedExtra
      )
    ).resolves.toStrictEqual(true);
    expect(capturedReq?.name).toStrictEqual(motionClientName);
    expect(capturedReq?.destination).toStrictEqual(expectedDestination);
    expect(capturedReq?.componentName).toStrictEqual(expectedComponentName);
    expect(capturedReq?.constraints).toStrictEqual(expectedConstraints);
    expect(capturedReq?.extra).toStrictEqual(Struct.fromJson(expectedExtra));
  });
});

describe('stopPlan', () => {
  it('return null', async () => {
    const expectedComponentName = new ResourceName({
      namespace: 'viam',
      type: 'component',
      subtype: 'base',
      name: 'myBase',
    });
    const expectedExtra = {};

    let capturedReq: StopPlanRequest | undefined;
    const mockTransport = createRouterTransport(({ service }) => {
      service(MotionService, {
        stopPlan: (req) => {
          capturedReq = req;
          return {};
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(MotionService, mockTransport));

    motion = new MotionClient(new RobotClient('host'), motionClientName);

    await expect(motion.stopPlan(expectedComponentName)).resolves.toStrictEqual(
      null
    );
    expect(capturedReq?.componentName).toStrictEqual(expectedComponentName);
    expect(capturedReq?.extra).toStrictEqual(Struct.fromJson(expectedExtra));
  });

  it('allows optionally specifying extra', async () => {
    const expectedComponentName = new ResourceName({
      namespace: 'viam',
      type: 'component',
      subtype: 'base',
      name: 'myBase',
    });
    const expectedExtra = { some: 'extra' };
    let capturedReq: StopPlanRequest | undefined;
    const mockTransport = createRouterTransport(({ service }) => {
      service(MotionService, {
        stopPlan: (req) => {
          capturedReq = req;
          return {};
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(MotionService, mockTransport));

    motion = new MotionClient(new RobotClient('host'), motionClientName);

    await expect(
      motion.stopPlan(expectedComponentName, expectedExtra)
    ).resolves.toStrictEqual(null);
    expect(capturedReq?.componentName).toStrictEqual(expectedComponentName);
    expect(capturedReq?.extra).toStrictEqual(Struct.fromJson(expectedExtra));
  });
});

describe('getPlan', () => {
  const expectedResponse = new GetPlanResponse({
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
        steps: [
          {
            step: {
              'viam:component:base/myBase': {
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
            },
          },
        ],
      },
      status: {
        state: PlanState.IN_PROGRESS,
        timestamp: Timestamp.fromDate(date),
      },
      statusHistory: [],
    },
    replanHistory: [],
  });

  it('return GetPlanResponse', async () => {
    const expectedComponentName = new ResourceName({
      namespace: 'viam',
      type: 'component',
      subtype: 'base',
      name: 'myBase',
    });
    const expectedLastPlanOnly = false;
    const expectedExecutionID = undefined;
    const expectedExtra = {};
    let capturedReq: GetPlanRequest | undefined;
    const mockTransport = createRouterTransport(({ service }) => {
      service(MotionService, {
        getPlan: (req) => {
          capturedReq = req;
          return expectedResponse;
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(MotionService, mockTransport));

    motion = new MotionClient(new RobotClient('host'), motionClientName);

    await expect(motion.getPlan(expectedComponentName)).resolves.toStrictEqual(
      expectedResponse
    );
    expect(capturedReq?.componentName).toStrictEqual(expectedComponentName);
    expect(capturedReq?.lastPlanOnly).toStrictEqual(expectedLastPlanOnly);
    expect(capturedReq?.executionId).toStrictEqual(expectedExecutionID);
    expect(capturedReq?.extra).toStrictEqual(Struct.fromJson(expectedExtra));
  });

  it('allows optionally specifying lastPlanOnly, executionID, and extra', async () => {
    const expectedComponentName = new ResourceName({
      namespace: 'viam',
      type: 'component',
      subtype: 'base',
      name: 'myBase',
    });
    const expectedLastPlanOnly = true;
    const expectedExecutionID = 'some specific executionID';
    const expectedExtra = { some: 'extra' };
    let capturedReq: GetPlanRequest | undefined;
    const mockTransport = createRouterTransport(({ service }) => {
      service(MotionService, {
        getPlan: (req) => {
          capturedReq = req;
          return expectedResponse;
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(MotionService, mockTransport));

    motion = new MotionClient(new RobotClient('host'), motionClientName);

    await expect(
      motion.getPlan(
        expectedComponentName,
        expectedLastPlanOnly,
        expectedExecutionID,
        expectedExtra
      )
    ).resolves.toStrictEqual(expectedResponse);
    expect(capturedReq?.componentName).toStrictEqual(expectedComponentName);
    expect(capturedReq?.lastPlanOnly).toStrictEqual(expectedLastPlanOnly);
    expect(capturedReq?.executionId).toStrictEqual(expectedExecutionID);
    expect(capturedReq?.extra).toStrictEqual(Struct.fromJson(expectedExtra));
  });
});

describe('listPlanStatuses', () => {
  const expectedResponse = new ListPlanStatusesResponse({
    planStatusesWithIds: [
      {
        planId: 'some plan id',
        componentName: {
          namespace: 'viam',
          type: 'component',
          subtype: 'base',
          name: 'myBase',
        },
        executionId: 'some execution id',
        status: {
          state: PlanState.STOPPED,
        },
      },
    ],
  });

  it('return listPlanStatusesResponse', async () => {
    const expectedOnlyActivePlans = false;
    const expectedExtra = {};
    let capturedReq: ListPlanStatusesRequest | undefined;
    const mockTransport = createRouterTransport(({ service }) => {
      service(MotionService, {
        listPlanStatuses: (req) => {
          capturedReq = req;
          return expectedResponse;
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(MotionService, mockTransport));

    motion = new MotionClient(new RobotClient('host'), motionClientName);

    await expect(motion.listPlanStatuses()).resolves.toStrictEqual(
      expectedResponse
    );
    expect(capturedReq?.onlyActivePlans).toStrictEqual(expectedOnlyActivePlans);
    expect(capturedReq?.extra).toStrictEqual(Struct.fromJson(expectedExtra));
  });

  it('allows optionally specifying onlyActivePlans and extra', async () => {
    const expectedOnlyActivePlans = true;
    const expectedExtra = { some: 'extra' };
    let capturedReq: ListPlanStatusesRequest | undefined;
    const mockTransport = createRouterTransport(({ service }) => {
      service(MotionService, {
        listPlanStatuses: (req) => {
          capturedReq = req;
          return expectedResponse;
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(MotionService, mockTransport));

    motion = new MotionClient(new RobotClient('host'), motionClientName);

    await expect(
      motion.listPlanStatuses(expectedOnlyActivePlans, expectedExtra)
    ).resolves.toStrictEqual(expectedResponse);
    expect(capturedReq?.onlyActivePlans).toStrictEqual(expectedOnlyActivePlans);
    expect(capturedReq?.extra).toStrictEqual(Struct.fromJson(expectedExtra));
  });
});
