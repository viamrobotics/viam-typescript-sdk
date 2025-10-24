export interface AudioProperties {
  /** List of audio codecs supported by the device */
  supportedCodecs: string[];
  /** Current sample rate in Hz */
  sampleRateHz: number;
  /** Maximum number of audio channels supported (e.g., 1 for mono, 2 for stereo) */
  numChannels: number;
}

/** Common audio codec constants */
export const AudioCodec = {
  MP3: 'mp3',
  PCM16: 'pcm16',
  PCM32: 'pcm32',
  PCM32_FLOAT: 'pcm32float',
  AAC: 'aac',
  OPUS: 'opus',
  FLAC: 'flac',
  WAV: 'wav',
} as const;

export type AudioCodecType = (typeof AudioCodec)[keyof typeof AudioCodec];
