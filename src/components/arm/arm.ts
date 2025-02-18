import type { PlainMessage, Struct } from '@bufbuild/protobuf';
import type { Pose, Resource } from '../../types';

import * as armApi from '../../gen/component/arm/v1/arm_pb';
import type { Geometry } from '../../gen/common/v1/common_pb';

export type ArmJointPositions = PlainMessage<armApi.JointPositions>;

export const { JointPositions: ArmJointPositions } = armApi;

/** Represents a physical robot arm that exists in three-dimensional space. */
export interface Arm extends Resource {
  /** Get the position of the end of the arm expressed as a pose */
  getEndPosition: (extra?: Struct) => Promise<Pose>;

  /** Get the geometries of the component in their current configuration */
  getGeometries: (extra?: Struct) => Promise<Geometry[]>;

  /**
   * Move the end of the arm to the pose.
   *
   * @param pose - The destination pose for the arm.
   */
  moveToPosition: (pose: Pose, extra?: Struct) => Promise<void>;

  /**
   * Move each joint of the arm based on the angles on the joint poisitons.
   * parameter
   *
   * @param jointPositionsList - List of angles (0-360) to move each joint to.
   */
  moveToJointPositions: (
    jointPositionsList: number[],
    extra?: Struct
  ) => Promise<void>;

  /** Gets the current position of each joint. */
  getJointPositions: (extra?: Struct) => Promise<ArmJointPositions>;

  /** Stops the motion of the arm. */
  stop: (extra?: Struct) => Promise<void>;

  /** Get if the arm is currently moving. */
  isMoving: () => Promise<boolean>;
}
