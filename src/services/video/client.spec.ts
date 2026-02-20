// @vitest-environment happy-dom

import { createClient, createRouterTransport } from '@connectrpc/connect';
import { createWritableIterable } from '@connectrpc/connect/protocol';
import { Struct } from '@bufbuild/protobuf';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoService } from '../../gen/service/video/v1/video_connect';
import { GetVideoResponse } from '../../gen/service/video/v1/video_pb';
import { DoCommandResponse } from '../../gen/common/v1/common_pb';
import { RobotClient } from '../../robot';
import { VideoClient } from './client';

vi.mock('../../robot');
vi.mock('../../gen/service/video/v1/video_pb_service');

const videoClientName = 'test-video';

let video: VideoClient;
let testVideoStream = createWritableIterable<GetVideoResponse>();

describe('VideoClient Tests', () => {
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(VideoService, {
        getVideo: () => testVideoStream,
        doCommand: () => new DoCommandResponse({ result: Struct.fromJson({}) }),
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(VideoService, mockTransport));

    video = new VideoClient(new RobotClient('host'), videoClientName);
  });

  afterEach(() => {
    testVideoStream = createWritableIterable<GetVideoResponse>();
  });

  describe('getVideo Tests', () => {
    it('returns video chunks from the stream', async () => {
      const chunk1 = new Uint8Array([1, 2, 3, 4]);
      const chunk2 = new Uint8Array([5, 6, 7, 8]);

      const streamPromise = (async () => {
        const chunks = [];
        for await (const chunk of video.getVideo(
          new Date('2025-01-01T00:00:00Z'),
          new Date('2025-01-01T00:10:00Z'),
          'h264',
          'mp4'
        )) {
          chunks.push(chunk);
        }
        return chunks;
      })();

      await testVideoStream.write(
        new GetVideoResponse({
          videoData: chunk1,
          videoContainer: 'mp4',
          requestId: 'test-request-id',
        })
      );

      await testVideoStream.write(
        new GetVideoResponse({
          videoData: chunk2,
          videoContainer: 'mp4',
          requestId: 'test-request-id',
        })
      );

      testVideoStream.close();

      const result = await streamPromise;

      expect(result).toHaveLength(2);
      expect(result[0]?.videoData).toStrictEqual(chunk1);
      expect(result[0]?.videoContainer).toBe('mp4');
      expect(result[0]?.requestId).toBe('test-request-id');
      expect(result[1]?.videoData).toStrictEqual(chunk2);
    });

    it('handles empty stream', async () => {
      const streamPromise = (async () => {
        const chunks = [];
        for await (const chunk of video.getVideo()) {
          chunks.push(chunk);
        }
        return chunks;
      })();

      testVideoStream.close();

      const result = await streamPromise;
      expect(result).toHaveLength(0);
    });
  });

  describe('doCommand Tests', () => {
    it('sends and receives arbitrary commands with Struct', async () => {
      const result = await video.doCommand(
        Struct.fromJson({ command: 'test' })
      );
      expect(result).toStrictEqual({});
    });

    it('sends and receives arbitrary commands with plain object', async () => {
      const result = await video.doCommand({ command: 'test' });
      expect(result).toStrictEqual({});
    });
  });
});
