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
      await robotPage.clickArmAPIButton('getEndPosition');
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
      await robotPage.clickArmAPIButton('getJointPositions');
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
});
