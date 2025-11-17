import { test, expect } from '@playwright/test';
import { withRobot } from '../fixtures/robot-page';
import type { RobotClient } from '../../src/robot/client';

test.describe('Robot Client API Tests', () => {
  withRobot('should get responses from APIs', async ({ robotPage }) => {
    // Arrange
    await robotPage.connect();

    // Act & Assert
    await robotPage.clickRobotAPIButton('resourceNames');
    expect(await robotPage.getOutput<RobotClient, 'resourceNames'>()).toEqual(
      expect.arrayContaining([
        {
          name: 'builtin',
          namespace: 'rdk',
          subtype: 'motion',
          type: 'service',
        },
        {
          name: 'base1',
          namespace: 'rdk',
          subtype: 'base',
          type: 'component',
        },
        {
          name: 'servo1',
          namespace: 'rdk',
          subtype: 'servo',
          type: 'component',
        },
        {
          name: 'motor1',
          namespace: 'rdk',
          subtype: 'motor',
          type: 'component',
        },
      ])
    );

    // Act & Assert
    await robotPage.clickRobotAPIButton('getMachineStatus');
    expect(
      await robotPage.getOutput<RobotClient, 'getMachineStatus'>()
    ).toEqual(
      expect.objectContaining({
        resources: expect.arrayContaining([
          {
            name: {
              namespace: 'rdk',
              type: 'service',
              subtype: 'motion',
              name: 'builtin',
            },
            state: 'STATE_READY',
            lastUpdated: expect.any(String),
            revision: '',
            error: '',
            cloudMetadata: {
              robotPartId: '',
              primaryOrgId: '',
              locationId: '',
              machineId: '',
              machinePartId: '',
            },
          },
          {
            name: {
              namespace: 'rdk',
              type: 'component',
              subtype: 'base',
              name: 'base1',
            },
            state: 'STATE_READY',
            lastUpdated: expect.any(String),
            revision: '',
            error: '',
            cloudMetadata: {
              robotPartId: '',
              primaryOrgId: '',
              locationId: '',
              machineId: '',
              machinePartId: '',
            },
          },
          {
            name: {
              namespace: 'rdk',
              type: 'component',
              subtype: 'servo',
              name: 'servo1',
            },
            state: 'STATE_READY',
            lastUpdated: expect.any(String),
            revision: '',
            error: '',
            cloudMetadata: {
              robotPartId: '',
              primaryOrgId: '',
              locationId: '',
              machineId: '',
              machinePartId: '',
            },
          },
          {
            name: {
              namespace: 'rdk',
              type: 'component',
              subtype: 'motor',
              name: 'motor1',
            },
            state: 'STATE_READY',
            lastUpdated: expect.any(String),
            revision: '',
            error: '',
            cloudMetadata: {
              robotPartId: '',
              primaryOrgId: '',
              locationId: '',
              machineId: '',
              machinePartId: '',
            },
          },
          {
            name: {
              namespace: 'rdk-internal',
              type: 'service',
              subtype: 'web',
              name: 'builtin',
            },
            state: 'STATE_READY',
            lastUpdated: expect.any(String),
            revision: '',
            error: '',
            cloudMetadata: {
              robotPartId: '',
              primaryOrgId: '',
              locationId: '',
              machineId: '',
              machinePartId: '',
            },
          },
          {
            name: {
              namespace: 'rdk-internal',
              type: 'service',
              subtype: 'frame_system',
              name: 'builtin',
            },
            state: 'STATE_READY',
            lastUpdated: expect.any(String),
            revision: '',
            error: '',
            cloudMetadata: {
              robotPartId: '',
              primaryOrgId: '',
              locationId: '',
              machineId: '',
              machinePartId: '',
            },
          },
          {
            name: {
              namespace: 'rdk-internal',
              type: 'service',
              subtype: 'packagemanager',
              name: 'builtin',
            },
            state: 'STATE_READY',
            lastUpdated: expect.any(String),
            revision: '',
            error: '',
            cloudMetadata: {
              robotPartId: '',
              primaryOrgId: '',
              locationId: '',
              machineId: '',
              machinePartId: '',
            },
          },
          {
            name: {
              namespace: 'rdk-internal',
              type: 'service',
              subtype: 'cloud_connection',
              name: 'builtin',
            },
            state: 'STATE_READY',
            lastUpdated: expect.any(String),
            revision: '',
            error: '',
            cloudMetadata: {
              robotPartId: '',
              primaryOrgId: '',
              locationId: '',
              machineId: '',
              machinePartId: '',
            },
          },
        ]),
        config: {
          revision: '',
          lastUpdated: expect.any(String),
        },
        state: 'STATE_RUNNING',
      })
    );

    // Act & Assert
    await robotPage.clickRobotAPIButton('getSessions');
    expect(await robotPage.getOutput<RobotClient, 'getSessions'>()).toEqual([]);

    // Act & Assert
    await robotPage.clickRobotAPIButton('getOperations');
    expect(await robotPage.getOutput<RobotClient, 'getOperations'>()).toEqual(
      []
    );

    // Act & Assert
    await robotPage.clickRobotAPIButton('getModelsFromModules');
    expect(
      await robotPage.getOutput<RobotClient, 'getModelsFromModules'>()
    ).toEqual([]);

    // Act & Assert
    await robotPage.clickRobotAPIButton('resourceRPCSubtypes');
    expect(
      await robotPage.getOutput<RobotClient, 'resourceRPCSubtypes'>()
    ).toEqual(
      expect.arrayContaining([
        {
          subtype: {
            namespace: 'rdk',
            type: 'service',
            subtype: 'motion',
            name: '',
          },
          protoService: 'viam.service.motion.v1.MotionService',
        },
        {
          subtype: {
            namespace: 'rdk',
            type: 'component',
            subtype: 'base',
            name: '',
          },
          protoService: 'viam.component.base.v1.BaseService',
        },
        {
          subtype: {
            namespace: 'rdk',
            type: 'component',
            subtype: 'servo',
            name: '',
          },
          protoService: 'viam.component.servo.v1.ServoService',
        },
        {
          subtype: {
            namespace: 'rdk',
            type: 'component',
            subtype: 'motor',
            name: '',
          },
          protoService: 'viam.component.motor.v1.MotorService',
        },
      ])
    );

    // Act & Assert
    await robotPage.clickRobotAPIButton('getCloudMetadata');
    expect(
      await robotPage.getOutput<RobotClient, 'getCloudMetadata'>()
    ).toEqual(
      expect.objectContaining({
        error: '[unknown] cloud metadata not available',
        stack: expect.any(String),
      })
    );

    // Act & Assert
    await robotPage.clickRobotAPIButton('getVersion');
    expect(await robotPage.getOutput<RobotClient, 'getVersion'>()).toEqual(
      expect.objectContaining({
        platform: 'rdk',
        version: expect.stringMatching(/^v?\d+\.\d+\.\d+$/u),
        apiVersion: expect.stringMatching(/^v\d+\.\d+\.\d+$/u),
      })
    );
  });
});
