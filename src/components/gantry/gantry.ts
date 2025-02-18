import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';
import type { Geometry } from '../../gen/common/v1/common_pb';

/** Represents a physical gantry that exists in three-dimensional space. */
export interface Gantry extends Resource {
  /** Get the geometries of the component in their current configuration */
  getGeometries: (extra?: Struct) => Promise<Geometry[]>;

  /**
   * Move each axis of the gantry to the positionsMm at the speeds in
   * speedsMmPerSec
   *
   * @param positionsMm - The goal positions for each axis of the gantry.
   * @param speedsMmPerSec - The desired speed for each axis to move to the
   *   respective position in positionsMm.
   */
  moveToPosition: (
    positionsMm: number[],
    speedsMmPerSec: number[],
    extra?: Struct
  ) => Promise<void>;

  /** @returns The current position of each axis. */
  getPosition: (extra?: Struct) => Promise<number[]>;

  /**
   * Runs the homing sequence to find the start and end positions of the gantry
   * axis.
   *
   * @returns A bool representing whether the gantry has run the homing sequence
   *   successfully.
   */
  home: (extra?: Struct) => Promise<boolean>;

  /** @returns The lengths of the axes of the gantry in millimeters. */
  getLengths: (extra?: Struct) => Promise<number[]>;

  /** Stops the motion of the gantry. */
  stop: (extra?: Struct) => Promise<void>;

  /** Get if the gantry is currently moving. */
  isMoving: () => Promise<boolean>;
}
