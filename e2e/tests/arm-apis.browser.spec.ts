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
    'should move arm to joint positions and verify new joint state',
    async ({ robotPage }) => {
      // Arrange
      await robotPage.connect();

      // Act - Get initial joint positions
      await robotPage.getJointPositions();
      const initialJoints = await robotPage.getOutput<
        ArmClient,
        'getJointPositions'
      >();

      // Assert - Verify initial joint positions (fake arm starts at 0)
      expect(initialJoints).toEqual({
        values: [0],
      });

      // Act - Move to new joint position (45 degrees)
      await robotPage.moveToJointPositions();
      const moveResult = await robotPage.getOutput<
        ArmClient,
        'moveToJointPositions'
      >();

      // Assert - Verify move completed successfully
      expect(moveResult).toEqual({ success: true });

      // Act - Get joint positions after move
      await robotPage.getJointPositions();
      const movedJoints = await robotPage.getOutput<
        ArmClient,
        'getJointPositions'
      >();

      // Assert - Verify joint position changed to 45 degrees
      expect(movedJoints).toEqual({
        values: [45],
      });
    }
  );
});
