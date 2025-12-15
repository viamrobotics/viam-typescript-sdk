import type { JsonValue, Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';
import type { GetVideoOptions, VideoChunk } from './types';

/**
 * A service that enables video streaming and retrieval for a given time range.
 *
 * @example
 *
 * ```ts
 * const video = new VIAM.VideoClient(machine, 'my_video');
 * const videoStream = video.getVideo({
 *   startTimestamp: new Date('2025-01-01T00:00:00Z'),
 *   endTimestamp: new Date('2025-01-01T00:10:00Z'),
 *   videoCodec: 'h264',
 *   videoContainer: 'mp4',
 * });
 *
 * for await (const chunk of videoStream) {
 *   console.log('Received video chunk:', chunk.videoData.length, 'bytes');
 * }
 * ```
 */
export interface Video extends Resource {
  /**
   * Retrieve video data for a given time range.
   *
   * @example
   *
   * ```ts
   * const video = new VIAM.VideoClient(machine, 'my_video');
   * const videoStream = video.getVideo({
   *   startTimestamp: new Date('2025-01-01T00:00:00Z'),
   *   endTimestamp: new Date('2025-01-01T00:10:00Z'),
   *   videoCodec: 'h264',
   *   videoContainer: 'mp4',
   * });
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
   * For more information, see [Video
   * API](https://docs.viam.com/dev/reference/apis/services/video/#getvideo).
   *
   * @param options - The options for video retrieval including time range,
   *   codec, and container format.
   * @returns - An async iterable of video chunks.
   */
  getVideo: (options: GetVideoOptions) => AsyncIterable<VideoChunk>;

  /**
   * Send/receive arbitrary commands to the resource.
   *
   * @example
   *
   * ```ts
   * const video = new VIAM.VideoClient(machine, 'my_video');
   * const result = await video.doCommand({ command: 'custom_command' });
   * ```
   *
   * @param command - The command to execute.
   * @returns - The result of the command.
   */
  doCommand: (command: Struct) => Promise<JsonValue>;
}
