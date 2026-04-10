import { create } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';

import {
  GetNumberOfPositionsRequestSchema,
  GetPositionRequestSchema,
  SetPositionRequestSchema,
  SwitchService,
} from '../../gen/component/switch/v1/switch_pb';
import type { RobotClient } from '../../robot';
import type { JsonObject, Options } from '../../types';
import { doCommandFromClient, getStatusFromClient } from '../../utils';
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
    const request = create(SetPositionRequestSchema, {
      name: this.name,
      position,
      extra,
    });

    this.options.requestLogger?.(request);

    await this.client.setPosition(request, callOptions);
  }

  async getPosition(extra = {}, callOptions = this.callOptions) {
    const request = create(GetPositionRequestSchema, {
      name: this.name,
      extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getPosition(request, callOptions);
    return resp.position;
  }

  async getNumberOfPositions(extra = {}, callOptions = this.callOptions) {
    const request = create(GetNumberOfPositionsRequestSchema, {
      name: this.name,
      extra,
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

  async getStatus(callOptions = this.callOptions): Promise<JsonObject> {
    return getStatusFromClient(
      this.client.getStatus,
      this.name,
      this.options,
      callOptions
    );
  }

  async doCommand(
    command: JsonObject,
    callOptions = this.callOptions
  ): Promise<JsonObject> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions
    );
  }
}
