import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';

/** Represents a physical robotic gripper. */
export interface Gripper extends Resource {
  /** Open a gripper of the underlying robot. */
  open: (extra?: Struct) => Promise<void>;

  /** Request a gripper of the underlying robot to grab. */
  grab: (extra?: Struct) => Promise<void>;

  /** Stop a robot's gripper. */
  stop: (extra?: Struct) => Promise<void>;

  /** Report if the gripper is in motion. */
  isMoving: () => Promise<boolean>;
}
