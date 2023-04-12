import type { Extra, PositionType } from '../../types';
import pb from '../../gen/component/encoder/v1/encoder_pb';

export type EncoderProperties = pb.Properties.AsObject;

/** Represents a physical encoder. */
export interface Encoder {
  /** Set the current position of the encoder as the new zero position. */
  resetPosition(extra?: Extra): Promise<void>;

  /** Return the encoder's properties. */
  getProperties(extra?: Extra): Promise<EncoderProperties>;

  /**
   * Return the current position either in relative units (ticks away from a
   * zero position) or absolute units (degrees along a circle).
   * 
   * @param positionType - The type of position the encoder returns (ticks or degrees)
   */
  getPosition(
    positionType?: PositionType,
    extra?: Extra
  ): Promise<readonly [number, PositionType]>;
}
