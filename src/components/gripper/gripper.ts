import type { StructType } from '../../types';

/** Represents a physical robotic gripper. */
export interface Gripper {
  /** Open a gripper of the underlying robot. */
  open: (extra?: StructType) => Promise<void>;

  /** Request a gripper of the underlying robot to grab. */
  grab: (extra?: StructType) => Promise<void>;

  /** Stop a robot's gripper. */
  stop: (extra?: StructType) => Promise<void>;

  /** Report if the gripper is in motion. */
  isMoving: () => Promise<boolean>;
}
