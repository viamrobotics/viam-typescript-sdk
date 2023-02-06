// @vitest-environment happy-dom

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { RobotServiceClient } from './gen/robot/v1/robot_pb_service.esm';

import SessionManager from './SessionManager';

const host = 'fakeServiceHost';
const transport = new FakeTransportBuilder().build();

let sm: SessionManager;

const mockGetHeartBeatWindow = () => ({
  getSeconds: () => 100,
  getNanos: () => 100,
});

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

  test('start session', async () => {
    const expectedSID = 'expected-sid';

    RobotServiceClient.prototype.startSession = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {
          getId: () => expectedSID,
          getHeartbeatWindow: mockGetHeartBeatWindow,
        });
      });
    RobotServiceClient.prototype.sendSessionHeartbeat = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, 'ok');
      });

    const metadata = await sm.getSessionMetadata();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(metadata.headersMap!['viam-sid']![0]).eq(expectedSID);
    expect(sm.sessionID).eq(expectedSID);
  });
});
