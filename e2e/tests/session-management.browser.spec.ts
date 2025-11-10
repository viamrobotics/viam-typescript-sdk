import { test, expect } from '@playwright/test';
import { withRobot } from '../fixtures/robot-page';

test.describe('Session Management', () => {
  withRobot('should have no session initially', async ({ robotPage }) => {
    // Arrange
    await robotPage.connect();

    // Act
    const sessionId = await robotPage.getClientSessionId();

    // Assert
    expect(sessionId).toBe('');
  });

  withRobot('should create a session when requested', async ({ robotPage }) => {
    // Arrange
    await robotPage.connect();

    // Act
    const { sessionId } = await robotPage.createSession();

    // Assert
    expect(sessionId).not.toBe('');
    expect(sessionId.length).toBeGreaterThan(0);
  });

  withRobot(
    'should reuse existing session when created again',
    async ({ robotPage }) => {
      // Arrange
      await robotPage.connect();
      const firstSession = await robotPage.createSession();
      const firstSessionId = firstSession.sessionId;

      // Act
      const secondSession = await robotPage.createSession();

      // Assert
      expect(firstSessionId).not.toBe('');
      expect(secondSession.sessionId).toBe(firstSessionId);
    }
  );

  withRobot(
    'should reset session and create new session after expiration',
    async ({ robotPage }) => {
      // Arrange
      await robotPage.connect();
      const initialSession = await robotPage.createSession();
      const initialSessionId = initialSession.sessionId;

      // Act
      await robotPage.clickButton('expire-session-btn');
      const sessionIdAfterReset = await robotPage.getClientSessionId();
      const newSession = await robotPage.createSession();

      // Assert
      expect(initialSessionId).not.toBe('');
      expect(sessionIdAfterReset).toBe('');
      expect(newSession.sessionId).not.toBe('');
    }
  );

  withRobot('should reset session after disconnect', async ({ robotPage }) => {
    // Arrange
    await robotPage.connect();

    // Act
    const sessionBeforeDisconnect = await robotPage.createSession();
    await robotPage.disconnect();
    const sessionIdAfterDisconnect = await robotPage.getClientSessionId();

    // Assert
    expect(sessionBeforeDisconnect.sessionId).not.toBe('');
    expect(sessionIdAfterDisconnect).toBe('');
  });
});

test.describe('Session Metadata', () => {
  withRobot(
    'should include viam-sid in metadata when session exists',
    async ({ robotPage }) => {
      // Arrange
      await robotPage.connect();

      // Act
      const { sessionId, metadata } = await robotPage.createSession();

      // Assert
      expect(metadata).toEqual({ 'viam-sid': sessionId });
    }
  );
});
