import { expect } from '@playwright/test';
import { withRobot } from '../fixtures/robot-page';
import type { RobotClient } from '../../src/robot/client';

withRobot.describe('Robot Client API Tests', () => {
  withRobot(
    'should get robot information after connecting',
    async ({ robotPage }) => {
      // Arrange
      await robotPage.connect();

      // Act - Get resource names
      await robotPage.clickRobotAPIButton('resourceNames');
      const resources = await robotPage.getOutput<
        RobotClient,
        'resourceNames'
      >();

      // Assert - Verify we can discover the configured components
      expect(resources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'fake_arm', subtype: 'arm' }),
          expect.objectContaining({ name: 'fake_camera', subtype: 'camera' }),
          expect.objectContaining({ name: 'fake_vision', subtype: 'vision' }),
        ])
      );

      // Act - Get version info
      await robotPage.clickRobotAPIButton('getVersion');
      const version = await robotPage.getOutput<RobotClient, 'getVersion'>();

      // Assert - Verify we get valid version information
      expect(version).toEqual(
        expect.objectContaining({
          platform: 'rdk',
          version: expect.stringMatching(/^v?\d+\.\d+\.\d+$/u),
          apiVersion: expect.stringMatching(/^v\d+\.\d+\.\d+$/u),
        })
      );
    }
  );

  withRobot('should get machine status', async ({ robotPage }) => {
    // Arrange
    await robotPage.connect();

    // Act
    await robotPage.clickRobotAPIButton('getMachineStatus');
    const status = await robotPage.getOutput<RobotClient, 'getMachineStatus'>();

    // Assert - Verify basic machine status structure
    expect(status).toEqual(
      expect.objectContaining({
        state: expect.any(String),
        resources: expect.any(Array),
        config: expect.any(Object),
      })
    );
    expect(status.resources.length).toBeGreaterThan(0);
  });
});
