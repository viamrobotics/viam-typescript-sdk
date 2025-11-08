import { withRobot } from '../fixtures/robot-page';
import { expect } from '@playwright/test';

withRobot.describe('Connect, Disconnect, and Reconnect', () => {
  withRobot(
    'should handle the full connection lifecycle',
    async ({ robotPage }) => {
      // Arrange, Act, Assert
      await robotPage.connect();
      let connectionStatus = await robotPage.getConnectionStatus();
      expect(connectionStatus).toBe('Connected');

      // Act & Assert
      await robotPage.disconnect();
      connectionStatus = await robotPage.getConnectionStatus();
      expect(connectionStatus).toBe('Disconnected');

      // Act & Assert
      await robotPage.connect();
      connectionStatus = await robotPage.getConnectionStatus();
      expect(connectionStatus).toBe('Connected');
    }
  );

  withRobot(
    'should abort previous dial attempt when a new dial is called',
    async ({ robotPage }) => {
      // Arrange
      await robotPage.ensureReady();

      // Act
      await robotPage.clickButton('connect-invalid-btn');

      // Assert
      await robotPage.waitForDialing();
      await robotPage.waitForFirstDialingAttempt();
      await robotPage.waitForSubsequentDialingAttempts();

      // Act
      await robotPage.clickButton('connect-invalid-btn');

      // Assert
      await robotPage.waitForDialing();
      await robotPage.waitForFirstDialingAttempt();
      await robotPage.waitForSubsequentDialingAttempts();

      // Act
      await robotPage.clickButton('connect-btn');
      await robotPage.getPage().waitForTimeout(500);

      // Assert
      const connectionStatus = await robotPage.getConnectionStatus();
      const dialingStatus = await robotPage.getDialingStatus();

      expect(connectionStatus).toBe('Connected');
      expect(dialingStatus).toBe('');
    }
  );
});
