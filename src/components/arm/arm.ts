
import type {
    Pose,
    WorldState,

  } from '../../gen/common/v1/common_pb.esm';

  import type {
    JointPositions
  } from '../../gen/component/arm/v1/arm_pb.esm';

  import type { Extra } from '../../types';


  export interface Arm  {
    /** 
    * Get the position of the end of the arm expressed as a pose 
    * 
    * @returns Pose 
    *
    **/
    GetEndPosition: (extra?: Extra) => Promise<Pose>;

    /**
     * Move the end of the arm to the pose, avoiding obstacles in the worldstate
     * 
     * @param pose - the destination pose for the arm
     * @param world - the obstacles for the arm to avoid
     * @returns 
     */
    MoveToPosition: (pose: Pose, world: WorldState, extra?: Extra) => Promise<void>;

    /**
     * Move each joint of the arm based on the angles in the jointpoisitons parameter
     * @param jointPositions destination joint positons 
     * @returns 
     */
    MoveToJointPositions: (jointPositions: JointPositions, extra?: Extra) => Promise<void>;

    /**
     * Gets the current position of each joint
     * 
     * @returns JointPositions - the current JointPositions of the arm
     */
    GetJointPositions: (extra: Extra) => Promise<JointPositions>;

    /**
     * Stops the motion of the arm
     * 
     * @returns 
     */
    Stop: (extra: Extra) => Promise<void>

    /**
     * Get if the arm is currently moving
     * 
     * @returns boolean whether the arm is moving
     */
    IsMoving: () => Promise<boolean>;

  }