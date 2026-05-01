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

  /**
   * Get information about whether the gripper is currently holding onto an
   * object.
   *
   * @example
   *
   * ```ts
   * const gripper = new VIAM.GripperClient(machine, 'my_gripper');
   *
   * // Check if the gripper is holding something
   * const holding = await gripper.isHoldingSomething();
   * console.log('Gripper is holding something:', holding);
   * ```
   *
   * For more information, see [Gripper
   * API](https://docs.viam.com/dev/reference/apis/components/gripper/#isholdingsomething).
   */
  isHoldingSomething: (extra?: Struct) => Promise<boolean>;

  /**
   * Get the current input values of the gripper.
   *
   * @example
   *
   * ```ts
   * const gripper = new VIAM.GripperClient(machine, 'my_gripper');
   *
   * // Get the current input values
   * const inputs = await gripper.getCurrentInputs();
   * console.log('Current inputs:', inputs);
   * ```
   *
   * For more information, see [Gripper
   * API](https://docs.viam.com/dev/reference/apis/components/gripper/#getcurrentinputs).
   */
  getCurrentInputs: (extra?: Struct) => Promise<number[]>;

  /**
   * Move the gripper to the given input values.
   *
   * @example
   *
   * ```ts
   * const gripper = new VIAM.GripperClient(machine, 'my_gripper');
   *
   * // Move the gripper to specified input values
   * await gripper.goToInputs([0.5]);
   * ```
   *
   * For more information, see [Gripper
   * API](https://docs.viam.com/dev/reference/apis/components/gripper/#gotoinputs).
   *
   * @param values - The input values to move the gripper to
   */
  goToInputs: (values: number[], extra?: Struct) => Promise<void>;
}
