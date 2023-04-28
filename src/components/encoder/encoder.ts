import type { Resource, StructType } from '../../types';
import pb from '../../gen/component/encoder/v1/encoder_pb';

export type EncoderProperties = pb.GetPropertiesResponse.AsObject;

type ValueOf<T> = T[keyof T];
export const EncoderPositionType = pb.PositionType;
export type EncoderPositionType = ValueOf<typeof pb.PositionType>;

/** Represents a physical encoder. */
export interface Encoder extends Resource {
  /** Set the current position of the encoder as the new zero position. */
  resetPosition(extra?: StructType): Promise<void>;

  /** Return the encoder's properties. */
  getProperties(extra?: StructType): Promise<EncoderProperties>;

  /**
   * Return the current position either in relative units (ticks away from a
   * zero position) or absolute units (degrees along a circle).
   *
   * @param positionType - The type of position the encoder returns (ticks or
   *   degrees)
   */
  getPosition(
    positionType?: EncoderPositionType,
    extra?: StructType
  ): Promise<readonly [number, EncoderPositionType]>;
}
