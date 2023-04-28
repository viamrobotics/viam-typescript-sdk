import type { Resource, StructType, Vector3 } from '../../types';

/** Represents a physical base of a robot. */
export interface Base extends Resource {
  /**
   * Move a base in a straight line by a given distance at a given speed. This
   * method blocks until completed or cancelled.
   *
   * @param distanceMm - Distance to move, in millimeters.
   * @param mmPerSec - Movement speed, in millimeters per second.
   */
  moveStraight(
    distanceMm: number,
    mmPerSec: number,
    extra?: StructType
  ): Promise<void>;

  /**
   * Spin a base by a given angle at a given angular speed. This method blocks
   * until completed or cancelled.
   *
   * @param angleDeg - Degrees to spin.
   * @param degsPerSec - Angular speed, in degrees per second.
   */
  spin(angleDeg: number, degsPerSec: number, extra?: StructType): Promise<void>;

  /**
   * Set the linear and angular power of a base from -1 to 1 in terms of power
   * for each direction.
   *
   * @param linear - Desired linear power percentage from -1 to 1.
   * @param angular - Desired angular power percentage from -1 to 1.
   */
  setPower(
    linear: Vector3,
    angular: Vector3,
    extra?: StructType
  ): Promise<void>;

  /**
   * Set the linear and angular velocity of a base.
   *
   * @param linear - Desired linear velocity in millimeters per second.
   * @param angular - Desired angular velocity in degrees per second.
   */
  setVelocity(
    linear: Vector3,
    angular: Vector3,
    extra?: StructType
  ): Promise<void>;

  /** Stop a base */
  stop(extra?: StructType): Promise<void>;

  /** Return true if the base is in motion. */
  isMoving(extra?: StructType): Promise<boolean>;
}
