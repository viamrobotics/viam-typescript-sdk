import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';

/** Represents a physical servo. */
export interface Servo extends Resource {
  /** Move the servo by a given angle in degrees. */
  move(angleDeg: number, extra?: Struct): Promise<void>;

  /** Return the current set angle of the servo in degrees. */
  getPosition(extra?: Struct): Promise<number>;

  /** Stop the servo. */
  stop(extra?: Struct): Promise<void>;

  /** Return true if the servo is in motion. */
  isMoving(): Promise<boolean>;
}
