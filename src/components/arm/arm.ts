import type { PlainMessage, Struct } from '@bufbuild/protobuf';
import type { Pose, Resource } from '../../types';

import * as armApi from '../../gen/component/arm/v1/arm_pb';
import type { Geometry, Mesh } from '../../gen/common/v1/common_pb';
import type { GetKinematicsResult } from '../../utils';

export type ArmJointPositions = PlainMessage<armApi.JointPositions>;

export const { JointPositions: ArmJointPositions } = armApi;

/** Represents a physical robot arm that exists in three-dimensional space. */
export interface Arm extends Resource {
  /**
   * Get the position of the end of the arm expressed as a pose
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   * const pose = await arm.getEndPosition();
   * ```
   *
   * For more information, see [Arm
   * API](https://docs.viam.com/dev/reference/apis/components/arm/#getendposition).
   */
  getEndPosition: (extra?: Struct) => Promise<Pose>;

  /**
   * Get the geometries of the component in their current configuration
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   * const geometries = await arm.getGeometries();
   * console.log(geometries);
   * ```
   *
   * For more information, see [Arm
   * API](https://docs.viam.com/dev/reference/apis/components/arm/#getgeometries).
   */
  getGeometries: (extra?: Struct) => Promise<Geometry[]>;

  /**
   * Get the 3D models of the component
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   * const models = await arm.get3DModels();
   * console.log(models);
   * ```
   */
  get3DModels: (extra?: Struct) => Promise<Record<string, Mesh>>;

  /**
   * Get the kinematics information associated with the arm.
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   * const kinematics = await arm.getKinematics();
   * console.log(kinematics);
   *
   * For more information, see [Arm
   * API](https://docs.viam.com/dev/reference/apis/components/arm/#getkinematics).
   * ```
   *
   * @returns The kinematics data and a map of URDF mesh file paths to mesh data.
   */
  getKinematics: (extra?: Struct) => Promise<GetKinematicsResult>;

  /**
   * Move the end of the arm to the pose.
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   *
   * // Create a pose for the arm to move to
   * const pose: Pose = {
   *   x: -500,
   *   y: -200,
   *   z: 62,
   *   oX: 1,
   *   oY: 0,
   *   oZ: 1,
   *   theta: 90,
   * };
   *
   * // Move the arm to the pose
   * await arm.moveToPosition(pose);
   * ```
   *
   * For more information, see [Arm
   * API](https://docs.viam.com/dev/reference/apis/components/arm/#movetoposition).
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
   * For more information, see [Arm
   * API](https://docs.viam.com/dev/reference/apis/components/arm/#movetojointpositions).
   *
   * @param jointPositionsList - List of angles (0-360) to move each joint to.
   */
  moveToJointPositions: (
    jointPositionsList: number[],
    extra?: Struct
  ) => Promise<void>;

  /**
   * Gets the current position of each joint.
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   * const jointPositions = await arm.getJointPositions();
   * ```
   *
   * For more information, see [Arm
   * API](https://docs.viam.com/dev/reference/apis/components/arm/#getjointpositions).
   */
  getJointPositions: (extra?: Struct) => Promise<ArmJointPositions>;

  /**
   * Stop the motion of the arm.
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   * await arm.stop();
   * ```
   *
   * For more information, see [Arm
   * API](https://docs.viam.com/dev/reference/apis/components/arm/#stop).
   */
  stop: (extra?: Struct) => Promise<void>;

  /**
   * Get if the arm is currently moving.
   *
   * @example
   *
   * ```ts
   * const arm = new VIAM.ArmClient(machine, 'my_arm');
   * const isMoving = await arm.isMoving();
   * console.log(isMoving);
   * ```
   *
   * For more information, see [Arm
   * API](https://docs.viam.com/dev/reference/apis/components/arm/#ismoving).
   */
  isMoving: () => Promise<boolean>;
}
