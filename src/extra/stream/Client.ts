import type Client from '../../Client';
import type { Options } from '../../types';
import type { Stream } from './Stream';
import { StreamServiceClient } from '../../gen/proto/stream/v1/stream_pb_service.esm';
import pb from '../../gen/proto/stream/v1/stream_pb.esm';
import { promisify } from '../../utils';

export class StreamClient implements Stream {
  private client: StreamServiceClient;
  private readonly options: Options;

  constructor(client: Client, options: Options = {}) {
    this.client = client.createServiceClient(StreamServiceClient);
    this.options = options;
  }

  private get streamService() {
    return this.client;
  }

  async add(name: string) {
    const streamService = this.streamService;
    const request = new pb.AddStreamRequest();
    request.setName(name);

    this.options.requestLogger?.(request);

    await promisify<pb.AddStreamRequest, pb.AddStreamResponse>(
      streamService.addStream.bind(streamService),
      request
    );
  }

  async remove(name: string) {
    const streamService = this.streamService;
    const request = new pb.RemoveStreamRequest();
    request.setName(name);

    this.options.requestLogger?.(request);

    await promisify<pb.RemoveStreamRequest, pb.RemoveStreamResponse>(
      streamService.removeStream.bind(streamService),
      request
    );
  }
}
