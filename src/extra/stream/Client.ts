import { EventDispatcher, events } from '../../events';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import type { Stream } from './Stream';
import { StreamServiceClient } from '../../gen/proto/stream/v1/stream_pb_service.esm';
import pb from '../../gen/proto/stream/v1/stream_pb.esm';
import { promisify } from '../../utils';

export class StreamClient extends EventDispatcher implements Stream {
  private client: StreamServiceClient;
  private readonly options: Options;

  constructor(client: RobotClient, options: Options = {}) {
    super();
    this.client = client.createServiceClient(StreamServiceClient);
    this.options = options;

    /**
     * Currently this is emitting events for every track that we recieve. In the
     * future we'll want to partition here and have individual events for each
     * stream.
     */
    events.on('track', (args) => this.emit('track', args));
  }

  private get streamService() {
    return this.client;
  }

  // Returns a valid SDP video/audio track name as defined in RFC 4566 (https://www.rfc-editor.org/rfc/rfc4566)
  // where track names should not include colons.
  private getValidSDPTrackName(name: string) {
    return name.replaceAll(":", "+")
  }

  async add(name: string) {
    const streamService = this.streamService;
    const request = new pb.AddStreamRequest();
    request.setName(this.getValidSDPTrackName(name));
    console.log(this.getValidSDPTrackName(name))
    this.options.requestLogger?.(request);
    try {
      await promisify<pb.AddStreamRequest, pb.AddStreamResponse>(
        streamService.addStream.bind(streamService),
        request
      );
    } catch (e) {
      console.log(e)
    }

  }

  async remove(name: string) {
    const streamService = this.streamService;
    const request = new pb.RemoveStreamRequest();
    request.setName(this.getValidSDPTrackName(name));
    console.log(this.getValidSDPTrackName(name))
    this.options.requestLogger?.(request);
    try {
      await promisify<pb.RemoveStreamRequest, pb.RemoveStreamResponse>(
        streamService.removeStream.bind(streamService),
        request
      );
    } catch (e) {
      console.log(e)
    }
  }
}
