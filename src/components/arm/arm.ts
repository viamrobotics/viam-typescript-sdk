import type { JointPositions } from '../../gen/component/arm/v1/arm_pb';

import type { StructType, Pose } from '../../types';

/** Represents a physical robot arm that exists in three-dimensional space. */
export interface Arm {
  /** Get the position of the end of the arm expressed as a pose */
  getEndPosition: (extra?: StructType) => Promise<Pose>;

  /**
   * Move the end of the arm to the pose.
   *
   * @param pose - The destination pose for the arm.
   */
  moveToPosition: (pose: Pose, extra?: StructType) => Promise<void>;

  /**
   * Move each joint of the arm based on the angles on the joint poisitons.
   * parameter
   *
   * @param jointPositionsList - List of angles (0-360) to move each joint to.
   */
  moveToJointPositions: (
    jointPositionsList: number[],
    extra?: StructType
  ) => Promise<void>;

  /** Gets the current position of each joint. */
  getJointPositions: (extra?: StructType) => Promise<JointPositions>;

  /** Stops the motion of the arm. */
  stop: (extra?: StructType) => Promise<void>;

  /** Get if the arm is currently moving. */
  isMoving: () => Promise<boolean>;

  /**
   * Send arbitrary commands to the resource.
   *
   * @param command - The command to execute.
   */
  doCommand: (command: StructType) => Promise<StructType>;
}
