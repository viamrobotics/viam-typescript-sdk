import type { RobotClient } from '../../robot';
import type { Options, StructInput } from '../../types';

import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import { AudioOutService } from '../../gen/component/audioout/v1/audioout_connect';
import { PlayRequest } from '../../gen/component/audioout/v1/audioout_pb';
import {
  GetPropertiesRequest,
  type AudioInfo,
} from '../../gen/common/v1/common_pb';
import { type AudioOut } from './audio-out';
import { doCommandFromClient } from '../../utils';

/**
 * A gRPC-web client for the AudioOut component.
 *
 * @group Clients
 */
export class AudioOutClient implements AudioOut {
  private client: Client<typeof AudioOutService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(AudioOutService);
    this.name = name;
    this.options = options;
  }

  async play(
    audioData: Uint8Array,
    audioInfo?: AudioInfo,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new PlayRequest({
      name: this.name,
      audioData,
      audioInfo,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.play(request, callOptions);
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
    command: StructInput,
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
