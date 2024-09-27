// @vitest-environment happy-dom

import {
  createPromiseClient,
  createRouterTransport,
} from '@connectrpc/connect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InputControllerService } from '../../gen/component/inputcontroller/v1/input_controller_connect';
import {
  GetEventsResponse,
  TriggerEventRequest,
  TriggerEventResponse,
} from '../../gen/component/inputcontroller/v1/input_controller_pb';
import { RobotClient } from '../../robot';
import { InputControllerClient } from './client';
import { InputControllerEvent } from './input-controller';
vi.mock('../../robot');
vi.mock('../../gen/service/input_controller/v1/input_controller_pb_service');

const inputControllerClientName = 'test-input-controller';

let inputController: InputControllerClient;

const event = new InputControllerEvent({
  event: 'some-event',
  value: 0.5,
  control: 'some-control',
});

describe('InputControllerClient Tests', () => {
  let capturedEvent: TriggerEventRequest;
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(InputControllerService, {
        getEvents: () => {
          return new GetEventsResponse({
            events: [event],
          });
        },
        triggerEvent: (req) => {
          capturedEvent = req;
          return new TriggerEventResponse();
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() =>
        createPromiseClient(InputControllerService, mockTransport)
      );

    inputController = new InputControllerClient(
      new RobotClient('host'),
      inputControllerClientName
    );
  });

  it('gets events', async () => {
    const expected = [event];

    await expect(inputController.getEvents()).resolves.toStrictEqual(expected);
  });

  it('triggers events', async () => {
    await expect(inputController.triggerEvent(event)).resolves.not.toThrow();
    expect(capturedEvent.event?.event).toStrictEqual(event.event);
    expect(capturedEvent.event?.value).toStrictEqual(event.value);
    expect(capturedEvent.event?.control).toStrictEqual(event.control);
  });
});
