// @vitest-environment happy-dom

import { vi, beforeEach, afterEach, describe, expect, test } from 'vitest';
import { RobotClient } from '../../robot';
import { events } from '../../events';
import { StreamServiceClient } from '../../gen/proto/stream/v1/stream_pb_service';
import { StreamClient } from './client';

let robotClient: RobotClient;
let streamClient: StreamClient;

describe('StreamClient', () => {
  beforeEach(() => {
    vi.mock('./robot/client');

    robotClient = new RobotClient('fakehost');
    vi.mock('./gen/proto/stream/v1/stream_pb_service');

    streamClient = new StreamClient(robotClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('webrtc track will cause the client to emit an event', () =>
    new Promise<void>((done) => {
      streamClient.on('track', (data) => {
        expect((data as { mock: true }).mock).eq(true);
        done();
      });

      events.emit('track', { mock: true });
    }));

  test('getStream creates and returns a new stream', async () => {
    const fakeStream = { id: 'fakecam' };
    StreamServiceClient.prototype.addStream = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {});
        streamClient.emit('track', { streams: [fakeStream] });
      });

    await expect(streamClient.getStream('fakecam')).resolves.toStrictEqual(
      fakeStream
    );
  });
  test('getStream fails when add stream fails', async () => {
    const error = new Error('could not add stream');
    StreamServiceClient.prototype.addStream = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(error);
      });

    await expect(streamClient.getStream('fakecam')).rejects.toStrictEqual(
      error
    );
  });
});
