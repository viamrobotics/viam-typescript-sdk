// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GetAudioResponse } from '../../gen/component/audioin/v1/audioin_pb';
import {
  GetPropertiesRequest,
  GetPropertiesResponse,
} from '../../gen/common/v1/common_pb';
import { RobotClient } from '../../robot';
import { type AudioChunk } from './audio-in';
import { AudioInClient } from './client';
import { AudioCodec } from '../../audio-common';
vi.mock('../../robot');

import { Struct, type PartialMessage } from '@bufbuild/protobuf';
import { createClient, createRouterTransport } from '@connectrpc/connect';
import {
  createWritableIterable,
  type WritableIterable,
} from '@connectrpc/connect/protocol';
import { AudioInService } from '../../gen/component/audioin/v1/audioin_connect';

let audioin: AudioInClient;
let capturedPropertiesReq: GetPropertiesRequest | undefined;

let testAudioStream: WritableIterable<PartialMessage<GetAudioResponse>>;

const testProperties = new GetPropertiesResponse({
  supportedCodecs: [AudioCodec.PCM16, AudioCodec.MP3, AudioCodec.PCM32_FLOAT],
  sampleRateHz: 48_000,
  numChannels: 2,
});

describe('AudioInClient tests', () => {
  beforeEach(() => {
    testAudioStream =
      createWritableIterable<PartialMessage<GetAudioResponse>>();

    const mockTransport = createRouterTransport(({ service }) => {
      service(AudioInService, {
        getAudio: () => {
          return testAudioStream;
        },
        getProperties: (req: GetPropertiesRequest) => {
          capturedPropertiesReq = req;
          return testProperties;
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(AudioInService, mockTransport));

    audioin = new AudioInClient(new RobotClient('host'), 'test-audio-in');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAudio tests', () => {
    it('getAudio streams audio chunks', async () => {
      const audioChunks: AudioChunk[] = [];

      const streamProm = (async () => {
        for await (const chunk of audioin.getAudio(
          AudioCodec.PCM16,
          1.1,
          BigInt(0)
        )) {
          audioChunks.push(chunk);
        }
      })();

      await testAudioStream.write({
        audio: {
          audioData: new Uint8Array([4, 5, 6]),
          audioInfo: {
            codec: AudioCodec.PCM16,
            sampleRateHz: 48_000,
            numChannels: 2,
          },
          startTimestampNanoseconds: BigInt(1000),
          endTimestampNanoseconds: BigInt(2000),
          sequence: 1,
        },
        requestId: 'test-request-1',
      });

      await testAudioStream.write({
        audio: {
          audioData: new Uint8Array([7, 8, 9]),
          audioInfo: {
            codec: AudioCodec.PCM16,
            sampleRateHz: 48_000,
            numChannels: 2,
          },
          startTimestampNanoseconds: BigInt(2000),
          endTimestampNanoseconds: BigInt(3000),
          sequence: 2,
        },
        requestId: 'test-request-1',
      });

      testAudioStream.close();
      await streamProm;

      expect(audioChunks.length).toEqual(2);

      const chunk1 = audioChunks[0]!;
      expect(chunk1.audioData).toEqual(new Uint8Array([4, 5, 6]));
      expect(chunk1.sequence).toEqual(1);

      const chunk2 = audioChunks[1]!;
      expect(chunk2.audioData).toEqual(new Uint8Array([7, 8, 9]));
      expect(chunk2.sequence).toEqual(2);
    });
  });

  describe('getProperties tests', () => {
    it('getProperties returns audio properties', async () => {
      const properties = await audioin.getProperties();

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
      await audioin.getProperties(extra);
      expect(capturedPropertiesReq?.extra).toStrictEqual(
        Struct.fromJson(extra)
      );
    });
  });
});
