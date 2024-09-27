import type { PartialMessage, Struct } from '@bufbuild/protobuf';
import * as pb from '../../gen/component/inputcontroller/v1/input_controller_pb';
import type { Resource } from '../../types';

export type InputControllerEvent = PartialMessage<pb.Event>;
export const { Event: InputControllerEvent } = pb;

/**
 * Represents a human interface device like a mouse or keyboard that emits
 * events for controls.
 */
export interface InputController extends Resource {
  /** Returns a list of events representing the last event on each control. */
  getEvents(extra?: Struct): Promise<InputControllerEvent[]>;

  /**
   * TriggerEvent, where supported, injects an InputControllerEvent into an
   * input controller to (virtually) generate events like button presses or axis
   * movements
   */
  triggerEvent(event: InputControllerEvent, extra?: Struct): Promise<void>;
}
