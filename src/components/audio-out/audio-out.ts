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
   * Stream audio chunks to the device for playback.
   *
   * The caller provides an async iterable of raw audio bytes. Each chunk must
   * match the codec and format described by `audioInfo`. Playback starts as
   * chunks arrive on the server, before the iterable is exhausted.
   *
   * @example
   *
   * ```ts
   * const audioOut = new VIAM.AudioOutClient(machine, 'my_audio_out');
   * const audioInfo = {
   *   codec: 'pcm16',
   *   sampleRateHz: 22050,
   *   numChannels: 1,
   * };
   *
   * async function* chunks() {
   *   for (const chunk of pcmChunks) yield chunk;
   * }
   *
   * await audioOut.playStream(audioInfo, chunks());
   * ```
   *
   * @param audioInfo - Information about the audio format (codec, sample rate,
   *   channels) that applies to every chunk
   * @param chunks - Async iterable of audio byte chunks to play in order
   */
  playStream: (
    audioInfo: AudioInfo,
    chunks: AsyncIterable<Uint8Array>,
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
  getProperties: (extra?: Struct) => Promise<AudioProperties>;
}
