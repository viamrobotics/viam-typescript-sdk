import { EventDispatcher, events } from '../../events';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { StreamServiceClient } from '../../gen/proto/stream/v1/stream_pb_service';
import pb from '../../gen/proto/stream/v1/stream_pb';
import { promisify } from '../../utils';
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
  private client: StreamServiceClient;
  private readonly options: Options;
  private streams: Set<string>;

  constructor(client: RobotClient, options: Options = {}) {
    super();
    this.client = client.createServiceClient(StreamServiceClient);
    this.options = options;
    this.streams = new Set();

    /**
     * Currently this is emitting events for every track that we recieve. In the
     * future we'll want to partition here and have individual events for each
     * stream.
     */
    events.on('track', (args) => {
      this.emit('track', args);
    });

    events.on('reconnected', () => {
      for (const name of this.streams.values()) {
        void this.add(name);
      }
    });
  }

  private get streamService() {
    return this.client;
  }

  async add(name: string) {
    const { streamService } = this;
    const request = new pb.AddStreamRequest();
    const valName = getValidSDPTrackName(name);
    request.setName(valName);
    this.options.requestLogger?.(request);
    try {
      await promisify<pb.AddStreamRequest, pb.AddStreamResponse>(
        streamService.addStream.bind(streamService),
        request
      );
      this.streams.add(name);
    } catch {
      // Try again with just the resource name
      request.setName(name);
      this.options.requestLogger?.(request);
      await promisify<pb.AddStreamRequest, pb.AddStreamResponse>(
        streamService.addStream.bind(streamService),
        request
      );
      this.streams.add(name);
    }
  }

  async remove(name: string) {
    const { streamService } = this;
    const request = new pb.RemoveStreamRequest();
    const valName = getValidSDPTrackName(name);
    request.setName(valName);
    this.options.requestLogger?.(request);
    try {
      await promisify<pb.RemoveStreamRequest, pb.RemoveStreamResponse>(
        streamService.removeStream.bind(streamService),
        request
      );
      this.streams.delete(name);
    } catch {
      // Try again with just the resource name
      request.setName(name);
      this.options.requestLogger?.(request);
      await promisify<pb.RemoveStreamRequest, pb.RemoveStreamResponse>(
        streamService.removeStream.bind(streamService),
        request
      );
      this.streams.delete(name);
    }
  }

  /**
   * Get a stream by name from a StreamClient.
   *
   * @param name - The name of a camera component.
   */
  getStream = async (name: string): Promise<MediaStream> => {
    const streamPromise = new Promise<MediaStream>((resolve, reject) => {
      const handleTrack = (event: RTCTrackEvent) => {
        const [stream] = event.streams;

        if (!stream) {
          this.off('track', handleTrack as (args: unknown) => void);
          reject(new Error('Recieved track event with no streams'));
        } else if (stream.id === name) {
          this.off('track', handleTrack as (args: unknown) => void);
          resolve(stream);
        }
      };

      this.on('track', handleTrack as (args: unknown) => void);
    });

    await this.add(name);

    return streamPromise;
  };
}
