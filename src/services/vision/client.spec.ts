// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Classification as PBClassification,
  Detection as PBDetection,
} from '../../gen/service/vision/v1/vision_pb';
import { PointCloudObject as PBPointCloudObject } from '../../gen/common/v1/common_pb';
import { VisionServiceClient } from '../../gen/service/vision/v1/vision_pb_service';
import { RobotClient } from '../../robot';
import { VisionClient } from './client';
import type { Classification, Detection, PointCloudObject } from './types';
vi.mock('../../robot');
vi.mock('../../gen/service/vision/v1/vision_pb_service');

const visionClientName = 'test-vision';

let vision: VisionClient;

const classification: Classification = {
  className: 'face',
  confidence: 0.995_482_683_181_762_7,
};
const pbClassification = (() => {
  const pb = new PBClassification();
  pb.setClassName(classification.className);
  pb.setConfidence(classification.confidence);
  return pb;
})();

const detection: Detection = {
  xMin: 251,
  yMin: 225,
  xMax: 416,
  yMax: 451,
  confidence: 0.995_482_683_181_762_7,
  className: 'face',
};
const pbDetection = (() => {
  const pb = new PBDetection();
  pb.setClassName(detection.className);
  pb.setConfidence(detection.confidence);
  pb.setXMin(detection.xMin);
  pb.setXMax(detection.xMax);
  pb.setYMin(detection.yMin);
  pb.setYMax(detection.yMax);
  return pb;
})();

const pco: PointCloudObject = {
  pointCloud: 'This is a PointCloudObject',
  geometries: undefined,
};
const pbPCO = (() => {
  const pb = new PBPointCloudObject();
  pb.setPointCloud(pco.pointCloud);
  return pb;
})();

describe('VisionClient Tests', () => {
  beforeEach(() => {
    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => new VisionServiceClient(visionClientName));

    VisionServiceClient.prototype.getDetections = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {
          getDetectionsList: () => [pbDetection],
        });
      });
    VisionServiceClient.prototype.getDetectionsFromCamera = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {
          getDetectionsList: () => [pbDetection],
        });
      });
    VisionServiceClient.prototype.getClassifications = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {
          getClassificationsList: () => [pbClassification],
        });
      });
    VisionServiceClient.prototype.getClassificationsFromCamera = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {
          getClassificationsList: () => [pbClassification],
        });
      });
    VisionServiceClient.prototype.getObjectPointClouds = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {
          getObjectsList: () => [pbPCO],
        });
      });
    VisionServiceClient.prototype.getProperties = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {
          getClassificationsSupported: () => true,
          getDetectionsSupported: () => true,
          getObjectPointCloudsSupported: () => true,
        });
      });
    VisionServiceClient.prototype.captureAllFromCamera = vi
      .fn()
      .mockImplementation((_req, _md, cb) => {
        cb(null, {
          getImage: () => undefined,
          getClassificationsList: () => [pbClassification],
          getDetectionsList: () => [pbDetection],
          getObjectsList: () => [pbPCO],
        });
      });

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
      });
    });
  });
});
