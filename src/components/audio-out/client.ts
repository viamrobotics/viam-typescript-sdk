import type { RobotClient } from "../../robot";
import type { JsonObject, Options } from "../../types";

import { create } from "@bufbuild/protobuf";
import type { CallOptions, Client } from "@connectrpc/connect";
import {
  GetPropertiesRequestSchema,
  type AudioInfo,
} from "../../gen/common/v1/common_pb";
import {
  AudioOutService,
  PlayRequestSchema,
} from "../../gen/component/audioout/v1/audioout_pb";
import { doCommandFromClient, getStatusFromClient } from "../../utils";
import { type AudioOut } from "./audio-out";

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
    callOptions = this.callOptions,
  ) {
    const request = create(PlayRequestSchema, {
      name: this.name,
      audioData,
      audioInfo,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.play(request, callOptions);
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

  async getStatus(callOptions = this.callOptions): Promise<JsonObject> {
    return getStatusFromClient(
      this.client.getStatus,
      this.name,
      this.options,
      callOptions,
    );
  }

  async doCommand(
    command: JsonObject,
    callOptions = this.callOptions,
  ): Promise<JsonObject> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions,
    );
  }
}
