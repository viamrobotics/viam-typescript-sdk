import type Client from '../../Client'
import type { Stream } from './Stream'
import { StreamServiceClient } from '../../gen/proto/stream/v1/stream_pb_service.esm'
import pb from '../../gen/proto/stream/v1/stream_pb.esm'
import { promisify } from '../../utils'

export class StreamClient implements Stream {
  private client: StreamServiceClient

  constructor (client: Client) {
    this.client = client.createServiceClient(StreamServiceClient)
  }

  private get streamService () {
    return this.client
  }

  async add (name: string) {
    const streamService = this.streamService
    const request = new pb.AddStreamRequest()
    request.setName(name)

    await promisify<pb.AddStreamRequest, pb.AddStreamResponse>(
      streamService.addStream.bind(streamService),
      request
    )
  }

  async remove (name: string) {
    const streamService = this.streamService
    const request = new pb.RemoveStreamRequest()
    request.setName(name)

    await promisify<pb.RemoveStreamRequest, pb.RemoveStreamResponse>(
      streamService.removeStream.bind(streamService),
      request
    )
  }
}
