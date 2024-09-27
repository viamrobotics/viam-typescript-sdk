// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RobotClient } from '../../robot';
vi.mock('../../robot');

vi.mock('../../gen/stream/v1/stream_pb_service');

import {
  ConnectError,
  createPromiseClient,
  createRouterTransport,
  type Transport,
} from '@connectrpc/connect';
import { EventDispatcher } from '../../events';
import { StreamService } from '../../gen/stream/v1/stream_connect';
import { AddStreamResponse } from '../../gen/stream/v1/stream_pb';
import { StreamClient } from './client';

let mockTransport: Transport;

describe('StreamClient', () => {
  let robotClient: RobotClient;
  let streamClient: StreamClient;

  beforeEach(() => {
    vi.useFakeTimers();

    robotClient = new EventDispatcher() as RobotClient;
    robotClient.createServiceClient = vi
      .fn()
      .mockImplementation(() =>
        createPromiseClient(StreamService, mockTransport)
      );
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
    mockTransport = createRouterTransport(({ service }) => {
      service(StreamService, {
        addStream: () => {
          streamClient.emit('track', { streams: [fakeStream] });
          return new AddStreamResponse();
        },
      });
    });

    streamClient = new StreamClient(robotClient);
    // eslint-disable-next-line vitest/no-restricted-vi-methods
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
    mockTransport = createRouterTransport(({ service }) => {
      service(StreamService, {
        addStream: () => {
          throw ConnectError.from(error);
        },
      });
    });

    streamClient = new StreamClient(robotClient);
    // eslint-disable-next-line vitest/no-restricted-vi-methods
    const addStream = vi.spyOn(streamClient, 'add');
    await expect(streamClient.getStream(fakeCamName)).rejects.toThrow(
      ConnectError.from(error)
    );
    expect(addStream).toHaveBeenCalledOnce();
    expect(addStream).toHaveBeenCalledWith(fakeCamName);
  });

  it('getStream fails when timeout exceeded', async () => {
    const fakeCamName = 'fakecam';
    mockTransport = createRouterTransport(({ service }) => {
      service(StreamService, {
        addStream: () => {
          return new AddStreamResponse();
        },
      });
    });

    streamClient = new StreamClient(robotClient);
    // eslint-disable-next-line vitest/no-restricted-vi-methods
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
    mockTransport = createRouterTransport(({ service }) => {
      service(StreamService, {
        addStream: () => {
          streamClient.emit('track', { streams: [fakeStream] });
          return new AddStreamResponse();
        },
      });
    });

    streamClient = new StreamClient(robotClient);
    // eslint-disable-next-line vitest/no-restricted-vi-methods
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
