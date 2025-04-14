import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';

export interface Properties {
  /** Whether a motor supports position reporting. */
  positionReporting: boolean;
}

/** Represents a physical motor. */
export interface Motor extends Resource {
  /**
   * Set the percentage of the motor's total power that should be employed.
   *
   * @example
   *
   * ```ts
   * const motor = new VIAM.MotorClient(machine, 'my_motor');
   *
   * // Set the power to 40% forwards
   * await motor.setPower(0.4);
   * ```
   *
   * @param power - A value between -1 and 1 where negative values indicate a
   *   backwards direction and positive values a forward direction.
   *
   * For more information, see [Motor API](https://docs.viam.com/dev/reference/apis/components/motor/#setpower).
   */
  setPower(power: number, extra?: Struct): Promise<void>;

  /**
   * Turn the motor at a specified speed for either a specified number of
   * revolutions or indefinitely. Raise an error if position reporting is not
   * supported.
   *
   * @example
   *
   * ```ts
   * const motor = new VIAM.MotorClient(machine, 'my_motor');
   *
   * // Turn the motor 7.2 revolutions at 60 RPM
   * await motor.goFor(60, 7.2);
   * ```
   *
   * @param rpm - Speed in revolutions per minute.
   * @param revolutions - Number of revolutions relative to the motor's starting
   *   position. If this value is 0, this will run the motor at the given rpm
   *   indefinitely. If this value is nonzero, this will block until the number
   *   of revolutions has been completed or another operation comes in.
   *
   * For more information, see [Motor API](https://docs.viam.com/dev/reference/apis/components/motor/#gofor).
   */
  goFor(rpm: number, revolutions: number, extra?: Struct): Promise<void>;

  /**
   * Move the motor to a specific position relative to its home position at a
   * specified speed. Raise an error if position reporting is not supported.
   *
   * @example
   *
   * ```ts
   * const motor = new VIAM.MotorClient(machine, 'my_motor');
   *
   * // Turn the motor to 8.3 revolutions from home at 75 RPM
   * await motor.goTo(75, 8.3);
   * ```
   *
   * @param rpm - Speed in revolutions per minute.
   * @param positionRevolutions - Number of revolutions relative to the motor's
   *   home position.
   *
   * For more information, see [Motor API](https://docs.viam.com/dev/reference/apis/components/motor/#goto).
   */
  goTo(rpm: number, positionRevolutions: number, extra?: Struct): Promise<void>;

  /**
   * Move the motor indefinitely at a specified speed. Raise an error if
   * position reporting is not supported.
   *
   * @example
   *
   * ```ts
   * const motor = new VIAM.MotorClient(machine, 'my_motor');
   *
   * // Spin the motor at 75 RPM
   * await motor.setRPM(75);
   * ```
   *
   * @param rpm - Speed in revolutions per minute.
   *
   * For more information, see [Motor API](https://docs.viam.com/dev/reference/apis/components/motor/#setrpm).
   */
  setRPM(rpm: number, extra?: Struct): Promise<void>;

  /**
   * Set the current position of the motor as the new zero position, offset by a
   * given position. Raise an error if position reporting is not supported.
   *
   * @example
   *
   * ```ts
   * const motor = new VIAM.MotorClient(machine, 'my_motor');
   *
   * // Set the current position as the new home position with no offset
   * await motor.resetZeroPosition(0.0);
   * ```
   *
   * @param offset - Position from which to offset the current position.
   *
   * For more information, see [Motor API](https://docs.viam.com/dev/reference/apis/components/motor/#resetzeroposition).
   */
  resetZeroPosition(offset: number, extra?: Struct): Promise<void>;

  /**
   * Turn the motor off.
   *
   * @example
   *
   * ```ts
   * const motor = new VIAM.MotorClient(machine, 'my_motor');
   *
   * // Stop the motor
   * await motor.stop();
   * ```
   *
   * For more information, see [Motor API](https://docs.viam.com/dev/reference/apis/components/motor/#stop).
   */
  stop(extra?: Struct): Promise<void>;

  /**
   * Return the motor's properties.
   *
   * @example
   *
   * ```ts
   * const motor = new VIAM.MotorClient(machine, 'my_motor');
   *
   * // Report a dictionary mapping optional properties to whether it is supported by
   * // this motor
   * const properties = await motor.getProperties();
   * console.log('Properties:', properties);
   * ```
   *
   * For more information, see [Motor API](https://docs.viam.com/dev/reference/apis/components/motor/#getproperties).
   */
  getProperties(extra?: Struct): Promise<Properties>;

  /**
   * Return the position of the motor relative to its zero position. Raise an
   * error if position reporting is not supported.
   *
   * @example
   *
   * ```ts
   * const motor = new VIAM.MotorClient(machine, 'my_motor');
   *
   * // Get the current position of the motor
   * const position = await motor.getPosition();
   * console.log('Position:', position);
   * ```
   *
   * For more information, see [Motor API](https://docs.viam.com/dev/reference/apis/components/motor/#getposition).
   */
  getPosition(extra?: Struct): Promise<number>;

  /**
   * Return true if the motor is on.
   *
   * @example
   *
   * ```ts
   * const motor = new VIAM.MotorClient(machine, 'my_motor');
   *
   * // Check whether the motor is currently running
   * const [isPowered, powerPct] = await motor.isPowered();
   * console.log('Powered:', isPowered);
   * console.log('Power percentage:', powerPct);
   * ```
   *
   * For more information, see [Motor API](https://docs.viam.com/dev/reference/apis/components/motor/#ispowered).
   */
  isPowered(extra?: Struct): Promise<readonly [boolean, number]>;

  /**
   * Return true if the motor is in motion.
   *
   * @example
   *
   * ```ts
   * const motor = new VIAM.MotorClient(machine, 'my_motor');
   *
   * // Check whether the motor is currently moving
   * const moving = await motor.isMoving();
   * console.log('Moving:', moving);
   * ```
   *
   * For more information, see [Motor API](https://docs.viam.com/dev/reference/apis/components/motor/#ismoving).
   */
  isMoving(): Promise<boolean>;
}
