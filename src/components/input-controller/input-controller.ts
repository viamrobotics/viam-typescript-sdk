import type { Resource, StructType } from '../../types';
import pb from '../../gen/component/inputcontroller/v1/input_controller_pb';

export type InputControllerEvent = pb.Event.AsObject;

/**
 * Represents a human interface device like a mouse or keyboard that emits
 * events for controls.
 */
export interface InputController extends Resource {
  /** Returns a list of events representing the last event on each control. */
  getEvents(extra?: StructType): Promise<InputControllerEvent[]>;

  /**
   * TriggerEvent, where supported, injects an InputControllerEvent into an
   * input controller to (virtually) generate events like button presses or axis
   * movements
   */
  triggerEvent(event: InputControllerEvent, extra?: StructType): Promise<void>;
}
