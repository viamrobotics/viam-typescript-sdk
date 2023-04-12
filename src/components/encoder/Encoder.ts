import type { Extra, PositionType } from '../../types';

export interface Properties {
  /** Whether a encoder supports ticks and/or degrees. */
  ticksCountSupported: boolean;
  angleDegreesSupported: boolean;
}

/** Represents a physical encoder. */
export interface Encoder {
  /** Set the current position of the encoder as the new zero position. */
  resetPosition(extra?: Extra): Promise<void>;

  /** Return the encoder's properties. */
  getProperties(extra?: Extra): Promise<Properties>;

  /**
   * Return the current position either in relative units (ticks away from a
   * zero position) or absolute units (degrees along a circle).
   */
  getPosition(
    positionType?: PositionType,
    extra?: Extra
  ): Promise<readonly [number, PositionType]>;
}
