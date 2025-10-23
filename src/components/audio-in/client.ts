import type { RobotClient } from '../../robot';
import type { Options } from '../../types';

import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import { AudioInService } from '../../gen/component/audioin/v1/audioin_connect';
import { GetAudioRequest } from '../../gen/component/audioin/v1/audioin_pb';
import { GetPropertiesRequest } from '../../gen/common/v1/common_pb';
import { type AudioIn } from './audio-in';
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

  async *getAudio(
    codec: string,
    durationSeconds: number,
    previousTimestamp: bigint,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new GetAudioRequest({
      name: this.name,
      codec,
      durationSeconds,
      previousTimestampNanoseconds: previousTimestamp,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const stream = this.client.getAudio(request, callOptions);

    // Yield chunks as they arrive
    for await (const resp of stream) {
      if (!resp.audio?.audioInfo) {
        continue;
      }
      yield {
        audioData: resp.audio.audioData,
        audioInfo: resp.audio.audioInfo,
        startTimeNs: resp.audio.startTimestampNanoseconds,
        endTimeNs: resp.audio.endTimestampNanoseconds,
        sequence: resp.audio.sequence,
        requestID: resp.requestId,
      };
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
