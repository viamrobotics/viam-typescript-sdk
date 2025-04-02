import type { Resource, Struct, Vector3 } from '../../types';

import * as baseApi from '../../gen/component/base/v1/base_pb';
import type { Geometry } from '../../gen/common/v1/common_pb';

export type BaseProperties = baseApi.GetPropertiesResponse;

export const { GetPropertiesResponse: BaseProperties } = baseApi;

/** Represents a physical base of a robot. */

export interface Base extends Resource {
  /**
   * Get the geometries of the component in their current configuration
   *
   * @example
   *
   * ```ts
   * const base = new VIAM.BaseClient(machine, 'my_base');
   * const geometries = await base.getGeometries();
   * ```
   */
  getGeometries: (extra?: Struct) => Promise<Geometry[]>;

  /**
   * Move a base in a straight line by a given distance at a given speed. This
   * method blocks until completed or cancelled.
   *
   * @example
   *
   * ```ts
   * const base = new VIAM.BaseClient(machine, 'my_base');
   *
   * // Move forward 40mm at 90mm/s
   * await base.moveStraight(40, 90);
   *
   * // Move backward 40mm at -90mm/s (backwards)
   * await base.moveStraight(40, -90);
   * ```
   *
   * @param distanceMm - Distance to move, in millimeters.
   * @param mmPerSec - Movement speed, in millimeters per second.
   */
  moveStraight(
    distanceMm: number,
    mmPerSec: number,
    extra?: Struct
  ): Promise<void>;

  /**
   * Spin a base by a given angle at a given angular speed. This method blocks
   * until completed or cancelled.
   *
   * @example
   *
   * ```ts
   * const base = new VIAM.BaseClient(machine, 'my_base');
   *
   * // Spin 10 degrees clockwise at 15 degrees per second
   * await base.spin(10, 15);
   *
   * // Spin 180 degrees counter-clockwise at 20 degrees per second
   * await base.spin(-180, 20);
   * ```
   *
   * @param angleDeg - Degrees to spin.
   * @param degsPerSec - Angular speed, in degrees per second.
   */
  spin(angleDeg: number, degsPerSec: number, extra?: Struct): Promise<void>;

  /**
   * Set the linear and angular power of a base from -1 to 1 in terms of power
   * for each direction.
   *
   * @example
   *
   * ```ts
   * const base = new VIAM.BaseClient(machine, 'my_base');
   *
   * // Move forward at 75% power
   * await base.setPower(
   *   { x: 0, y: 0.75, z: 0 }, // linear power
   *   { x: 0, y: 0, z: 0 } // no rotation
   * );
   *
   * // Move straight back at 100% power
   * await base.setPower(
   *   { x: 0, y: -1, z: 0 }, // linear power
   *   { x: 0, y: 0, z: 0 } // no rotation
   * );
   *
   * // Turn counter-clockwise at 50% power
   * await base.setPower(
   *   { x: 0, y: 0, z: 0 }, // no linear movement
   *   { x: 0, y: 0, z: 0.5 } // rotate around z-axis
   * );
   *
   * // Turn clockwise at 60% power
   * await base.setPower(
   *   { x: 0, y: 0, z: 0 }, // no linear movement
   *   { x: 0, y: 0, z: -0.6 } // rotate around z-axis
   * );
   * ```
   *
   * @param linear - Desired linear power percentage from -1 to 1.
   * @param angular - Desired angular power percentage from -1 to 1.
   */
  setPower(linear: Vector3, angular: Vector3, extra?: Struct): Promise<void>;

  /**
   * Set the linear and angular velocity of a base.
   *
   * @example
   *
   * ```ts
   * const base = new VIAM.BaseClient(machine, 'my_base');
   *
   * // Move forward at 50mm/s while spinning 15 degrees per second to the left
   * await base.setVelocity(
   *   { x: 0, y: 50, z: 0 }, // linear velocity in mm/s
   *   { x: 0, y: 0, z: 15 } // 15 degrees per second counter-clockwise
   * );
   * ```
   *
   * @param linear - Desired linear velocity in millimeters per second.
   * @param angular - Desired angular velocity in degrees per second.
   */
  setVelocity(linear: Vector3, angular: Vector3, extra?: Struct): Promise<void>;

  /**
   * Stop a base
   *
   * @example
   *
   * ```ts
   * const base = new VIAM.BaseClient(machine, 'my_base');
   * await base.stop();
   * ```
   */
  stop(extra?: Struct): Promise<void>;

  /**
   * Return true if the base is in motion.
   *
   * @example
   *
   * ```ts
   * const base = new VIAM.BaseClient(machine, 'my_base');
   * const moving = await base.isMoving();
   * ```
   */
  isMoving(): Promise<boolean>;

  /**
   * Return the base's properties.
   *
   * @example
   *
   * ```ts
   * const base = new VIAM.BaseClient(machine, 'my_base');
   * const properties = await base.getProperties();
   * ```
   */
  getProperties(extra?: Struct): Promise<BaseProperties>;
}
