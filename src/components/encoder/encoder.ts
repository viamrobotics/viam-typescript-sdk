import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';

import * as encoderApi from '../../gen/component/encoder/v1/encoder_pb';

export type EncoderProperties = encoderApi.GetPropertiesResponse;
export type EncoderPositionType = encoderApi.PositionType;

export const {
  GetPropertiesResponse: EncoderProperties,
  PositionType: EncoderPositionType,
} = encoderApi;

/** Represents a physical encoder. */
export interface Encoder extends Resource {
  /**
   * Set the current position of the encoder as the new zero position.
   *
   * @example
   *
   * ```ts
   * const encoder = new VIAM.EncoderClient(machine, 'my_encoder');
   *
   * // Reset the zero position of the encoder
   * await encoder.resetPosition();
   * ```
   *
   * For more information, see [Encoder
   * API](https://docs.viam.com/dev/reference/apis/components/encoder/#resetposition).
   */
  resetPosition(extra?: Struct): Promise<void>;

  /**
   * Return the encoder's properties.
   *
   * @example
   *
   * ```ts
   * const encoder = new VIAM.EncoderClient(machine, 'my_encoder');
   *
   * // Get whether the encoder returns position in ticks or degrees
   * const properties = await encoder.getProperties();
   * ```
   *
   * For more information, see [Encoder
   * API](https://docs.viam.com/dev/reference/apis/components/encoder/#getproperties).
   */
  getProperties(extra?: Struct): Promise<EncoderProperties>;

  /**
   * Return the current position either in relative units (ticks away from a
   * zero position) or absolute units (degrees along a circle).
   *
   * @example
   *
   * ```ts
   * const encoder = new VIAM.EncoderClient(machine, 'my_encoder');
   *
   * // Get the position of the encoder in ticks
   * const [position, posType] = await encoder.getPosition(
   *   EncoderPositionType.POSITION_TYPE_TICKS_COUNT
   * );
   * console.log('The encoder position is currently', position, posType);
   * ```
   *
   * For more information, see [Encoder
   * API](https://docs.viam.com/dev/reference/apis/components/encoder/#getposition).
   *
   * @param positionType - The type of position the encoder returns (ticks or
   *   degrees)
   */
  getPosition(
    positionType?: EncoderPositionType,
    extra?: Struct
  ): Promise<readonly [number, EncoderPositionType]>;
}
