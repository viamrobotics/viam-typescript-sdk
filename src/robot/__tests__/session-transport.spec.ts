/* eslint-disable @typescript-eslint/unbound-method */
import type { UnaryResponse, StreamResponse } from '@connectrpc/connect';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockTransport } from '../../__mocks__/transports';
import { RobotService } from '../../gen/robot/v1/robot_connect';
import {
  GetOperationsRequest,
  GetOperationsResponse,
  ResourceNamesRequest,
  ResourceNamesResponse,
} from '../../gen/robot/v1/robot_pb';
import SessionManager from '../session-manager';
import SessionTransport from '../session-transport';
import { createMockSessionManager } from '../__mocks__/session-manager';
import {
  HEARTBEAT_MONITORED_METHOD,
  withSessionMetadata,
  withoutSessionMetadata,
  sessionExpiredError,
  otherError,
  testMessage,
  testHeaders,
} from '../__fixtures__/session-transport';

const setupSessionTransport = () => {
  const transport = createMockTransport();
  const sessionManager = createMockSessionManager(transport);
  SessionManager.heartbeatMonitoredMethods = {
    [HEARTBEAT_MONITORED_METHOD]: true,
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
    SessionManager.heartbeatMonitoredMethods = {};
  });

  describe('unary', () => {
    it('should add session metadata to headers for heartbeat-monitored methods', async () => {
      // Arrange
      const { transport, sessionManager, sessionTransport } =
        setupSessionTransport();
      const mockResponse = {
        header: new Headers(),
        message: new GetOperationsResponse(),
      } as unknown as UnaryResponse<
        GetOperationsRequest,
        GetOperationsResponse
      >;
      const getSessionMetadataMock = vi.mocked(
        sessionManager.getSessionMetadata
      );
      const transportUnaryMock = vi.mocked(transport.unary);
      getSessionMetadataMock.mockResolvedValue(withSessionMetadata);
      transportUnaryMock.mockResolvedValue(mockResponse);

      // Act
      await sessionTransport.unary(
        RobotService,
        RobotService.methods.getOperations,
        undefined,
        undefined,
        undefined,
        testMessage
      );

      // Assert
      expect(getSessionMetadataMock).toHaveBeenCalledOnce();
      expect(transportUnaryMock).toHaveBeenCalledOnce();
      const [callArgs] = transportUnaryMock.mock.calls;
      expect(callArgs).toBeDefined();
      const headers = callArgs![4] as Headers;
      expect(headers.get('viam-sid')).toBe('test-session-id-123');
    });

    it('should not add session metadata for non-heartbeat-monitored methods', async () => {
      // Arrange
      const { transport, sessionManager, sessionTransport } =
        setupSessionTransport();
      const resourceNamesMessage = new ResourceNamesRequest();
      const mockResponse = {
        header: new Headers(),
        message: new ResourceNamesResponse(),
      } as unknown as UnaryResponse<
        ResourceNamesRequest,
        ResourceNamesResponse
      >;
      const getSessionMetadataMock = vi.mocked(
        sessionManager.getSessionMetadata
      );
      const transportUnaryMock = vi.mocked(transport.unary);
      transportUnaryMock.mockResolvedValue(mockResponse);

      // Act
      await sessionTransport.unary(
        RobotService,
        RobotService.methods.resourceNames,
        undefined,
        undefined,
        undefined,
        resourceNamesMessage
      );

      // Assert
      expect(getSessionMetadataMock).not.toHaveBeenCalled();
      expect(transportUnaryMock).toHaveBeenCalledOnce();
      const [callArgs] = transportUnaryMock.mock.calls;
      expect(callArgs).toBeDefined();
      const headers = callArgs![4] as Headers | undefined;
      expect(headers?.get('viam-sid')).toBeNull();
    });

    it('should merge session metadata with existing headers', async () => {
      // Arrange
      const { transport, sessionManager, sessionTransport } =
        setupSessionTransport();
      const mockResponse = {
        header: new Headers(),
        message: new GetOperationsResponse(),
      } as unknown as UnaryResponse<
        GetOperationsRequest,
        GetOperationsResponse
      >;
      const getSessionMetadataMock = vi.mocked(
        sessionManager.getSessionMetadata
      );
      const transportUnaryMock = vi.mocked(transport.unary);
      getSessionMetadataMock.mockResolvedValue(withSessionMetadata);
      transportUnaryMock.mockResolvedValue(mockResponse);

      // Act
      await sessionTransport.unary(
        RobotService,
        RobotService.methods.getOperations,
        undefined,
        undefined,
        testHeaders,
        testMessage
      );

      // Assert
      const [callArgs] = transportUnaryMock.mock.calls;
      expect(callArgs).toBeDefined();
      const headers = callArgs![4] as Headers;
      expect(headers.get('existing-header')).toBe('existing-value');
      expect(headers.get('viam-sid')).toBe('test-session-id-123');
    });

    it('should reset session when SESSION_EXPIRED error occurs', async () => {
      // Arrange
      const { sessionManager, sessionTransport } = setupSessionTransport();
      const getSessionMetadataMock = vi.mocked(
        sessionManager.getSessionMetadata
      );
      const resetMock = vi.mocked(sessionManager.reset);
      getSessionMetadataMock.mockRejectedValue(sessionExpiredError);

      // Act & Assert
      await expect(
        sessionTransport.unary(
          RobotService,
          RobotService.methods.getOperations,
          undefined,
          undefined,
          undefined,
          testMessage
        )
      ).rejects.toEqual(sessionExpiredError);
      expect(resetMock).toHaveBeenCalledOnce();
    });

    it('should propagate other errors without resetting session', async () => {
      // Arrange
      const { sessionManager, sessionTransport } = setupSessionTransport();
      const getSessionMetadataMock = vi.mocked(
        sessionManager.getSessionMetadata
      );
      const resetMock = vi.mocked(sessionManager.reset);
      getSessionMetadataMock.mockRejectedValue(otherError);

      // Act & Assert
      await expect(
        sessionTransport.unary(
          RobotService,
          RobotService.methods.getOperations,
          undefined,
          undefined,
          undefined,
          testMessage
        )
      ).rejects.toEqual(otherError);
      expect(resetMock).not.toHaveBeenCalled();
    });

    it('should pass through all parameters to underlying transport', async () => {
      // Arrange
      const { transport, sessionManager, sessionTransport } =
        setupSessionTransport();
      const mockResponse = {
        header: new Headers(),
        message: new GetOperationsResponse(),
      } as unknown as UnaryResponse<
        GetOperationsRequest,
        GetOperationsResponse
      >;
      const { signal } = new AbortController();
      const timeoutMs = 5000;
      const getSessionMetadataMock = vi.mocked(
        sessionManager.getSessionMetadata
      );
      const transportUnaryMock = vi.mocked(transport.unary);
      getSessionMetadataMock.mockResolvedValue(withoutSessionMetadata);
      transportUnaryMock.mockResolvedValue(mockResponse);

      // Act
      await sessionTransport.unary(
        RobotService,
        RobotService.methods.getOperations,
        signal,
        timeoutMs,
        testHeaders,
        testMessage
      );

      // Assert
      expect(transportUnaryMock).toHaveBeenCalledWith(
        RobotService,
        RobotService.methods.getOperations,
        signal,
        timeoutMs,
        expect.any(Headers),
        testMessage,
        undefined
      );
    });
  });

  describe('stream', () => {
    it('should add session metadata to headers for heartbeat-monitored methods', async () => {
      // Arrange
      const { transport, sessionManager, sessionTransport } =
        setupSessionTransport();
      const createMockStream = async function* createMockStreamGenerator() {
        await Promise.resolve();
        yield { message: new GetOperationsResponse() };
      };
      const mockStream = {
        header: new Headers(),
        [Symbol.asyncIterator]: createMockStream,
      } as unknown as StreamResponse<
        GetOperationsRequest,
        GetOperationsResponse
      >;
      const getSessionMetadataMock = vi.mocked(
        sessionManager.getSessionMetadata
      );
      const transportStreamMock = vi.mocked(transport.stream);
      getSessionMetadataMock.mockResolvedValue(withSessionMetadata);
      transportStreamMock.mockResolvedValue(mockStream);

      const createInput = async function* createInputGenerator() {
        await Promise.resolve();
        yield testMessage;
      };

      // Act
      await sessionTransport.stream(
        RobotService,
        RobotService.methods.getOperations,
        undefined,
        undefined,
        undefined,
        createInput()
      );

      // Assert
      expect(getSessionMetadataMock).toHaveBeenCalledOnce();
      expect(transportStreamMock).toHaveBeenCalledOnce();
      const [callArgs] = transportStreamMock.mock.calls;
      expect(callArgs).toBeDefined();
      const headers = callArgs![4] as Headers;
      expect(headers.get('viam-sid')).toBe('test-session-id-123');
    });

    it('should not add session metadata for non-heartbeat-monitored methods', async () => {
      // Arrange
      const { transport, sessionManager, sessionTransport } =
        setupSessionTransport();
      const resourceNamesMessage = new ResourceNamesRequest();
      const createMockStream = async function* createMockStreamGenerator() {
        await Promise.resolve();
        yield { message: new ResourceNamesResponse() };
      };
      const mockStream = {
        header: new Headers(),
        [Symbol.asyncIterator]: createMockStream,
      } as unknown as StreamResponse<
        ResourceNamesRequest,
        ResourceNamesResponse
      >;
      const getSessionMetadataMock = vi.mocked(
        sessionManager.getSessionMetadata
      );
      const transportStreamMock = vi.mocked(transport.stream);
      transportStreamMock.mockResolvedValue(mockStream);

      const createInput = async function* createInputGenerator() {
        await Promise.resolve();
        yield resourceNamesMessage;
      };

      // Act
      await sessionTransport.stream(
        RobotService,
        RobotService.methods.resourceNames,
        undefined,
        undefined,
        undefined,
        createInput()
      );

      // Assert
      expect(getSessionMetadataMock).not.toHaveBeenCalled();
      expect(transportStreamMock).toHaveBeenCalledOnce();
      const [callArgs] = transportStreamMock.mock.calls;
      expect(callArgs).toBeDefined();
      const headers = callArgs![4] as Headers | undefined;
      expect(headers?.get('viam-sid')).toBeNull();
    });

    it('should reset session when SESSION_EXPIRED error occurs in stream', async () => {
      // Arrange
      const { sessionManager, sessionTransport } = setupSessionTransport();
      const getSessionMetadataMock = vi.mocked(
        sessionManager.getSessionMetadata
      );
      const resetMock = vi.mocked(sessionManager.reset);
      getSessionMetadataMock.mockRejectedValue(sessionExpiredError);

      const createInput = async function* createInputGenerator() {
        await Promise.resolve();
        yield testMessage;
      };

      // Act & Assert
      await expect(
        sessionTransport.stream(
          RobotService,
          RobotService.methods.getOperations,
          undefined,
          undefined,
          undefined,
          createInput()
        )
      ).rejects.toEqual(sessionExpiredError);
      expect(resetMock).toHaveBeenCalledOnce();
    });
  });
});
