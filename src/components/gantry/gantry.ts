import type { Resource, StructType } from '../../types';

/** Represents a physical gantry that exists in three-dimensional space. */
export interface Gantry extends Resource {
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
    extra?: StructType
  ) => Promise<void>;

  /** @returns The current position of each axis. */
  getPosition: (extra?: StructType) => Promise<number[]>;

  /**
   * Runs the homing sequence to find the start and end positions of the gantry
   * axis.
   *
   * @returns A bool representing whether the gantry has run the homing sequence
   *   successfully.
   */
  home: (extra?: StructType) => Promise<boolean>;

  /** @returns The lengths of the axes of the gantry in millimeters. */
  getLengths: (extra?: StructType) => Promise<number[]>;

  /** Stops the motion of the gantry. */
  stop: (extra?: StructType) => Promise<void>;

  /** Get if the gantry is currently moving. */
  isMoving: () => Promise<boolean>;
}
