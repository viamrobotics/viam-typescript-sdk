import type { Resource, Struct } from '../../types';
import type { AudioInfo } from '../../gen/common/v1/common_pb';
import type { AudioProperties } from '../../audio-common';

/** Represents a device that outputs audio. */
export interface AudioOut extends Resource {
  /**
   * Play audio on the device.
   *
   * @example
   *
   * ```ts
   * const audioOut = new VIAM.AudioOutClient(machine, 'my_audio_out');
   * const audioData = new Uint8Array([...]); // Your audio data
   * const audioInfo = { codec: 'pcm16', sampleRateHz: 48000, numChannels: 2 };
   * await audioOut.play(audioData, audioInfo);
   * ```
   *
   * @param audioData - The audio data to play
   * @param audioInfo - Information about the audio format (optional, required
   *   for raw pcm data)
   */
  play: (
    audioData: Uint8Array,
    audioInfo?: AudioInfo,
    extra?: Struct
  ) => Promise<void>;

  /**
   * Return the audio output properties.
   *
   * @example
   *
   * ```ts
   * const audioOut = new VIAM.AudioOutClient(machine, 'my_audio_out');
   * const properties = await audioOut.getProperties();
   * ```
   */
  getProperties: () => Promise<AudioProperties>;
}
