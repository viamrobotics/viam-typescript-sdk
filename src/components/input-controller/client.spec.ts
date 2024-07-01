// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Event as EventPb,
  TriggerEventRequest,
} from '../../gen/component/inputcontroller/v1/input_controller_pb';
import { InputControllerServiceClient } from '../../gen/component/inputcontroller/v1/input_controller_pb_service';
import { RobotClient } from '../../robot';
import { InputControllerClient } from './client';
import type { InputControllerEvent } from './input-controller';
vi.mock('../../robot');
vi.mock('../../gen/service/input_controller/v1/input_controller_pb_service');

const inputControllerClientName = 'test-input-controller';

let inputController: InputControllerClient;

const event: InputControllerEvent = {
  event: 'some-event',
  value: 0.5,
  time: undefined,
  control: 'some-control',
};
const eventPb = (() => {
  const pb = new EventPb();
  pb.setEvent(event.event);
  pb.setValue(event.value);
  pb.setControl(event.control);
  return pb;
})();

describe('InputControllerClient Tests', () => {
  beforeEach(() => {
    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(
        () => new InputControllerServiceClient(inputControllerClientName)
      );

    InputControllerServiceClient.prototype.getEvents = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {
          getEventsList: () => [eventPb],
        });
      });

    InputControllerServiceClient.prototype.triggerEvent = vi
      .fn()
      .mockImplementation((req: TriggerEventRequest, _md, cb) => {
        expect(req.getEvent()?.getEvent()).toStrictEqual(event.event);
        expect(req.getEvent()?.getValue()).toStrictEqual(event.value);
        expect(req.getEvent()?.getControl()).toStrictEqual(event.control);
        cb(null, {
          triggerEvent: vi.fn(),
        });
      });

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
  });
});
