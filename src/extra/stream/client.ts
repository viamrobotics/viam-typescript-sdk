import type { Client } from '@connectrpc/connect';
import { EventDispatcher, MachineConnectionEvent } from '../../events';
import { StreamService } from '../../gen/stream/v1/stream_connect';
import {
  AddStreamRequest,
  RemoveStreamRequest,
  GetStreamOptionsRequest,
  SetStreamOptionsRequest,
  Resolution,
} from '../../gen/stream/v1/stream_pb';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import type { Stream } from './stream';

/*
 * Returns a valid SDP video/audio track name as defined in RFC 4566 (https://www.rfc-editor.org/rfc/rfc4566)
 * where track names should not include colons.
 */
const getValidSDPTrackName = (name: string) => {
  return name.replaceAll(':', '+');
};

/**
 * A gRPC-web client for a Stream.
 *
 * @group Clients
 */
export class StreamClient extends EventDispatcher implements Stream {
  private client: Client<typeof StreamService>;
  private readonly options: Options;
  private streams: Set<string>;

  constructor(client: RobotClient, options: Options = {}) {
    super();
    this.client = client.createServiceClient(StreamService);
    this.options = options;
    this.streams = new Set();

    /**
     * Currently this is emitting events for every track that we receive. In the
     * future we'll want to partition here and have individual events for each
     * stream.
     */
    client.on('track', (args) => {
      this.emit('track', args);
    });

    client.on(MachineConnectionEvent.CONNECTED, () => {
      for (const name of this.streams.values()) {
        void this.add(name);
      }
    });
  }

  async add(name: string) {
    const request = new AddStreamRequest({
      name: getValidSDPTrackName(name),
    });
    this.options.requestLogger?.(request);
    try {
      await this.client.addStream(request);
      this.streams.add(name);
    } catch {
      // Try again with just the resource name
      request.name = name;
      this.options.requestLogger?.(request);
      await this.client.addStream(request);
      this.streams.add(name);
    }
  }

  async remove(name: string) {
    const request = new RemoveStreamRequest({
      name: getValidSDPTrackName(name),
    });
    this.options.requestLogger?.(request);
    try {
      await this.client.removeStream(request);
      this.streams.delete(name);
    } catch {
      // Try again with just the resource name
      request.name = name;
      this.options.requestLogger?.(request);
      await this.client.removeStream(request);
      this.streams.delete(name);
    }
  }

  /**
   * Get the available livestream resolutions for a camera component. If the
   * stream client cannot find any available resolutions, an empty list will be
   * returned.
   *
   * @param resourceName - The name of a camera component.
   * @returns A list of available resolutions for livestreaming.
   */
  async getOptions(resourceName: string): Promise<Resolution[]> {
    const fetchOptions = async (name: string): Promise<Resolution[]> => {
      const request = new GetStreamOptionsRequest({ name });
      this.options.requestLogger?.(request);
      try {
        const response = await this.client.getStreamOptions(request);
        return response.resolutions;
      } catch {
        return [];
      }
    };

    const trackName = getValidSDPTrackName(resourceName);
    let resolutions = await fetchOptions(trackName);
    if (resolutions.length > 0) {
      return resolutions;
    }
    // Second attempt with resource name
    resolutions = await fetchOptions(resourceName);
    return resolutions;
  }

  /**
   * Set the livestream options for a camera component. This will change the
   * resolution of the stream to the specified width and height.
   *
   * @param name - The name of a camera component.
   * @param width - The width of the resolution.
   * @param height - The height of the resolution.
   */
  async setOptions(name: string, width: number, height: number) {
    const request = new SetStreamOptionsRequest({
      name: getValidSDPTrackName(name),
      resolution: {
        width,
        height,
      },
    });
    this.options.requestLogger?.(request);
    try {
      await this.client.setStreamOptions(request);
    } catch {
      // Try again with just the resource name
      request.name = name;
      this.options.requestLogger?.(request);
      await this.client.setStreamOptions(request);
    }
  }

  /**
   * Reset the livestream options for a camera component. This will reset the
   * resolution to the default component attributes.
   *
   * @param name - The name of a camera component.
   */
  async resetOptions(name: string) {
    const request = new SetStreamOptionsRequest({
      name: getValidSDPTrackName(name),
    });
    this.options.requestLogger?.(request);
    try {
      await this.client.setStreamOptions(request);
    } catch {
      // Try again with just the resource name
      request.name = name;
      this.options.requestLogger?.(request);
      await this.client.setStreamOptions(request);
    }
  }

  private STREAM_TIMEOUT = 5000;

  /**
   * Get a stream by name from a StreamClient. Will time out if stream is not
   * received within 5 seconds.
   *
   * @param name - The name of a camera component.
   */
  getStream = async (name: string): Promise<MediaStream> => {
    const streamPromise = new Promise<MediaStream>((resolve, reject) => {
      const handleTrack = (event: RTCTrackEvent) => {
        const [stream] = event.streams;

        if (!stream) {
          this.off('track', handleTrack as (args: unknown) => void);
          reject(new Error('Received track event with no streams'));
        } else if (stream.id === name) {
          this.off('track', handleTrack as (args: unknown) => void);
          resolve(stream);
        }
      };

      this.on('track', handleTrack as (args: unknown) => void);

      setTimeout(() => {
        this.off('track', handleTrack as (args: unknown) => void);
        reject(
          new Error(`Did not receive a stream after ${this.STREAM_TIMEOUT} ms`)
        );
      }, this.STREAM_TIMEOUT);
    });

    await this.add(name);

    return streamPromise;
  };
}
