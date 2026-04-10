import { create } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';

import {
  ButtonService,
  PushRequestSchema,
} from '../../gen/component/button/v1/button_pb';
import type { RobotClient } from '../../robot';
import type { JsonObject, Options } from '../../types';
import { doCommandFromClient, getStatusFromClient } from '../../utils';
import type { Button } from './button';

/**
 * A gRPC-web client for the Button component.
 *
 * @group Clients
 */
export class ButtonClient implements Button {
  private client: Client<typeof ButtonService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(ButtonService);
    this.name = name;
    this.options = options;
  }

  async push(extra = {}, callOptions = this.callOptions) {
    const request = create(PushRequestSchema, {
      name: this.name,
      extra,
    });

    this.options.requestLogger?.(request);

    await this.client.push(request, callOptions);
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
