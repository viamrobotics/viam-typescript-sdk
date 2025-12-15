import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RobotClient } from '../../src/main';
import { defaultNodeConfig } from '../fixtures/configs/dial-configs';

describe('Robot Client API Tests', () => {
  let client: RobotClient;

  beforeEach(async () => {
    client = new RobotClient();
    await client.dial(defaultNodeConfig);
  });

  afterEach(async () => {
    await client.disconnect();
  });

  it('should get robot information after connecting', async () => {
    // Act - Get resource names
    const resources = await client.resourceNames();

    // Assert - Verify we can discover the configured components
    expect(resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'fake_arm', subtype: 'arm' }),
        expect.objectContaining({ name: 'fake_camera', subtype: 'camera' }),
        expect.objectContaining({ name: 'fake_vision', subtype: 'vision' }),
      ])
    );

    // Act - Get version info
    const version = await client.getVersion();

    // Assert - Verify we get valid version information
    expect(version.platform).toBe('rdk');
    expect(version.version).toMatch(/^v?\d+\.\d+\.\d+$/u);
    expect(version.apiVersion).toMatch(/^v\d+\.\d+\.\d+$/u);
  });

  it('should get machine status', async () => {
    // Act
    const status = await client.getMachineStatus();

    // Assert - Verify basic machine status structure
    expect(status.state).toBeDefined();
    expect(status.resources.length).toBeGreaterThan(0);
    expect(status.config).toBeDefined();
  });

  it('should stop all components without error', async () => {
    // Act & Assert - stopAll should complete without throwing
    await expect(client.stopAll()).resolves.toBeUndefined();
  });
});
