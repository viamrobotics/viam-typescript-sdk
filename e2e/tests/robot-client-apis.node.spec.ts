import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RobotClient, Timestamp } from '../../src/main';
import { defaultNodeConfig } from '../fixtures/configs/dial-configs';

describe('Robot Client API Tests', () => {
  let client: RobotClient;

  // Arrange
  beforeEach(async () => {
    client = new RobotClient();
    await client.dial(defaultNodeConfig);
  });

  afterEach(async () => {
    await client.disconnect();
  });

  it('should get resource names', async () => {
    // Act
    const resources = await client.resourceNames();

    // Assert
    expect(resources).toEqual(
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
          name: 'test-motor',
          namespace: 'rdk',
          subtype: 'motor',
          type: 'component',
        },
      ])
    );
  });

  it('should get machine status', async () => {
    // Act
    const status = await client.getMachineStatus();

    // Assert
    expect(status.config).toEqual(
      expect.objectContaining({
        revision: '',
        lastUpdated: expect.any(Timestamp),
      })
    );
    expect(status.state).toEqual(2);
    expect(status.resources.length).toEqual(8);
  });

  it('should get sessions', async () => {
    // Act
    const sessions = await client.getSessions();

    // Assert
    expect(sessions).toEqual(expect.arrayContaining([]));
  });

  it('should get operations', async () => {
    // Act
    const operations = await client.getOperations();

    // Assert
    expect(operations).toEqual(expect.arrayContaining([]));
  });

  it('should stop all', async () => {
    // Stop all has no return value, so we just check that no error occurred
    await expect(client.stopAll()).resolves.toBeUndefined();
  });

  it('should get models from modules', async () => {
    // Act
    const models = await client.getModelsFromModules();

    // Assert
    expect(models).toEqual(expect.arrayContaining([]));
  });

  it('should get resource rpc subtypes', async () => {
    // Act
    const subtypes = await client.resourceRPCSubtypes();

    // Assert
    expect(subtypes).toEqual(
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
  });

  it('should get cloud metadata', async () => {
    // Act & Assert
    await expect(client.getCloudMetadata()).rejects.toThrow(
      '[unknown] cloud metadata not available'
    );
  });

  it('should get version', async () => {
    // Act
    const version = await client.getVersion();

    // Assert
    expect(version).toEqual(
      expect.objectContaining({
        version: expect.stringMatching(/^v\d+\.\d+\.\d+$/u),
        apiVersion: expect.stringMatching(/^v\d+\.\d+\.\d+$/u),
        platform: 'rdk',
      })
    );
  });
});
