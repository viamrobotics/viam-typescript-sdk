// @vitest-environment happy-dom

import { ConnectError, createRouterTransport } from '@connectrpc/connect';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RobotService } from '../../gen/robot/v1/robot_connect';
import { GetOperationsResponse } from '../../gen/robot/v1/robot_pb';
import GRPCConnectionManager from '../grpc-connection-manager';

vi.mock('../../gen/robot/v1/robot_pb_service');

const setupConnectionManager = (
  transport = createRouterTransport(({ service }) => {
    service(RobotService, {
      getOperations: () => {
        return new GetOperationsResponse();
      },
    });
  }),
  onDisconnect = vi.fn()
) => {
  return new GRPCConnectionManager(() => transport, onDisconnect);
};

describe('GRPCConnectionManager', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should have no connecting attempt initially', () => {
    // Arrange
    const connectionManager = setupConnectionManager();

    // Act & Assert
    expect(connectionManager.connecting).toBe(undefined);
  });

  it('should connect successfully', async () => {
    // Arrange
    const connectionManager = setupConnectionManager();
    // eslint-disable-next-line vitest/no-restricted-vi-methods
    const heartbeat = vi.spyOn(connectionManager, 'heartbeat');

    // Act
    await expect(connectionManager.start()).resolves.toBe(undefined);

    // Assert
    expect(heartbeat).toHaveBeenCalledOnce();
  });

  it('should check connection when not connected', async () => {
    // Arrange
    const transport = createRouterTransport(({ service }) => {
      service(RobotService, {
        getOperations: () => {
          throw ConnectError.from(new Error('not connected'));
        },
      });
    });
    const connectionManager = setupConnectionManager(transport);
    // eslint-disable-next-line vitest/no-restricted-vi-methods
    const heartbeat = vi.spyOn(connectionManager, 'heartbeat');

    // Act & Assert
    await expect(connectionManager.start()).rejects.toThrow(
      ConnectError.from(new Error('not connected'))
    );
    expect(heartbeat).not.toHaveBeenCalled();
  });

  it('should successfully detect connection and then disconnect', async () => {
    // Arrange
    vi.useFakeTimers();
    const getOperationsMock = vi
      .fn()
      .mockReturnValueOnce(new GetOperationsResponse())
      .mockImplementationOnce(() => {
        throw ConnectError.from(new Error('disconnected'));
      });

    const transport = createRouterTransport(({ service }) => {
      service(RobotService, {
        getOperations: getOperationsMock,
      });
    });
    const onDisconnect = vi.fn();
    const connectionManager = setupConnectionManager(transport, onDisconnect);
    // eslint-disable-next-line vitest/no-restricted-vi-methods
    const heartbeat = vi.spyOn(connectionManager, 'heartbeat');

    // Act
    await expect(connectionManager.start()).resolves.toBe(undefined);
    await vi.advanceTimersByTimeAsync(250);

    // Assert
    expect(heartbeat).toHaveBeenCalledOnce();
    expect(onDisconnect).toHaveBeenCalled();
  });
});
