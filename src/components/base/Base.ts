import type { Extra } from '../../types';
import type { commonApi } from '../../main';

export interface Base {
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
    extra?: Extra
  ): Promise<void>;

  /**
   * Spin a base by a given angle at a given angular speed. This method blocks
   * until completed or cancelled.
   *
   * @param angleDeg - Degrees to spin.
   * @param degsPerSec - Angular speed, in degrees per second.
   */
  spin(angleDeg: number, degsPerSec: number, extra?: Extra): Promise<void>;

  /**
   * Set the linear and angular power of a base from -1 to 1 in terms of power
   * for each direction.
   *
   * @param linear - Desired linear power percentage from -1 to 1.
   * @param angular - Desired angular power percentage from -1 to 1.
   */
  setPower(
    // eslint-disable-next-line no-warning-comments
    // TODO: change args from proto Vector3 to Vector3D
    linear: commonApi.Vector3,
    angular: commonApi.Vector3,
    extra?: Extra
  ): Promise<void>;

  /**
   * Set the linear and angular velocity of a base.
   *
   * @param linear - Desired linear velocity in millimeters per second.
   * @param angular - Desired angular velocity in degrees per second.
   */
  setVelocity(
    // eslint-disable-next-line no-warning-comments
    // TODO: change args from proto Vector3 to Vector3D
    linear: commonApi.Vector3,
    angular: commonApi.Vector3,
    extra?: Extra
  ): Promise<void>;

  /** Stop a base */
  stop(extra?: Extra): Promise<void>;
}
