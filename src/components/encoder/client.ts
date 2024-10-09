import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, PromiseClient } from '@connectrpc/connect';
import { EncoderService } from '../../gen/component/encoder/v1/encoder_connect';
import {
  GetPositionRequest,
  GetPropertiesRequest,
  ResetPositionRequest,
} from '../../gen/component/encoder/v1/encoder_pb';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import { EncoderPositionType, type Encoder } from './encoder';

/**
 * A gRPC-web client for the Encoder component.
 *
 * @group Clients
 */
export class EncoderClient implements Encoder {
  private client: PromiseClient<typeof EncoderService>;
  private readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(EncoderService);
    this.name = name;
    this.options = options;
  }

  async resetPosition(extra = {}, callOptions = this.callOptions) {
    const request = new ResetPositionRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.resetPosition(request, callOptions);
  }

  async getProperties(extra = {}, callOptions = this.callOptions) {
    const request = new GetPropertiesRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    return this.client.getProperties(request, callOptions);
  }

  async getPosition(
    positionType: EncoderPositionType = EncoderPositionType.UNSPECIFIED,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new GetPositionRequest({
      name: this.name,
      positionType,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const response = await this.client.getPosition(request, callOptions);
    return [response.value, response.positionType] as const;
  }

  async doCommand(command: Struct): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options
    );
  }
}
