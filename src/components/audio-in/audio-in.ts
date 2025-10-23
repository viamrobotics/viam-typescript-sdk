import type { Resource, Struct } from '../../types';
import type { AudioInfo } from '../../gen/common/v1/common_pb';
import type { AudioProperties } from '../../audio-common';

export interface AudioChunk {
  audioData: Uint8Array;
  audioInfo?: AudioInfo;
  startTimeNs: bigint;
  endTimeNs: bigint;
  sequence: number;
  requestID: string;
}

/** Represents a device that takes audio input. */

export interface AudioIn extends Resource {
  /**
   * Stream audio from the device.
   *
   * @example
   *
   * ```ts
   * const audioIn = new VIAM.AudioInClient(machine, 'my_audio_in');
   * const stream = audioIn.getAudio(VIAM.AudioCodec.PCM16, 3, 0n, {});
   * ```
   */
  getAudio(
    codec: string,
    durationSeconds: number,
    previousTimestamp?: bigint,
    extra?: Struct
  ): AsyncIterable<AudioChunk>;

  /**
   * Return the audio input properties.
   *
   * @example
   *
   * ```ts
   * const audioIn = new VIAM.AudioInClient(machine, 'my_audio_in');
   * const properties = await audioIn.getProperties();
   * ```
   */
  getProperties: () => Promise<AudioProperties>;
}
