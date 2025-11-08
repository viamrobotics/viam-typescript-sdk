import { Code, ConnectError, type Transport } from '@connectrpc/connect';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockTransport } from '../../__mocks__/transports';
import { RobotService } from '../../gen/robot/v1/robot_connect';
import SessionManager from '../session-manager';
import SessionTransport from '../session-transport';

class MockSessionManager extends SessionManager {
  constructor(transport: Transport) {
    super('test-host', () => transport);
  }

  override getSessionMetadata = vi.fn();
  override reset = vi.fn();
}

const setupMocks = () => {
  const transport = createMockTransport();
  const sessionManager = new MockSessionManager(transport);
  SessionManager.heartbeatMonitoredMethods = {
    '/viam.robot.v1.RobotService/GetOperations': true,
  };
  const sessionTransport = new SessionTransport(
    () => transport,
    sessionManager
  );
  return { transport, sessionManager, sessionTransport };
};

describe('SessionTransport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reset session when session is expired', async () => {
    // Arrange
    const { sessionManager, sessionTransport } = setupMocks();
    const connectError = new ConnectError(
      'SESSION_EXPIRED',
      Code.InvalidArgument
    );
    vi.mocked(sessionManager.getSessionMetadata).mockRejectedValue(
      connectError
    );
    const message = new RobotService.methods.getOperations.I();

    // Act and Assert
    await expect(
      sessionTransport.unary(
        RobotService,
        RobotService.methods.getOperations,
        undefined,
        undefined,
        undefined,
        message
      )
    ).rejects.toEqual(connectError);
    expect(sessionManager.reset).toHaveBeenCalled();
  });
});
