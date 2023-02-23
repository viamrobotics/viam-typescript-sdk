
import type {
    Pose,
    WorldState,

  } from '../../gen/common/v1/common_pb.esm';

  import type {
    JointPositions
  } from '../../gen/component/arm/v1/arm_pb.esm';

  import type { Extra } from '../../types';


  export interface Arm  {
    GetEndPosition: (extra?: Extra) => Promise<Pose>;
    MoveToPosition: (pose: Pose, world: WorldState, extra?: Extra) => Promise<void>;
    MoveToJointPositions: (jointPositions: JointPositions, extra?: Extra) => Promise<void>;
    GetJointPositions: (extra: Extra) => Promise<JointPositions>;
    Stop: (extra: Extra) => Promise<void>
    IsMoving: () => Promise<boolean>;

  }