import type { JsonValue, Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';
import type { VideoChunk } from './types';

/** A service that enables video streaming and retrieval for a given time range. */
export interface Video extends Resource {
  /**
   * Retrieve video data for a given time range.
   *
   * @example
   *
   * ```ts
   * const video = new VIAM.VideoClient(machine, 'my_video');
   * const videoStream = video.getVideo(
   *   new Date('2025-01-01T00:00:00Z'),
   *   new Date('2025-01-01T00:10:00Z'),
   *   'h264',
   *   'mp4'
   * );
   *
   * for await (const chunk of videoStream) {
   *   console.log(
   *     'Received video chunk:',
   *     chunk.videoData.length,
   *     'bytes'
   *   );
   * }
   * ```
   *
   * @param startTimestamp - Start time for the video retrieval.
   * @param endTimestamp - End time for the video retrieval.
   * @param videoCodec - Codec for the video (e.g., "h264", "h265").
   * @param videoContainer - Container format (e.g., "mp4", "fmp4").
   * @param extra - Additional arguments.
   * @returns An async iterable of video chunks.
   */
  getVideo: (
    startTimestamp?: Date,
    endTimestamp?: Date,
    videoCodec?: string,
    videoContainer?: string,
    extra?: Struct
  ) => AsyncIterable<VideoChunk>;

  /**
   * Send/receive arbitrary commands to the resource.
   *
   * @param command - The command to execute. Accepts a plain object or a
   *   {@link Struct}.
   * @returns The result of the command.
   */
  doCommand: (
    command: Struct | Record<string, JsonValue>
  ) => Promise<JsonValue>;
}
