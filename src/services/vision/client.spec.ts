// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient, createRouterTransport } from '@connectrpc/connect';

import { PointCloudObjectSchema } from '../../gen/common/v1/common_pb';
import { VisionService } from '../../gen/service/vision/v1/vision_pb';
import {
  CaptureAllFromCameraResponseSchema,
  ClassificationSchema,
  DetectionSchema,
  GetClassificationsFromCameraResponseSchema,
  GetClassificationsResponseSchema,
  GetDetectionsFromCameraResponseSchema,
  GetDetectionsResponseSchema,
  GetObjectPointCloudsResponseSchema,
  GetPropertiesResponseSchema,
} from '../../gen/service/vision/v1/vision_pb';
import { RobotClient } from '../../robot';
import { VisionClient } from './client';
import type { Classification, Detection, PointCloudObject } from './types';
vi.mock('../../robot');

import { create } from '@bufbuild/protobuf';

const visionClientName = 'test-vision';

let vision: VisionClient;

const classification: Classification = create(ClassificationSchema, {
  className: 'face',
  confidence: 0.995_482_683_181_762_7,
});

const detection: Detection = create(DetectionSchema, {
  xMin: BigInt(251),
  yMin: BigInt(225),
  xMax: BigInt(416),
  yMax: BigInt(451),
  confidence: 0.995_482_683_181_762_7,
  className: 'face',
});

const pco: PointCloudObject = create(PointCloudObjectSchema, {
  pointCloud: new Uint8Array([1, 2, 3, 4]),
  geometries: undefined,
});

const extra = { key: 'value' };

describe('VisionClient Tests', () => {
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(VisionService, {
        getDetections: () =>
          create(GetDetectionsResponseSchema, { detections: [detection] }),
        getDetectionsFromCamera: () =>
          create(GetDetectionsFromCameraResponseSchema, {
            detections: [detection],
          }),
        getClassifications: () =>
          create(GetClassificationsResponseSchema, {
            classifications: [classification],
          }),
        getClassificationsFromCamera: () =>
          create(GetClassificationsFromCameraResponseSchema, {
            classifications: [classification],
          }),
        getObjectPointClouds: () =>
          create(GetObjectPointCloudsResponseSchema, { objects: [pco] }),
        getProperties: () =>
          create(GetPropertiesResponseSchema, {
            classificationsSupported: true,
            detectionsSupported: true,
            objectPointCloudsSupported: true,
          }),
        captureAllFromCamera: () =>
          create(CaptureAllFromCameraResponseSchema, {
            classifications: [classification],
            detections: [detection],
            objects: [pco],
            extra,
          }),
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(VisionService, mockTransport));
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
        extra,
      });
    });
  });
});
