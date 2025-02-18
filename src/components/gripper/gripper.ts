import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';
import type { Geometry } from '../../gen/common/v1/common_pb';

/** Represents a physical robotic gripper. */
export interface Gripper extends Resource {
  /** Get the geometries of the component in their current configuration */
  getGeometries: (extra?: Struct) => Promise<Geometry[]>;

  /** Open a gripper of the underlying robot. */
  open: (extra?: Struct) => Promise<void>;

  /** Request a gripper of the underlying robot to grab. */
  grab: (extra?: Struct) => Promise<void>;

  /** Stop a robot's gripper. */
  stop: (extra?: Struct) => Promise<void>;

  /** Report if the gripper is in motion. */
  isMoving: () => Promise<boolean>;
}
