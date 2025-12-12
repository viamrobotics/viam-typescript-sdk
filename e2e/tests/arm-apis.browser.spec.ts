import { expect } from '@playwright/test';
import { withRobot } from '../fixtures/robot-page';
import type { ArmClient } from '../../src/components/arm';

withRobot.describe('Arm API Tests', () => {
  withRobot(
    'should get arm position and joint information after connecting',
    async ({ robotPage }) => {
      // Arrange
      await robotPage.connect();

      // Act - Get end position
      await robotPage.getEndPosition();
      const endPosition = await robotPage.getOutput<
        ArmClient,
        'getEndPosition'
      >();

      // Assert - Verify pose structure
      expect(endPosition).toEqual(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
          z: expect.any(Number),
        })
      );

      // Act - Get joint positions
      await robotPage.getJointPositions();
      const jointPositions = await robotPage.getOutput<
        ArmClient,
        'getJointPositions'
      >();

      // Assert - Verify joint positions structure
      expect(jointPositions).toEqual(
        expect.objectContaining({
          values: expect.any(Array),
        })
      );
    }
  );

  withRobot(
    'should move arm to joint positions and get new end position',
    async ({ robotPage }) => {
      // Arrange
      await robotPage.connect();

      // Act - Get end position
      await robotPage.getEndPosition();
      const endPosition = await robotPage.getOutput<
        ArmClient,
        'getEndPosition'
      >();

      // Assert - Verify pose structure
      expect(endPosition).toEqual(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
          z: expect.any(Number),
        })
      );

      // Act - Move to position
      await robotPage.moveToPosition();
      await robotPage.getEndPosition();
      const movedEndPosition = await robotPage.getOutput<
        ArmClient,
        'getEndPosition'
      >();

      // Assert - Verify end position is different
      expect(movedEndPosition).not.toEqual(endPosition);
    }
  );
});
