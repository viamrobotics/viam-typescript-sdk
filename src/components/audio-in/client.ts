import type { RobotClient } from '../../robot';
import type { Options } from '../../types';

import { Duration, Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import { AudioInService } from '../../gen/component/audioin/v1/audioin_connect';
import { GetAudioRequest } from '../../gen/component/audioin/v1/audioin_pb';
import { GetPropertiesRequest } from '../../gen/common/v1/common_pb';
import { type AudioIn, type AudioChunk } from './audio-in';
import { doCommandFromClient } from '../../utils';


/*
 * A gRPC-web client for the AudioIn component.
 *
 * @group Clients
 */
export class AudioInClient implements AudioIn {
  private client: Client<typeof AudioInService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(AudioInService);
    this.name = name;
    this.options = options;
  }


    async *getAudio(audioData: Uint8Array,
    codec: string,
    durationSeconds: number,
    previousTimestamp: bigint,
    extra?: Struct,
    callOptions = this.callOptions) {

        const request = GetAudioRequest({
            name: this.name,
            codec: codec,
            durationSeconds: durationSeconds,
            previousTimestampNanoseconds: previousTimestamp,
            extra: Struct.fromJson(extra),
        });

        this.options.requestLogger?.(request);

        const stream = this.client.GetAudio(request, callOptions);

          // Yield chunks as they arrive
        for await (const chunk of stream) {
            yield {
            audioData: chunk.audioData,
            audioInfo: chunk.audioInfo,
            startTimeNs: chunk.startTimeNs,
            endTimeNs: chunk.endTimeNs,
            sequence: chunk.sequence,
            requestID: chunk.requestID
            }
      }

    }

  async getProperties(callOptions = this.callOptions) {
    const request = new GetPropertiesRequest({
      name: this.name,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getProperties(request, callOptions);

    return {
      supportedCodecs: response.supportedCodecs,
      sampleRateHz: response.sampleRateHz,
      numChannels: response.numChannels,
    };
  }

  async doCommand(
    command: Struct,
    callOptions = this.callOptions
  ): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions
    );
  }
}


