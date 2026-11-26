import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';
import type { Geometry, KinematicModel } from '../../gen/common/v1/common_pb';
import type { GetKinematicsOptions } from '../../utils';

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
   * API](https://docs.viam.com/reference/apis/components/gripper/#getgeometries).
   */
  getGeometries: (extra?: Struct) => Promise<Geometry[]>;

  /**
   * Get the typed kinematic model of the gripper. Link translations are in mm, revolute limits in
   * degrees and prismatic limits in mm, and joint limits carry velocity and acceleration.
   *
   * @example
   *
   * ```ts
   * const gripper = new VIAM.GripperClient(machine, 'my_gripper');
   *
   * const model = await gripper.getKinematicModel();
   * console.log(model.joints.map((joint) => joint.limits));
   *
   * // Ask for the mesh bytes as well, which are left out by default
   * const withMeshes = await gripper.getKinematicModel({
   *   includeVisualMeshes: true,
   * });
   * ```
   *
   * For more information, see [Gripper
   * API](https://docs.viam.com/reference/apis/components/gripper/#getkinematics).
   *
   * @param options - Set includeCollisionMeshes or includeVisualMeshes to get those mesh bytes.
   *   Without them a mesh carries its path only.
   * @throws When the server sends no typed model, or one with no links and no joints, which is what
   *   a server or module that predates it sends.
   */
  getKinematicModel: (options?: GetKinematicsOptions, extra?: Struct) => Promise<KinematicModel>;

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
   * API](https://docs.viam.com/reference/apis/components/gripper/#open).
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
   * API](https://docs.viam.com/reference/apis/components/gripper/#grab).
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
   * API](https://docs.viam.com/reference/apis/components/gripper/#stop).
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
   * API](https://docs.viam.com/reference/apis/components/gripper/#ismoving).
   */
  isMoving: () => Promise<boolean>;

  /**
   * Get information about whether the gripper is currently holding onto an object.
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
   * API](https://docs.viam.com/reference/apis/components/gripper/#isholdingsomething).
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
   * // Get the current inputs of the gripper
   * const inputs = await gripper.getCurrentInputs();
   * console.log('Current inputs:', inputs);
   * ```
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
   * // Move the gripper to specific input values
   * await gripper.goToInputs([0.5]);
   * ```
   *
   * @param values - The input values to move the gripper to.
   */
  goToInputs: (values: number[], extra?: Struct) => Promise<void>;
}
