// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient, createRouterTransport } from '@connectrpc/connect';

import {
  EventSchema,
  GetEventsResponseSchema,
  InputControllerService,
  type TriggerEventRequest,
  TriggerEventResponseSchema,
} from '../../gen/component/inputcontroller/v1/input_controller_pb';
import { RobotClient } from '../../robot';
import { InputControllerClient } from './client';
import type { InputControllerEvent } from './input-controller';
vi.mock('../../robot');

import { create } from '@bufbuild/protobuf';

const inputControllerClientName = 'test-input-controller';

let inputController: InputControllerClient;

const event: InputControllerEvent = create(EventSchema, {
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
          return create(GetEventsResponseSchema, {
            events: [event],
          });
        },
        triggerEvent: (req) => {
          capturedEvent = req;
          return create(TriggerEventResponseSchema, {});
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() =>
        createClient(InputControllerService, mockTransport)
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
