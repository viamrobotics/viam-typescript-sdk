import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';

/** Represents a physical switch with multiple positions. */
export interface Switch extends Resource {
  /**
   * Set the switch to a specific position.
   *
   * @example
   *
   * ```ts
   * const mySwitch = new VIAM.SwitchClient(machine, 'my_switch');
   *
   * // Update the switch from its current position to position 1
   * await mySwitch.setPosition(1);
   *
   * // Update the switch from its current position to position 0
   * await mySwitch.setPosition(0);
   * ```
   */
  setPosition: (position: number, extra?: Struct) => Promise<void>;

  /**
   * Get the current position of the switch.
   *
   * @example
   *
   * ```ts
   * const mySwitch = new VIAM.SwitchClient(machine, 'my_switch');
   *
   * // Update the switch to position 1
   * await mySwitch.setPosition(1);
   *
   * // Get the current set position
   * const pos1 = await mySwitch.getPosition();
   *
   * // Update the switch to position 0
   * await mySwitch.setPosition(0);
   *
   * // Get the current set position
   * const pos2 = await mySwitch.getPosition();
   * ```
   */
  getPosition: (extra?: Struct) => Promise<number>;

  /**
   * Get the total number of positions available on the switch.
   *
   * @example
   *
   * ```ts
   * const mySwitch = new VIAM.SwitchClient(machine, 'my_switch');
   *
   * // Get the number of available positions
   * const numPositions = await mySwitch.getNumberOfPositions();
   * console.log('Number of positions:', numPositions);
   * ```
   */
  getNumberOfPositions: (extra?: Struct) => Promise<number>;
}
