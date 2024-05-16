// @vitest-environment happy-dom

import { vi, beforeEach, afterEach, describe, expect, it } from 'vitest';
import { RobotClient } from '../../robot';
vi.mock('../../robot');

import { StreamServiceClient } from '../../gen/stream/v1/stream_pb_service';
vi.mock('../../gen/stream/v1/stream_pb_service');

import { StreamClient } from './client';
import { EventDispatcher } from '../../events';

describe('StreamClient', () => {
  let robotClient: RobotClient;
  let streamClient: StreamClient;

  beforeEach(() => {
    vi.useFakeTimers();

    const fakehost = 'fakehost';

    robotClient = new EventDispatcher() as RobotClient;
    robotClient.createServiceClient = vi
      .fn()
      .mockImplementation(() => new StreamServiceClient(fakehost));
    streamClient = new StreamClient(robotClient);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('webrtc track will cause the client to emit an event', async () =>
    new Promise<void>((done) => {
      streamClient.on('track', (data) => {
        expect((data as { mock: true }).mock).eq(true);
        done();
      });

      robotClient.emit('track', { mock: true });
    }));

  it('getStream creates and returns a new stream', async () => {
    const fakeCamName = 'fakecam';
    const fakeStream = { id: fakeCamName };
    StreamServiceClient.prototype.addStream = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {});
        streamClient.emit('track', { streams: [fakeStream] });
      });

    const addStream = vi.spyOn(streamClient, 'add');
    await expect(streamClient.getStream(fakeCamName)).resolves.toStrictEqual(
      fakeStream
    );
    expect(addStream).toHaveBeenCalledOnce();
    expect(addStream).toHaveBeenCalledWith(fakeCamName);
  });

  it('getStream fails when add stream fails', async () => {
    const fakeCamName = 'fakecam';
    const error = new Error('could not add stream');
    StreamServiceClient.prototype.addStream = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(error);
      });

    const addStream = vi.spyOn(streamClient, 'add');
    await expect(streamClient.getStream(fakeCamName)).rejects.toThrow(error);
    expect(addStream).toHaveBeenCalledOnce();
    expect(addStream).toHaveBeenCalledWith(fakeCamName);
  });

  it('getStream fails when timeout exceeded', async () => {
    const fakeCamName = 'fakecam';
    StreamServiceClient.prototype.addStream = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {});
      });

    const addStream = vi.spyOn(streamClient, 'add');
    const promise = streamClient.getStream(fakeCamName);
    vi.runAllTimers();
    await expect(promise).rejects.toThrowError(
      'Did not receive a stream after 5000 ms'
    );
    expect(addStream).toHaveBeenCalledOnce();
    expect(addStream).toHaveBeenCalledWith(fakeCamName);
  });

  it('getStream can add the same stream twice', async () => {
    const fakeCamName = 'fakecam';
    const fakeStream = { id: fakeCamName };
    StreamServiceClient.prototype.addStream = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {});
        streamClient.emit('track', { streams: [fakeStream] });
      });

    const addStream = vi.spyOn(streamClient, 'add');
    await expect(streamClient.getStream(fakeCamName)).resolves.toStrictEqual(
      fakeStream
    );
    await expect(streamClient.getStream(fakeCamName)).resolves.toStrictEqual(
      fakeStream
    );
    expect(addStream).toHaveBeenCalledTimes(2);
    expect(addStream).toHaveBeenCalledWith(fakeCamName);
  });
});
