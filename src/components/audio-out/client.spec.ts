// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type GetPropertiesRequest,
  GetPropertiesResponse,
  AudioInfo,
} from '../../gen/common/v1/common_pb';
import { RobotClient } from '../../robot';
import { AudioOutClient } from './client';
import { AudioCodec } from '../../audio-common';
vi.mock('../../robot');

import { Struct } from '@bufbuild/protobuf';
import { createClient, createRouterTransport } from '@connectrpc/connect';
import { AudioOutService } from '../../gen/component/audioout/v1/audioout_connect';
import {
  type PlayStreamInit,
  type PlayStreamRequest,
  PlayStreamResponse,
} from '../../gen/component/audioout/v1/audioout_pb';

let audioOut: AudioOutClient;
let capturedPropertiesReq: GetPropertiesRequest | undefined;
let capturedPlayStreamInit: PlayStreamInit | undefined;
let capturedPlayStreamChunks: Uint8Array[] = [];

const testProperties = new GetPropertiesResponse({
  supportedCodecs: [AudioCodec.PCM16, AudioCodec.MP3, AudioCodec.PCM32_FLOAT],
  sampleRateHz: 48_000,
  numChannels: 2,
});

describe('AudioOutClient tests', () => {
  beforeEach(() => {
    capturedPlayStreamInit = undefined;
    capturedPlayStreamChunks = [];
    const mockTransport = createRouterTransport(({ service }) => {
      service(AudioOutService, {
        play: () => {
          return {};
        },
        playStream: async (reqs: AsyncIterable<PlayStreamRequest>) => {
          for await (const req of reqs) {
            if (req.payload.case === 'init') {
              capturedPlayStreamInit = req.payload.value;
            } else if (req.payload.case === 'audioChunk') {
              capturedPlayStreamChunks.push(req.payload.value.audioData);
            }
          }
          return new PlayStreamResponse();
        },
        getProperties: (req: GetPropertiesRequest) => {
          capturedPropertiesReq = req;
          return testProperties;
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(AudioOutService, mockTransport));

    audioOut = new AudioOutClient(new RobotClient('host'), 'test-audio-out');
  });

  describe('play tests', () => {
    it('play sends audio data', async () => {
      const audioData = new Uint8Array([1, 2, 3, 4, 5]);
      const audioInfo = new AudioInfo({
        codec: AudioCodec.PCM16,
        sampleRateHz: 48_000,
        numChannels: 2,
      });

      await expect(audioOut.play(audioData, audioInfo)).resolves.not.toThrow();
    });
  });

  describe('playStream tests', () => {
    it('playStream sends init followed by chunks', async () => {
      const audioInfo = new AudioInfo({
        codec: AudioCodec.PCM16,
        sampleRateHz: 22_050,
        numChannels: 1,
      });
      const chunks = [
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5, 6]),
        new Uint8Array([7, 8, 9]),
      ];

      // eslint-disable-next-line @typescript-eslint/require-await
      const source = async function* sourceGen(): AsyncIterable<Uint8Array> {
        for (const chunk of chunks) {
          yield chunk;
        }
      };

      await audioOut.playStream(audioInfo, source());

      expect(capturedPlayStreamInit?.name).toEqual('test-audio-out');
      expect(capturedPlayStreamInit?.audioInfo?.codec).toEqual(AudioCodec.PCM16);
      expect(capturedPlayStreamInit?.audioInfo?.sampleRateHz).toEqual(22_050);
      expect(capturedPlayStreamInit?.audioInfo?.numChannels).toEqual(1);
      expect(capturedPlayStreamChunks).toEqual(chunks);
    });

    it('playStream with no chunks still sends init', async () => {
      const audioInfo = new AudioInfo({
        codec: AudioCodec.PCM16,
        sampleRateHz: 48_000,
        numChannels: 2,
      });

      const empty = async function* emptyGen(): AsyncIterable<Uint8Array> {
        // no chunks
      };

      await audioOut.playStream(audioInfo, empty());

      expect(capturedPlayStreamInit?.name).toEqual('test-audio-out');
      expect(capturedPlayStreamChunks).toEqual([]);
    });
  });

  describe('getProperties tests', () => {
    it('getProperties returns audio properties', async () => {
      const properties = await audioOut.getProperties();

      expect(properties.supportedCodecs).toEqual([
        AudioCodec.PCM16,
        AudioCodec.MP3,
        AudioCodec.PCM32_FLOAT,
      ]);
      expect(properties.sampleRateHz).toEqual(48_000);
      expect(properties.numChannels).toEqual(2);
    });

    it('getProperties passes extra to request', async () => {
      const extra = { key: 'value' };
      await audioOut.getProperties(extra);
      expect(capturedPropertiesReq?.extra).toStrictEqual(Struct.fromJson(extra));
    });
  });
});
