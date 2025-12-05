import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RobotClient, ArmClient } from '../../src/main';
import { defaultNodeConfig } from '../fixtures/configs/dial-configs';

describe('Arm API Tests', () => {
  let client: RobotClient;
  let arm: ArmClient;

  beforeEach(async () => {
    client = new RobotClient();
    await client.dial(defaultNodeConfig);
    arm = new ArmClient(client, 'fake_arm');
  });

  afterEach(async () => {
    await client.disconnect();
  });

  it('should get arm position and joint information after connecting', async () => {
    // Act - Get end position
    const endPosition = await arm.getEndPosition();

    // Assert - Verify pose structure
    expect(endPosition).toEqual(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        z: expect.any(Number),
      })
    );

    // Act - Get joint positions
    const jointPositions = await arm.getJointPositions();

    // Assert - Verify joint positions has values array
    expect(jointPositions.values).toBeDefined();
    expect(Array.isArray(jointPositions.values)).toBe(true);
  });
});
