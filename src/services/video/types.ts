/** A chunk of video data returned from the video service */
export interface VideoChunk {
  /** Video data chunk */
  videoData: Uint8Array;
  /** Container format (e.g., "mp4", "fmp4") */
  videoContainer: string;
  /** Request ID to match this response to its request */
  requestId: string;
}
