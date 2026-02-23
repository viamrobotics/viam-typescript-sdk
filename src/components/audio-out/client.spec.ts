// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GetPropertiesRequest,
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

let audioOut: AudioOutClient;
let capturedPropertiesReq: GetPropertiesRequest | undefined;

const testProperties = new GetPropertiesResponse({
  supportedCodecs: [AudioCodec.PCM16, AudioCodec.MP3, AudioCodec.PCM32_FLOAT],
  sampleRateHz: 48_000,
  numChannels: 2,
});

describe('AudioOutClient tests', () => {
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(AudioOutService, {
        play: () => {
          return {};
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
      expect(capturedPropertiesReq?.extra).toStrictEqual(
        Struct.fromJson(extra)
      );
    });
  });
});
