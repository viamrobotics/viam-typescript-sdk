import type { RobotClient } from "../../robot";
import type { JsonObject, Options } from "../../types";

import { create } from "@bufbuild/protobuf";
import type { CallOptions, Client } from "@connectrpc/connect";
import {
  GetEventsRequestSchema,
  InputControllerService,
  TriggerEventRequestSchema,
} from "../../gen/component/inputcontroller/v1/input_controller_pb";
import { doCommandFromClient, getStatusFromClient } from "../../utils";
import type { InputController, InputControllerEvent } from "./input-controller";

/**
 * A gRPC-web client for the Input Controller component.
 *
 * @group Clients
 */
export class InputControllerClient implements InputController {
  private client: Client<typeof InputControllerService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} as Record<string, string> };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(InputControllerService);
    this.name = name;
    this.options = options;
  }

  async getEvents(extra = {}, callOptions = this.callOptions) {
    const request = create(GetEventsRequestSchema, {
      controller: this.name,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    const resp = await this.client.getEvents(request, callOptions);
    return resp.events;
  }

  async triggerEvent(
    event: InputControllerEvent,
    extra = {},
    callOptions = this.callOptions,
  ): Promise<void> {
    const request = create(TriggerEventRequestSchema, {
      controller: this.name,
      event,
      extra: extra,
    });

    this.options.requestLogger?.(request);

    await this.client.triggerEvent(request, callOptions);
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
