import type { RobotClient } from '../../robot';
import type { Options } from '../../types';

import { Struct, type JsonValue } from '@bufbuild/protobuf';
import type { CallOptions, PromiseClient } from '@connectrpc/connect';
import { InputControllerService } from '../../gen/component/inputcontroller/v1/input_controller_connect';
import {
  GetEventsRequest,
  TriggerEventRequest,
} from '../../gen/component/inputcontroller/v1/input_controller_pb';
import { doCommandFromClient } from '../../utils';
import type { InputController, InputControllerEvent } from './input-controller';

/**
 * A gRPC-web client for the Input Controller component.
 *
 * @group Clients
 */
export class InputControllerClient implements InputController {
  private client: PromiseClient<typeof InputControllerService>;
  private readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(InputControllerService);
    this.name = name;
    this.options = options;
  }

  async getEvents(extra = {}, callOptions = this.callOptions) {
    const request = new GetEventsRequest({
      controller: this.name,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getEvents(request, callOptions);
    return resp.events;
  }

  async triggerEvent(
    event: InputControllerEvent,
    extra = {},
    callOptions = this.callOptions
  ): Promise<void> {
    const request = new TriggerEventRequest({
      controller: this.name,
      event,
      extra: Struct.fromJson(extra),
    });

    this.options.requestLogger?.(request);

    await this.client.triggerEvent(request, callOptions);
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
