import type { PlainMessage, Struct } from '@bufbuild/protobuf';
import * as videoApi from '../../gen/service/video/v1/video_pb';

/** Request options for retrieving video */
export interface GetVideoOptions {
  /** Start time for the video retrieval */
  startTimestamp?: Date;
  /** End time for the video retrieval */
  endTimestamp?: Date;
  /** Codec for the video retrieval (e.g., "h264", "h265") */
  videoCodec?: string;
  /** Container format for the video retrieval (e.g., "mp4", "fmp4") */
  videoContainer?: string;
  /** Additional arguments */
  extra?: Struct;
}

/** A chunk of video data returned from the video service */
export interface VideoChunk {
  /** Video data chunk */
  videoData: Uint8Array;
  /** Container format (e.g., "mp4", "fmp4") */
  videoContainer: string;
  /** Request ID to match this response to its request */
  requestId: string;
}

export type GetVideoRequest = PlainMessage<videoApi.GetVideoRequest>;
export type GetVideoResponse = PlainMessage<videoApi.GetVideoResponse>;

export const { GetVideoRequest, GetVideoResponse } = videoApi;
