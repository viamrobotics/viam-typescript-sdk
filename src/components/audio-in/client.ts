import type { RobotClient } from '../../robot';
import type { Options } from '../../types';

import { type JsonObject, type JsonValue, create } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import { AudioInService, GetAudioRequestSchema } from '../../gen/component/audioin/v1/audioin_pb';

import { GetPropertiesRequestSchema } from '../../gen/common/v1/common_pb';
import { type AudioIn, type AudioChunk } from './audio-in';
import { doCommandFromClient, getGeometriesFromClient, getStatusFromClient } from '../../utils';

/*
 * A gRPC-web client for the AudioIn component.
 *
 * @group Clients
 */
export class AudioInClient implements AudioIn {
  private client: Client<typeof AudioInService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(AudioInService);
    this.name = name;
    this.options = options;
  }

  async getGeometries(extra = {}, callOptions = this.callOptions) {
    return getGeometriesFromClient(this.client.getGeometries, this.name, extra, callOptions);
  }

  async *getAudio(
    codec: string,
    durationSeconds: number,
    previousTimestamp = 0n,
    extra = {},
    callOptions = this.callOptions,
  ): AsyncIterable<AudioChunk> {
    const request = create(GetAudioRequestSchema, {
      name: this.name,
      codec,
      durationSeconds,
      previousTimestampNanoseconds: previousTimestamp,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const stream = this.client.getAudio(request, callOptions);

    // Yield chunks as they arrive
    for await (const resp of stream) {
      if (!resp.audio) {
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

  async getProperties(extra = {}, callOptions = this.callOptions) {
    const request = create(GetPropertiesRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getProperties(request, callOptions);

    return {
      supportedCodecs: response.supportedCodecs,
      sampleRateHz: response.sampleRateHz,
      numChannels: response.numChannels,
    };
  }

  async getStatus(callOptions = this.callOptions): Promise<JsonValue> {
    return getStatusFromClient(this.client.getStatus, this.name, this.options, callOptions);
  }

  async doCommand(
    command: JsonObject | Record<string, JsonValue>,
    callOptions = this.callOptions,
  ): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions,
    );
  }
}
