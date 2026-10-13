import type { RobotClient } from '../../robot';
import type { Options } from '../../types';

import { type JsonObject, type JsonValue, create } from '@bufbuild/protobuf';
import type { CallOptions, Client } from '@connectrpc/connect';
import {
  InputControllerService,
  GetEventsRequestSchema,
  TriggerEventRequestSchema,
} from '../../gen/component/inputcontroller/v1/input_controller_pb';

import { doCommandFromClient, getGeometriesFromClient, getStatusFromClient } from '../../utils';
import type { InputController, InputControllerEvent } from './input-controller';

/**
 * A gRPC-web client for the Input Controller component.
 *
 * @group Clients
 */
export class InputControllerClient implements InputController {
  private client: Client<typeof InputControllerService>;
  public readonly name: string;
  private readonly options: Options;
  public callOptions: CallOptions = { headers: {} };

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(InputControllerService);
    this.name = name;
    this.options = options;
  }

  async getGeometries(extra = {}, callOptions = this.callOptions) {
    return getGeometriesFromClient(this.client.getGeometries, this.name, extra, callOptions);
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

  async getStatus(callOptions = this.callOptions): Promise<JsonValue> {
    return getStatusFromClient(this.client.getStatus, this.name, this.options, callOptions);
  }

  async doCommand(
    command: JsonObject | Record<string, JsonValue>,
    callOptions = this.callOptions,
  ): Promise<JsonValue> {
    return doCommandFromClient(
      this.client.doCommand,
      this.name,
      command,
      this.options,
      callOptions,
    );
  }
}
