import { expect } from '@playwright/test';
import { withRobot } from '../fixtures/robot-page';
import type { Camera, CameraClient } from '../../src/components/camera';

withRobot.describe('Camera API Tests', () => {
  withRobot(
    'should get camera properties after connecting',
    async ({ robotPage }) => {
      // Arrange
      await robotPage.connect();

      // Act
      await robotPage.getCameraProperties();
      const properties = await robotPage.getOutput<Camera, 'getProperties'>();

      // Assert - Verify properties structure
      expect(properties).toEqual(
        expect.objectContaining({
          supportsPcd: expect.any(Boolean),
        })
      );
    }
  );

  withRobot('should get images from camera', async ({ robotPage }) => {
    // Arrange
    await robotPage.connect();

    // Act
    await robotPage.getCameraImages();
    const imageResult = await robotPage.getOutput<CameraClient, 'getImages'>();

    // Assert - Verify we got images
    expect(imageResult.images.length).toBeGreaterThan(0);
    expect(imageResult.metadata).toBeDefined();
  });
});
