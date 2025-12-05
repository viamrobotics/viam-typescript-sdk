import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RobotClient, MachineConnectionEvent } from '../../src/main';
import {
  defaultNodeConfig,
  invalidNodeConfig,
} from '../fixtures/configs/dial-configs';

describe('Connect, Disconnect, and Reconnect', () => {
  let client: RobotClient;

  beforeEach(() => {
    client = new RobotClient();
  });

  afterEach(async () => {
    await client.disconnect();
  });

  it('should handle the full connection lifecycle', async () => {
    // Arrange
    const nodeConfig = {
      host: 'http://localhost:9090',
      noReconnect: true,
    };

    // Act & Assert
    await client.dial(nodeConfig);
    const resources = await client.resourceNames();
    expect(resources.length).toBeGreaterThan(0);

    // Act & Assert
    await client.disconnect();

    // Act & Assert
    await client.dial(nodeConfig);
    const resourcesAfterReconnect = await client.resourceNames();
    expect(resourcesAfterReconnect.length).toBeGreaterThan(0);
  });

  it('should abort previous dial attempt when a new dial is called', async () => {
    // Arrange
    const dialingAttempts: { method: string; attempt: number }[] = [];

    client.on(MachineConnectionEvent.DIALING, (args: unknown) => {
      const { method, attempt } = args as { method: string; attempt: number };
      dialingAttempts.push({ method, attempt });
    });

    const invalidDialPromise = client.dial(invalidNodeConfig).catch(() => {
      // Expected to fail - ignore the error
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    // Act
    await client.dial(defaultNodeConfig);
    await invalidDialPromise;

    // Assert
    const resources = await client.resourceNames();
    expect(resources.length).toBeGreaterThan(0);
    expect(dialingAttempts.length).toBeGreaterThan(0);
  });
});
