import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import { SwitchService } from '../../gen/component/switch/v1/switch_connect';
import {
  SetPositionRequest,
  GetPositionRequest,
  GetNumberOfPositionsRequest,
} from '../../gen/component/switch/v1/switch_pb';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Switch } from './switch';

/**
 * A gRPC-web client for the Switch component.
 *
 * @group Clients
 */
export class SwitchClient implements Switch {
  private client: Client<typeof SwitchService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(SwitchService);
    this.name = name;
    this.options = options;
  }

  async setPosition(
    position: number,
    extra = {},
    callOptions = this.callOptions
  ) {
    const request = new SetPositionRequest({
      name: this.name,
      position,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.setPosition(request, callOptions);
  }

  async getPosition(extra = {}, callOptions = this.callOptions) {
    const request = new GetPositionRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPosition(request, callOptions);
    return resp.position;
  }

  async getNumberOfPositions(extra = {}, callOptions = this.callOptions) {
    const request = new GetNumberOfPositionsRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getNumberOfPositions(request, callOptions);
    if (
      resp.labels.length > 0 &&
      resp.labels.length !== resp.numberOfPositions
    ) {
      throw new Error(
        'the number of labels does not match the number of positions'
      );
    }
    return [resp.numberOfPositions, resp.labels] as [number, string[]];
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
