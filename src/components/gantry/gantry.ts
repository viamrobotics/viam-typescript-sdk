import type { Geometry } from '../../gen/common/v1/common_pb';
import type { JsonObject, Resource } from '../../types';
import type { GetKinematicsResult } from '../../utils';

/** Represents a physical gantry that exists in three-dimensional space. */
export interface Gantry extends Resource {
  /**
   * Get the geometries of the component in their current configuration.
   *
   * @example
   *
   * ```ts
   * const gantry = new VIAM.GantryClient(machine, 'my_gantry');
   *
   * // Get the geometries of this component
   * const geometries = await gantry.getGeometries();
   * ```
   *
   * For more information, see [Gantry
   * API](https://docs.viam.com/dev/reference/apis/components/gantry/#getgeometries).
   */
  getGeometries: (extra?: JsonObject) => Promise<Geometry[]>;

  /**
   * Get the kinematics information associated with the gantry.
   *
   * @example
   *
   * ```ts
   * const gantry = new VIAM.GantryClient(machine, 'my_gantry');
   *
   * // Get the kinematics information associated with the gantry
   * const kinematics = await gantry.getKinematics();
   * ```
   *
   * For more information, see [Gantry
   * API](https://docs.viam.com/dev/reference/apis/components/gantry/#getkinematics).
   *
   * @returns The legacy kinematics data shape or the newer object containing
   *   kinematics data plus a map of URDF mesh file paths to mesh data.
   */
  getKinematics: (extra?: JsonObject) => Promise<GetKinematicsResult>;

  /**
   * Move each axis of the gantry to the positionsMm at the speeds in
   * speedsMmPerSec.
   *
   * @example
   *
   * ```ts
   * const gantry = new VIAM.GantryClient(machine, 'my_gantry');
   *
   * // Create positions for a 3-axis gantry
   * const positions = [1, 2, 3];
   * const speeds = [3, 9, 12];
   *
   * // Move the axes to the specified positions
   * await gantry.moveToPosition(positions, speeds);
   * ```
   *
   * For more information, see [Gantry
   * API](https://docs.viam.com/dev/reference/apis/components/gantry/#movetoposition).
   *
   * @param positionsMm - The goal positions for each axis of the gantry.
   * @param speedsMmPerSec - The desired speed for each axis to move to the
   *   respective position in positionsMm.
   */
  moveToPosition: (
    positionsMm: number[],
    speedsMmPerSec: number[],
    extra?: JsonObject
  ) => Promise<void>;

  /**
   * Get the current position of each axis.
   *
   * @example
   *
   * ```ts
   * const gantry = new VIAM.GantryClient(machine, 'my_gantry');
   *
   * // Get the current positions of the axes in millimeters
   * const positions = await gantry.getPosition();
   * ```
   *
   * For more information, see [Gantry
   * API](https://docs.viam.com/dev/reference/apis/components/gantry/#getposition).
   *
   * @returns A list of the current position of each axis in millimeters.
   */
  getPosition: (extra?: JsonObject) => Promise<number[]>;

  /**
   * Runs the homing sequence to find the start and end positions of the gantry
   * axis.
   *
   * @example
   *
   * ```ts
   * const gantry = new VIAM.GantryClient(machine, 'my_gantry');
   *
   * // Run the homing sequence
   * const success = await gantry.home();
   * ```
   *
   * For more information, see [Gantry
   * API](https://docs.viam.com/dev/reference/apis/components/gantry/#home).
   *
   * @returns A bool representing whether the gantry has run the homing sequence
   *   successfully.
   */
  home: (extra?: JsonObject) => Promise<boolean>;

  /**
   * Get the lengths of the axes of the gantry in millimeters.
   *
   * @example
   *
   * ```ts
   * const gantry = new VIAM.GantryClient(machine, 'my_gantry');
   *
   * // Get the lengths of the axes in millimeters
   * const lengths = await gantry.getLengths();
   * ```
   *
   * For more information, see [Gantry
   * API](https://docs.viam.com/dev/reference/apis/components/gantry/#getlengths).
   *
   * @returns A list of the length of each axis in millimeters.
   */
  getLengths: (extra?: JsonObject) => Promise<number[]>;

  /**
   * Stop the motion of the gantry.
   *
   * @example
   *
   * ```ts
   * const gantry = new VIAM.GantryClient(machine, 'my_gantry');
   *
   * // Stop all motion of the gantry
   * await gantry.stop();
   * ```
   *
   * For more information, see [Gantry
   * API](https://docs.viam.com/dev/reference/apis/components/gantry/#stop).
   */
  stop: (extra?: JsonObject) => Promise<void>;

  /**
   * Get if the gantry is currently moving.
   *
   * @example
   *
   * ```ts
   * const gantry = new VIAM.GantryClient(machine, 'my_gantry');
   *
   * // Check if the gantry is moving
   * const moving = await gantry.isMoving();
   * console.log('Moving:', moving);
   * ```
   *
   * For more information, see [Gantry
   * API](https://docs.viam.com/dev/reference/apis/components/gantry/#ismoving).
   */
  isMoving: () => Promise<boolean>;
}
