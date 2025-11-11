// @vitest-environment happy-dom

import { Duration } from '@bufbuild/protobuf';
import { ConnectError, createRouterTransport } from '@connectrpc/connect';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConnectionClosedError } from '../../rpc';
import { RobotService } from '../../gen/robot/v1/robot_connect';
import {
  SendSessionHeartbeatResponse,
  StartSessionResponse,
} from '../../gen/robot/v1/robot_pb';
import SessionManager from '../session-manager';

vi.mock('../gen/robot/v1/robot_pb_service');

const mockGetHeartBeatWindow = new Duration({
  seconds: BigInt(1),
  nanos: 1,
});

const setupSessionManager = (
  transport = createRouterTransport(() => ({})),
  host = ''
) => {
  return new SessionManager(host, () => transport);
};

describe('SessionManager', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should have no session initially', () => {
    // Arrange
    const sessionManager = setupSessionManager();

    // Act & Assert
    expect(sessionManager.sessionID).toBe('');
  });

  it('should start session when sessions are not supported', async () => {
    // Arrange
    const transport = createRouterTransport(() => ({}));
    const sessionManager = setupSessionManager(transport);
    const expected = new Headers();

    // Act & Assert
    await expect(sessionManager.getSessionMetadata()).resolves.toStrictEqual(
      expected
    );
    expect(sessionManager.sessionID).toBe('');
  });

  it('should start session without receiving a heartbeat window', async () => {
    // Arrange
    const transport = createRouterTransport(({ service }) => {
      service(RobotService, {
        startSession: () => {
          return new StartSessionResponse({
            id: 'some-sid',
          });
        },
      });
    });
    const sessionManager = setupSessionManager(transport);

    // Act & Assert
    await expect(sessionManager.getSessionMetadata()).rejects.toStrictEqual(
      new Error('expected heartbeat window in response to start session')
    );
    expect(sessionManager.sessionID).toBe('');
  });

  it('should start session successfully', async () => {
    // Arrange
    const expectedSID = 'expected-sid';
    const startSessionMock = vi.fn();
    startSessionMock.mockReturnValueOnce(
      new StartSessionResponse({
        id: expectedSID,
        heartbeatWindow: mockGetHeartBeatWindow,
      })
    );

    const transport = createRouterTransport(({ service }) => {
      service(RobotService, {
        startSession: startSessionMock,
        sendSessionHeartbeat: () => new SendSessionHeartbeatResponse(),
      });
    });
    const sessionManager = setupSessionManager(transport);

    // Act
    const expected = new Headers({ 'viam-sid': expectedSID });
    await expect(sessionManager.getSessionMetadata()).resolves.toStrictEqual(
      expected
    );

    // Assert
    expect(sessionManager.sessionID).toBe(expectedSID);

    // Act - call again to verify session is reused
    await expect(sessionManager.getSessionMetadata()).resolves.toStrictEqual(
      expected
    );

    // Assert - session should still be the same
    expect(sessionManager.sessionID).toBe(expectedSID);
    expect(startSessionMock).toHaveBeenCalledOnce();
  });

  it('should start session and reset', async () => {
    // Arrange
    const initialSID = 'sid1';
    const afterResetSID = 'sid2';
    const startSessionMock = vi
      .fn()
      .mockReturnValueOnce(
        new StartSessionResponse({
          id: initialSID,
          heartbeatWindow: mockGetHeartBeatWindow,
        })
      )
      .mockReturnValueOnce(
        new StartSessionResponse({
          id: afterResetSID,
          heartbeatWindow: mockGetHeartBeatWindow,
        })
      );

    const transport = createRouterTransport(({ service }) => {
      service(RobotService, {
        startSession: startSessionMock,
        sendSessionHeartbeat: () => new SendSessionHeartbeatResponse(),
      });
    });
    const sessionManager = setupSessionManager(transport);

    // Act - start initial session
    let expected = new Headers({ 'viam-sid': initialSID });
    await expect(sessionManager.getSessionMetadata()).resolves.toStrictEqual(
      expected
    );

    // Assert
    expect(sessionManager.sessionID).toBe(initialSID);

    // Act - reset and start new session
    sessionManager.reset();
    expected = new Headers({ 'viam-sid': afterResetSID });
    await expect(sessionManager.getSessionMetadata()).resolves.toStrictEqual(
      expected
    );

    // Assert
    expect(sessionManager.sessionID).toBe(afterResetSID);
  });

  it('should start session but heartbeat detects closed connection', async () => {
    // Arrange
    vi.useFakeTimers();
    const initialSID = 'sid1';
    const afterResetSID = 'sid2';
    const startSessionMock = vi
      .fn()
      .mockReturnValueOnce(
        new StartSessionResponse({
          id: initialSID,
          heartbeatWindow: mockGetHeartBeatWindow,
        })
      )
      .mockReturnValueOnce(
        new StartSessionResponse({
          id: afterResetSID,
          heartbeatWindow: mockGetHeartBeatWindow,
        })
      );

    const sendHeartbeatMock = vi
      .fn()
      .mockImplementationOnce(() => {
        throw ConnectError.from(new ConnectionClosedError('closed'));
      })
      .mockReturnValue(new SendSessionHeartbeatResponse());

    const transport = createRouterTransport(({ service }) => {
      service(RobotService, {
        startSession: startSessionMock,
        sendSessionHeartbeat: sendHeartbeatMock,
      });
    });
    const sessionManager = setupSessionManager(transport);
    // eslint-disable-next-line vitest/no-restricted-vi-methods
    const resetSpy = vi.spyOn(sessionManager, 'reset');

    // Act - start initial session
    let expected = new Headers({ 'viam-sid': initialSID });
    await expect(sessionManager.getSessionMetadata()).resolves.toStrictEqual(
      expected
    );
    expect(sessionManager.sessionID).toBe(initialSID);

    // Act - advance time to trigger heartbeat that detects disconnection
    await vi.advanceTimersByTimeAsync(250);

    // Assert - reset should have been called due to connection closed error
    expect(resetSpy).toHaveBeenCalled();

    // Act - get session metadata again after reset
    expected = new Headers({ 'viam-sid': afterResetSID });
    await expect(sessionManager.getSessionMetadata()).resolves.toStrictEqual(
      expected
    );

    // Assert
    expect(sessionManager.sessionID).toBe(afterResetSID);
  });
});
