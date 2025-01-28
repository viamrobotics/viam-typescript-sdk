import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, PromiseClient } from '@connectrpc/connect';
import { ButtonService } from '../../gen/component/button/v1/button_connect';
import { PushRequest } from '../../gen/component/button/v1/button_pb';
import type { RobotClient } from '../../robot';
import type { Options } from '../../types';
import { doCommandFromClient } from '../../utils';
import type { Button } from './button';

/**
 * A gRPC-web client for the Button component.
 *
 * @group Clients
 */
export class ButtonClient implements Button {
  private client: PromiseClient<typeof ButtonService>;
  private readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(ButtonService);
    this.name = name;
    this.options = options;
  }

  async push(extra = {}, callOptions = this.callOptions) {
    const request = new PushRequest({
      name: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.push(request, callOptions);
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
