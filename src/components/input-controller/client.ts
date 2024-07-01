import { Struct } from 'google-protobuf/google/protobuf/struct_pb';

import type { RobotClient } from '../../robot';
import type { Options, StructType } from '../../types';
import { InputControllerServiceClient } from '../../gen/component/inputcontroller/v1/input_controller_pb_service';

import { promisify, doCommandFromClient } from '../../utils';
import {
  GetEventsRequest,
  GetEventsResponse,
  TriggerEventRequest,
  TriggerEventResponse,
  Event,
} from '../../gen/component/inputcontroller/v1/input_controller_pb';
import type { InputController, InputControllerEvent } from './input-controller';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

/**
 * A gRPC-web client for the Input Controller component.
 *
 * @group Clients
 */
export class InputControllerClient implements InputController {
  private client: InputControllerServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(InputControllerServiceClient);
    this.name = name;
    this.options = options;
  }

  private get inputControllerService() {
    return this.client;
  }

  async getEvents(extra = {}) {
    const { inputControllerService } = this;
    const request = new GetEventsRequest();
    request.setController(this.name);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<GetEventsRequest, GetEventsResponse>(
      inputControllerService.getEvents.bind(inputControllerService),
      request
    );

    return response.getEventsList().map((event) => event.toObject());
  }

  async triggerEvent(
    { event, time, control, value }: InputControllerEvent,
    extra = {}
  ): Promise<void> {
    const { inputControllerService } = this;
    const request = new TriggerEventRequest();
    request.setController(this.name);

    const eventPb = new Event();
    eventPb.setEvent(event);
    eventPb.setControl(control);
    eventPb.setValue(value);
    if (time) {
      const timePb = new Timestamp();
      timePb.setSeconds(time.seconds);
      timePb.setNanos(time.nanos);
      eventPb.setTime(timePb);
    }

    request.setEvent(eventPb);
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    await promisify<TriggerEventRequest, TriggerEventResponse>(
      inputControllerService.triggerEvent.bind(inputControllerService),
      request
    );
  }

  async doCommand(command: StructType): Promise<StructType> {
    const { inputControllerService } = this;
    return doCommandFromClient(
      inputControllerService,
      this.name,
      command,
      this.options
    );
  }
}
