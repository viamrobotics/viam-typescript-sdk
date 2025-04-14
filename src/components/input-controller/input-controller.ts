import type { PlainMessage, Struct } from '@bufbuild/protobuf';
import * as pb from '../../gen/component/inputcontroller/v1/input_controller_pb';
import type { Resource } from '../../types';

export type InputControllerEvent = PlainMessage<pb.Event>;
export const { Event: InputControllerEvent } = pb;

/**
 * Represents a human interface device like a mouse or keyboard that emits
 * events for controls.
 */
export interface InputController extends Resource {
  /**
   * Returns a list of events representing the last event on each control.
   *
   * @example
   *
   * ```ts
   * const controller = new VIAM.InputControllerClient(
   *   machine,
   *   'my_controller'
   * );
   *
   * // Get the most recent Event for each Control
   * const recentEvents = await controller.getEvents();
   * console.log('Recent events:', recentEvents);
   * ```
   *
   * For more information, see [InputController API](https://docs.viam.com/dev/reference/apis/components/inputcontroller/#getevents).
   */
  getEvents(extra?: Struct): Promise<InputControllerEvent[]>;

  /**
   * TriggerEvent, where supported, injects an InputControllerEvent into an
   * input controller to (virtually) generate events like button presses or axis
   * movements.
   *
   * @example
   *
   * ```ts
   * const controller = new VIAM.InputControllerClient(
   *   machine,
   *   'my_controller'
   * );
   *
   * // Create a "Button is Pressed" event for the control BUTTON_START
   * const buttonPressEvent = new VIAM.InputControllerEvent({
   *   time: { seconds: BigInt(Math.floor(Date.now() / 1000)) },
   *   event: 'ButtonPress',
   *   control: 'ButtonStart',
   *   value: 1.0,
   * });
   * // Trigger the event
   * await controller.triggerEvent(buttonPressEvent);
   * ```
   *
   * For more information, see [InputController API](https://docs.viam.com/dev/reference/apis/components/inputcontroller/#triggerevent).
   */
  triggerEvent(event: InputControllerEvent, extra?: Struct): Promise<void>;
}
