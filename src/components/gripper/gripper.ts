import type { Extra } from '../../types';

/** Represents a physical robotic gripper. */
export interface Gripper {
  /** Open a gripper of the underlying robot. */
  open: (extra?: Extra) => Promise<void>;

  /** Request a gripper of the underlying robot to grab. */
  grab: (extra?: Extra) => Promise<void>;

  /** Stop a robot's gripper. */
  stop: (extra?: Extra) => Promise<void>;

  /** Report if the gripper is in motion. */
  isMoving: () => Promise<boolean>;
}
