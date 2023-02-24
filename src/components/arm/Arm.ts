import type { Pose, WorldState } from '../../gen/common/v1/common_pb.esm';

import type { JointPositions } from '../../gen/component/arm/v1/arm_pb.esm';

import type { Extra } from '../../types';

export interface Arm {
  /**
   * Get the position of the end of the arm expressed as a pose
   *
   */
  GetEndPosition: (extra?: Extra) => Promise<Pose>;

  /**
   * Move the end of the arm to the pose, avoiding obstacles in the worldstate
   *
   * @param pose - The destination pose for the arm
   * @param world - The obstacles for the arm to avoid
   */
  MoveToPosition: (
    pose: Pose,
    world: WorldState,
    extra?: Extra
  ) => Promise<void>;

  /**
   * Move each joint of the arm based on the angles on the joint poisitons
   * parameter
   *
   * @param jointPositions - Destination joint positons
   */
  MoveToJointPositions: (
    jointPositions: JointPositions,
    extra?: Extra
  ) => Promise<void>;

  /**
   * Gets the current position of each joint
   *
   */
  GetJointPositions: (extra: Extra) => Promise<JointPositions>;

  /**
   * Stops the motion of the arm
   *
   */
  Stop: (extra: Extra) => Promise<void>;

  /**
   * Get if the arm is currently moving
   * 
   */
  IsMoving: () => Promise<boolean>;
}
