// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionClosedError } from '../rpc';
vi.mock('../gen/robot/v1/robot_pb_service');

import { Duration } from '@bufbuild/protobuf';
import {
  ConnectError,
  createRouterTransport,
  type Transport,
} from '@connectrpc/connect';
import { RobotService } from '../gen/robot/v1/robot_connect';
import {
  SendSessionHeartbeatResponse,
  StartSessionResponse,
} from '../gen/robot/v1/robot_pb';
import SessionManager from './session-manager';

let mockTransport: Transport;
let sm: SessionManager;

const mockGetHeartBeatWindow = new Duration({
  seconds: BigInt(1),
  nanos: 1,
});

describe('SessionManager', () => {
  beforeEach(() => {
    sm = new SessionManager(() => mockTransport);
  });

  it('no session initially', () => {
    expect(sm.sessionID).eq('');
  });

  it('start session when sessions are not supported', async () => {
    mockTransport = createRouterTransport(() => {
      return {};
    });

    const expected = new Headers();
    await expect(sm.getSessionMetadata()).resolves.toStrictEqual(expected);
    expect(sm.sessionID).eq('');
  });

  it('start session without receiving a heartbeat window', async () => {
    mockTransport = createRouterTransport(({ service }) => {
      service(RobotService, {
        startSession: () => {
          return new StartSessionResponse({
            id: 'some-sid',
          });
        },
      });
    });

    await expect(sm.getSessionMetadata()).rejects.toStrictEqual(
      new Error('expected heartbeat window in response to start session')
    );
    expect(sm.sessionID).eq('');
  });

  it('start session successfully', async () => {
    const expectedSID = 'expected-sid';

    let once = false;
    mockTransport = createRouterTransport(({ service }) => {
      service(RobotService, {
        startSession: () => {
          if (!once) {
            once = true;
            return new StartSessionResponse({
              id: expectedSID,
              heartbeatWindow: mockGetHeartBeatWindow,
            });
          }
          return new StartSessionResponse({
            id: 'another-sid',
            heartbeatWindow: mockGetHeartBeatWindow,
          });
        },
        sendSessionHeartbeat: () => new SendSessionHeartbeatResponse(),
      });
    });

    let expected = new Headers({ 'viam-sid': expectedSID });
    await expect(sm.getSessionMetadata()).resolves.toStrictEqual(expected);
    expect(sm.sessionID).eq(expectedSID);

    expected = new Headers({ 'viam-sid': expectedSID });
    await expect(sm.getSessionMetadata()).resolves.toStrictEqual(expected);
    expect(sm.sessionID).eq(expectedSID);
  });

  it('start session and reset', async () => {
    const initialSID = 'sid1';
    const afterResetSID = 'sid2';

    let once = false;
    mockTransport = createRouterTransport(({ service }) => {
      service(RobotService, {
        startSession: () => {
          if (!once) {
            once = true;
            return new StartSessionResponse({
              id: initialSID,
              heartbeatWindow: mockGetHeartBeatWindow,
            });
          }
          return new StartSessionResponse({
            id: afterResetSID,
            heartbeatWindow: mockGetHeartBeatWindow,
          });
        },
        sendSessionHeartbeat: () => new SendSessionHeartbeatResponse(),
      });
    });

    let expected = new Headers({ 'viam-sid': initialSID });
    await expect(sm.getSessionMetadata()).resolves.toStrictEqual(expected);
    expect(sm.sessionID).eq(initialSID);

    sm.reset();

    expected = new Headers({ 'viam-sid': afterResetSID });
    await expect(sm.getSessionMetadata()).resolves.toStrictEqual(expected);
    expect(sm.sessionID).eq(afterResetSID);
  });

  it('start session but heartbeat detects closed connection', async () => {
    const initialSID = 'sid1';
    const afterResetSID = 'sid2';

    // eslint-disable-next-line vitest/no-restricted-vi-methods
    const reset = vi.spyOn(sm, 'reset');

    let startOnce = false;
    let sendOnce = false;
    mockTransport = createRouterTransport(({ service }) => {
      service(RobotService, {
        startSession: () => {
          if (!startOnce) {
            startOnce = true;
            return new StartSessionResponse({
              id: initialSID,
              heartbeatWindow: mockGetHeartBeatWindow,
            });
          }
          return new StartSessionResponse({
            id: afterResetSID,
            heartbeatWindow: mockGetHeartBeatWindow,
          });
        },
        sendSessionHeartbeat: () => {
          if (!sendOnce) {
            sendOnce = true;
            throw ConnectError.from(new ConnectionClosedError('closed'));
          }
          return new SendSessionHeartbeatResponse();
        },
      });
    });

    let expected = new Headers({ 'viam-sid': initialSID });
    await expect(sm.getSessionMetadata()).resolves.toStrictEqual(expected);
    expect(sm.sessionID).eq(initialSID);

    await delay(250);
    // eslint-disable-next-line  @typescript-eslint/no-confusing-void-expression
    expect(reset).toHaveBeenCalled();

    expected = new Headers({ 'viam-sid': afterResetSID });
    await expect(sm.getSessionMetadata()).resolves.toStrictEqual(expected);
    expect(sm.sessionID).eq(afterResetSID);
  });
});

const delay = async (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
