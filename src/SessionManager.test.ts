// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ConnectionClosedError } from '@viamrobotics/rpc';
import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { RobotServiceClient } from './gen/robot/v1/robot_pb_service.esm';
import { grpc } from '@improbable-eng/grpc-web';

import SessionManager from './SessionManager';

const host = 'fakeServiceHost';
const transport = new FakeTransportBuilder().build();

let sm: SessionManager;

const mockGetHeartBeatWindow = () => ({
  getSeconds: () => 1,
  getNanos: () => 1,
});

// @ts-expect-error: 7006
const mockHealthyHeartbeat = (_req, _md, cb) => {
  cb(null, 'ok');
};

describe('SessionManager', () => {
  beforeEach(() => {
    sm = new SessionManager(host, transport);
    vi.mock('./gen/robot/v1/robot_pb_service.esm');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('no session initially', () => {
    expect(sm.sessionID).eq('');
  });

  test('start session when sessions are not supported', async () => {
    RobotServiceClient.prototype.startSession = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb({ code: grpc.Code.Unimplemented }, null);
      });

    const metadata = await sm.getSessionMetadata();
    expect(metadata.headersMap).toStrictEqual({});
    expect(sm.sessionID).eq('');
  });

  test('start session without a response', async () => {
    RobotServiceClient.prototype.startSession = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, null);
      });

    await expect(sm.getSessionMetadata()).rejects.toStrictEqual({
      code: grpc.Code.Internal,
      message: 'expected response to start session',
      metadata: new grpc.Metadata(),
    });
    expect(sm.sessionID).eq('');
  });

  test('start session without receiving a heartbeat window', async () => {
    RobotServiceClient.prototype.startSession = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {
          getId: () => 'some-sid',
          getHeartbeatWindow: () => null,
        });
      });

    await expect(sm.getSessionMetadata()).rejects.toStrictEqual({
      code: grpc.Code.Internal,
      message: 'expected heartbeat window in response to start session',
      metadata: new grpc.Metadata(),
    });
    expect(sm.sessionID).eq('');
  });

  test('start session successfully', async () => {
    const expectedSID = 'expected-sid';

    RobotServiceClient.prototype.startSession = vi
      .fn()
      .mockImplementationOnce((_req, _md, cb) => {
        cb(null, {
          getId: () => expectedSID,
          getHeartbeatWindow: mockGetHeartBeatWindow,
        });
      })
      .mockImplementationOnce((_req, _md, cb) => {
        cb(null, {
          getId: () => 'another-sid',
          getHeartbeatWindow: mockGetHeartBeatWindow,
        });
      });
    RobotServiceClient.prototype.sendSessionHeartbeat = vi
      .fn()
      .mockImplementation(mockHealthyHeartbeat);

    let metadata = await sm.getSessionMetadata();
    expect(metadata.headersMap).toStrictEqual({ 'viam-sid': [expectedSID] });
    expect(sm.sessionID).eq(expectedSID);

    metadata = await sm.getSessionMetadata();
    expect(metadata.headersMap).toStrictEqual({ 'viam-sid': [expectedSID] });
    expect(sm.sessionID).eq(expectedSID);
  });

  test('start session and reset', async () => {
    const initialSID = 'sid1';
    const afterResetSID = 'sid2';

    RobotServiceClient.prototype.startSession = vi
      .fn()
      .mockImplementationOnce((_req, _md, cb) => {
        cb(null, {
          getId: () => initialSID,
          getHeartbeatWindow: mockGetHeartBeatWindow,
        });
      })
      .mockImplementationOnce((_req, _md, cb) => {
        cb(null, {
          getId: () => afterResetSID,
          getHeartbeatWindow: mockGetHeartBeatWindow,
        });
      });
    RobotServiceClient.prototype.sendSessionHeartbeat = vi
      .fn()
      .mockImplementation(mockHealthyHeartbeat);

    let metadata = await sm.getSessionMetadata();
    expect(metadata.headersMap).toStrictEqual({ 'viam-sid': [initialSID] });
    expect(sm.sessionID).eq(initialSID);

    sm.reset();

    metadata = await sm.getSessionMetadata();
    expect(metadata.headersMap).toStrictEqual({ 'viam-sid': [afterResetSID] });
    expect(sm.sessionID).eq(afterResetSID);
  });

  test('start session but heartbeat detects closed connection', async () => {
    const initialSID = 'sid1';
    const afterResetSID = 'sid2';

    const reset = vi.spyOn(sm, 'reset');

    RobotServiceClient.prototype.startSession = vi
      .fn()
      .mockImplementationOnce((_req, _md, cb) => {
        cb(null, {
          getId: () => initialSID,
          getHeartbeatWindow: mockGetHeartBeatWindow,
        });
      })
      .mockImplementationOnce((_req, _md, cb) => {
        cb(null, {
          getId: () => afterResetSID,
          getHeartbeatWindow: mockGetHeartBeatWindow,
        });
      });
    RobotServiceClient.prototype.sendSessionHeartbeat = vi
      .fn()
      .mockImplementationOnce((_req, _md, cb) => {
        cb(new ConnectionClosedError('closed'), null);
      })
      .mockImplementation(mockHealthyHeartbeat);

    let metadata = await sm.getSessionMetadata();
    expect(metadata.headersMap).toStrictEqual({ 'viam-sid': [initialSID] });
    expect(sm.sessionID).eq(initialSID);

    expect(reset).toBeCalled();

    metadata = await sm.getSessionMetadata();
    expect(metadata.headersMap).toStrictEqual({ 'viam-sid': [afterResetSID] });
    expect(sm.sessionID).eq(afterResetSID);
  });
});
