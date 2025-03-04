// @vitest-environment happy-dom

import {
  createPromiseClient,
  createRouterTransport,
} from '@connectrpc/connect';
import { Struct } from '@bufbuild/protobuf';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VisionService } from '../../gen/service/vision/v1/vision_connect';
import {
  CaptureAllFromCameraResponse,
  GetClassificationsFromCameraResponse,
  GetClassificationsResponse,
  GetDetectionsFromCameraResponse,
  GetDetectionsResponse,
  GetObjectPointCloudsResponse,
  GetPropertiesResponse,
} from '../../gen/service/vision/v1/vision_pb';
import { RobotClient } from '../../robot';
import { VisionClient } from './client';
import { Classification, Detection, PointCloudObject } from './types';
vi.mock('../../robot');
vi.mock('../../gen/service/vision/v1/vision_pb_service');

const visionClientName = 'test-vision';

let vision: VisionClient;

const classification: Classification = new Classification({
  className: 'face',
  confidence: 0.995_482_683_181_762_7,
});

const detection: Detection = new Detection({
  xMin: BigInt(251),
  yMin: BigInt(225),
  xMax: BigInt(416),
  yMax: BigInt(451),
  confidence: 0.995_482_683_181_762_7,
  className: 'face',
});

const pco: PointCloudObject = new PointCloudObject({
  pointCloud: new Uint8Array([1, 2, 3, 4]),
  geometries: undefined,
});

const extra: Struct = Struct.fromJson({ key: 'value' });

describe('VisionClient Tests', () => {
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(VisionService, {
        getDetections: () =>
          new GetDetectionsResponse({ detections: [detection] }),
        getDetectionsFromCamera: () =>
          new GetDetectionsFromCameraResponse({ detections: [detection] }),
        getClassifications: () =>
          new GetClassificationsResponse({ classifications: [classification] }),
        getClassificationsFromCamera: () =>
          new GetClassificationsFromCameraResponse({
            classifications: [classification],
          }),
        getObjectPointClouds: () =>
          new GetObjectPointCloudsResponse({ objects: [pco] }),
        getProperties: () =>
          new GetPropertiesResponse({
            classificationsSupported: true,
            detectionsSupported: true,
            objectPointCloudsSupported: true,
          }),
        captureAllFromCamera: () =>
          new CaptureAllFromCameraResponse({
            classifications: [classification],
            detections: [detection],
            objects: [pco],
            extra: extra,
          }),
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() =>
        createPromiseClient(VisionService, mockTransport)
      );
    vision = new VisionClient(new RobotClient('host'), visionClientName);
  });

  describe('Detection Tests', () => {
    it('returns detections from a camera', async () => {
      const expected = [detection];

      await expect(
        vision.getDetectionsFromCamera('camera')
      ).resolves.toStrictEqual(expected);
    });

    it('returns detections from an image', async () => {
      const expected = [detection];

      await expect(
        vision.getDetections(new Uint8Array(), 1, 1, 'image/jpeg')
      ).resolves.toStrictEqual(expected);
    });
  });

  describe('Classification Tests', () => {
    it('returns classifications from a camera', async () => {
      const expected = [classification];

      await expect(
        vision.getClassificationsFromCamera('camera', 1)
      ).resolves.toStrictEqual(expected);
    });

    it('returns classifications from an image', async () => {
      const expected = [classification];

      await expect(
        vision.getClassifications(new Uint8Array(), 1, 1, 'image/jpeg', 1)
      ).resolves.toStrictEqual(expected);
    });
  });

  describe('Object Point Cloud Tests', () => {
    it('returns a PointCloudObject from a camera', async () => {
      const expected = [pco];

      await expect(
        vision.getObjectPointClouds('camera')
      ).resolves.toStrictEqual(expected);
    });
  });

  describe('Properties', () => {
    it('returns properties', async () => {
      await expect(vision.getProperties()).resolves.toStrictEqual({
        classificationsSupported: true,
        detectionsSupported: true,
        objectPointCloudsSupported: true,
      });
    });
  });

  describe('Capture All', () => {
    it('returns captured values', async () => {
      await expect(
        vision.captureAllFromCamera('camera', {
          returnImage: true,
          returnClassifications: true,
          returnDetections: true,
          returnObjectPointClouds: true,
        })
      ).resolves.toStrictEqual({
        image: undefined,
        classifications: [classification],
        detections: [detection],
        objectPointClouds: [pco],
        extra: extra,
      });
    });
  });
});
