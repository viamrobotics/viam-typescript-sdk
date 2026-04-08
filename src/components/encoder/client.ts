import { create } from "@bufbuild/protobuf";
import type { CallOptions, Client } from "@connectrpc/connect";
import {
  EncoderService,
  GetPositionRequestSchema,
  GetPropertiesRequestSchema,
  ResetPositionRequestSchema,
} from "../../gen/component/encoder/v1/encoder_pb";
import type { RobotClient } from "../../robot";
import type { JsonObject, Options } from "../../types";
import { doCommandFromClient, getStatusFromClient } from "../../utils";
import { EncoderPositionType, type Encoder } from "./encoder";

/**
 * A gRPC-web client for the Encoder component.
 *
 * @group Clients
 */
export class EncoderClient implements Encoder {
  private client: Client<typeof EncoderService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(EncoderService);
    this.name = name;
    this.options = options;
  }

  async resetPosition(extra = {}, callOptions = this.callOptions) {
    const request = create(ResetPositionRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.resetPosition(request, callOptions);
  }

  async getProperties(extra = {}, callOptions = this.callOptions) {
    const request = create(GetPropertiesRequestSchema, {
      name: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    return this.client.getProperties(request, callOptions);
  }

  async getPosition(
    positionType: EncoderPositionType = EncoderPositionType.UNSPECIFIED,
    extra = {},
    callOptions = this.callOptions,
  ) {
    const request = create(GetPositionRequestSchema, {
      name: this.name,
      positionType,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getPosition(request, callOptions);
    return [response.value, response.positionType] as const;
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
