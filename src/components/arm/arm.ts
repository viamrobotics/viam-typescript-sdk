import type { PlainMessage, Struct } from '@bufbuild/protobuf';
import type { Pose, Resource } from '../../types';

import * as armApi from '../../gen/component/arm/v1/arm_pb';
import type { Geometry } from '../../gen/common/v1/common_pb';

export type ArmJointPositions = PlainMessage<armApi.JointPositions>;

export const { JointPositions: ArmJointPositions } = armApi;

/** Represents a physical robot arm that exists in three-dimensional space. */
export interface Arm extends Resource {
  /** Get the position of the end of the arm expressed as a pose
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   * const pose = await arm.getEndPosition();
   * ```
   */
  getEndPosition: (extra?: Struct) => Promise<Pose>;

  /** Get the geometries of the component in their current configuration
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   * const geometries = await arm.getGeometries();
   * console.log(geometries);
   * ```
   */
  getGeometries: (extra?: Struct) => Promise<Geometry[]>;

  /**
   * Move the end of the arm to the pose.
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   *
   * // Create a pose for the arm to move to
   * const pose: Pose = { x: -500, y: -200, z: 62, oX: 1, oY: 0, oZ: 1, theta: 90 };
   *
   * // Move the arm to the pose
   * await arm.moveToPosition(pose);
   * ```
   *
   * @param pose - The destination pose for the arm.
   */
  moveToPosition: (pose: Pose, extra?: Struct) => Promise<void>;

  /**
   * Move each joint of the arm based on the angles on the joint positions.
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   *
   * // Move an arm with 6 joints (6 DoF)
   * await arm.moveToJointPositions([90, 0, 0, 0, 15, 0]);
   * ```
   *
   * @param jointPositionsList - List of angles (0-360) to move each joint to.
   */
  moveToJointPositions: (
    jointPositionsList: number[],
    extra?: Struct
  ) => Promise<void>;

  /** Gets the current position of each joint.
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   * const jointPositions = await arm.getJointPositions();
   * ```
   */
  getJointPositions: (extra?: Struct) => Promise<ArmJointPositions>;

  /** Stop the motion of the arm.
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   * await arm.stop();
   * ```
   */
  stop: (extra?: Struct) => Promise<void>;

  /** Get if the arm is currently moving.
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   * const isMoving = await arm.isMoving();
   * console.log(isMoving);
   * ```
   */
  isMoving: () => Promise<boolean>;
}
