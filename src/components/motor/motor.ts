import type { Resource, StructType } from '../../types';

export interface Properties {
  /** Whether a motor supports position reporting. */
  positionReporting: boolean;
}

/** Represents a physical motor. */
export interface Motor extends Resource {
  /**
   * Set the percentage of the motor's total power that should be employed.
   *
   * @param power - A value between -1 and 1 where negative values indicate a
   *   backwards direction and positive values a forward direction.
   */
  setPower(power: number, extra?: StructType): Promise<void>;

  /**
   * Turn the motor at a specified speed for either a specified number of
   * revolutions or indefinitely. Raise an error if position reporting is not
   * supported.
   *
   * @param rpm - Speed in revolutions per minute.
   * @param revolutions - Number of revolutions relative to the motor's starting
   *   position. If this value is 0, this will run the motor at the given rpm
   *   indefinitely. If this value is nonzero, this will block until the number
   *   of revolutions has been completed or another operation comes in.
   */
  goFor(rpm: number, revolutions: number, extra?: StructType): Promise<void>;

  /**
   * Move the motor to a specific position relative to its home position at a
   * specified speed. Raise an error if position reporting is not supported.
   *
   * @param rpm - Speed in revolutions per minute.
   * @param positionRevolutions - Number of revolutions relative to the motor's
   *   home position.
   */
  goTo(
    rpm: number,
    positionRevolutions: number,
    extra?: StructType
  ): Promise<void>;

  /**
   * Set the current position of the motor as the new zero position, offset by a
   * given position. Raise an error if position reporting is not supported.
   *
   * @param offset - Position from which to offset the current position.
   */
  resetZeroPosition(offset: number, extra?: StructType): Promise<void>;

  /** Turn the motor off. */
  stop(extra?: StructType): Promise<void>;

  /** Return the motor's properties. */
  getProperties(extra?: StructType): Promise<Properties>;

  /**
   * Return the position of the motor relative to its zero position. Raise an
   * error if position reporting is not supported.
   */
  getPosition(extra?: StructType): Promise<number>;

  /** Return true if the motor is on. */
  isPowered(extra?: StructType): Promise<readonly [boolean, number]>;

  /** Return true if the motor is in motion. */
  isMoving(): Promise<boolean>;
}
