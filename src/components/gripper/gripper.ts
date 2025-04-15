import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';
import type { Geometry } from '../../gen/common/v1/common_pb';

/** Represents a physical robotic gripper. */
export interface Gripper extends Resource {
  /**
   * Get the geometries of the component in their current configuration.
   *
   * @example
   *
   * ```ts
   * const gripper = new VIAM.GripperClient(machine, 'my_gripper');
   *
   * // Get the geometries of this component
   * const geometries = await gripper.getGeometries();
   * console.log('Geometries:', geometries);
   * ```
   *
   * For more information, see [Gripper
   * API](https://docs.viam.com/dev/reference/apis/components/gripper/#getgeometries).
   */
  getGeometries: (extra?: Struct) => Promise<Geometry[]>;

  /**
   * Open a gripper of the underlying robot.
   *
   * @example
   *
   * ```ts
   * const gripper = new VIAM.GripperClient(machine, 'my_gripper');
   *
   * // Open the gripper
   * await gripper.open();
   * ```
   *
   * For more information, see [Gripper
   * API](https://docs.viam.com/dev/reference/apis/components/gripper/#open).
   */
  open: (extra?: Struct) => Promise<void>;

  /**
   * Request a gripper of the underlying robot to grab.
   *
   * @example
   *
   * ```ts
   * const gripper = new VIAM.GripperClient(machine, 'my_gripper');
   *
   * // Close the gripper to grab
   * await gripper.grab();
   * ```
   *
   * For more information, see [Gripper
   * API](https://docs.viam.com/dev/reference/apis/components/gripper/#grab).
   */
  grab: (extra?: Struct) => Promise<void>;

  /**
   * Stop a robot's gripper.
   *
   * @example
   *
   * ```ts
   * const gripper = new VIAM.GripperClient(machine, 'my_gripper');
   *
   * // Stop the gripper's current motion
   * await gripper.stop();
   * ```
   *
   * For more information, see [Gripper
   * API](https://docs.viam.com/dev/reference/apis/components/gripper/#stop).
   */
  stop: (extra?: Struct) => Promise<void>;

  /**
   * Report if the gripper is in motion.
   *
   * @example
   *
   * ```ts
   * const gripper = new VIAM.GripperClient(machine, 'my_gripper');
   *
   * // Check if the gripper is currently moving
   * const moving = await gripper.isMoving();
   * console.log('Gripper is moving:', moving);
   * ```
   *
   * For more information, see [Gripper
   * API](https://docs.viam.com/dev/reference/apis/components/gripper/#ismoving).
   */
  isMoving: () => Promise<boolean>;
}
