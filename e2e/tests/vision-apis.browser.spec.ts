import { expect } from '@playwright/test';
import { withRobot } from '../fixtures/robot-page';
import type { Vision } from '../../src/services/vision';

withRobot.describe('Vision API Tests', () => {
  withRobot(
    'should get vision service properties after connecting',
    async ({ robotPage }) => {
      // Arrange
      await robotPage.connect();

      // Act
      await robotPage.getVisionProperties();
      const properties = await robotPage.getOutput<Vision, 'getProperties'>();

      // Assert - Verify properties structure
      expect(properties).toEqual(
        expect.objectContaining({
          classificationsSupported: expect.any(Boolean),
          detectionsSupported: expect.any(Boolean),
          objectPointCloudsSupported: expect.any(Boolean),
        })
      );
    }
  );

  withRobot('should get detections from camera', async ({ robotPage }) => {
    // Arrange
    await robotPage.connect();

    // Act
    await robotPage.getVisionDetectionsFromCamera();
    const detections = await robotPage.getOutput<
      Vision,
      'getDetectionsFromCamera'
    >();

    // Assert - Should return an array of detections
    expect(detections.length).toBeGreaterThan(0);
  });

  withRobot('should capture all from camera', async ({ robotPage }) => {
    // Arrange
    await robotPage.connect();

    // Act
    await robotPage.captureAllFromCamera();
    const captureAll = await robotPage.getOutput<
      Vision,
      'captureAllFromCamera'
    >();

    // Assert - Verify capture all structure
    expect(captureAll).toEqual(
      expect.objectContaining({
        image: expect.any(Object),
        classifications: expect.any(Array),
        detections: expect.any(Array),
        objectPointClouds: expect.any(Array),
      })
    );
  });
});
