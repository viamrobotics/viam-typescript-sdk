// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
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

describe('VisionClient Tests', () => {
  beforeEach(() => {
    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => new VisionServiceClient(visionClientName));

    vision = new VisionClient(new RobotClient('host'), visionClientName);
  });

  describe('Detection Tests', () => {
    const testDetection: Detection = {
      xMin: 251,
      yMin: 225,
      xMax: 416,
      yMax: 451,
      confidence: 0.995_482_683_181_762_7,
      className: 'face',
    };
    let detection: Mock<[], PBDetection>;
    const encodeDetection = (det: Detection) => {
      const pbDetection = new PBDetection();
      pbDetection.setClassName(det.className);
      pbDetection.setConfidence(det.confidence);
      pbDetection.setXMin(det.xMin);
      pbDetection.setXMax(det.xMax);
      pbDetection.setYMin(det.yMin);
      pbDetection.setYMax(det.yMax);
      return pbDetection;
    };

    beforeEach(() => {
      VisionServiceClient.prototype.getDetections = vi
        .fn()
        .mockImplementation((_req, _md, cb) => {
          cb(null, {
            getDetectionsList: () => [detection()],
          });
        });

      VisionServiceClient.prototype.getDetectionsFromCamera = vi
        .fn()
        .mockImplementation((_req, _md, cb) => {
          cb(null, {
            getDetectionsList: () => [detection()],
          });
        });
    });

    it('returns detections from a camera', async () => {
      detection = vi.fn(() => encodeDetection(testDetection));

      const expected = [testDetection];

      await expect(
        vision.getDetectionsFromCamera('camera')
      ).resolves.toStrictEqual(expected);
    });

    it('returns detections from an image', async () => {
      detection = vi.fn(() => encodeDetection(testDetection));

      const expected = [testDetection];

      await expect(
        vision.getDetections(new Uint8Array(), 1, 1, 'image/jpeg')
      ).resolves.toStrictEqual(expected);
    });
  });

  describe('Classification Tests', () => {
    const testClassification: Classification = {
      className: 'face',
      confidence: 0.995_482_683_181_762_7,
    };
    let classification: Mock<[], PBClassification>;
    const encodeClassification = (cls: Classification) => {
      const pbClassification = new PBClassification();
      pbClassification.setClassName(cls.className);
      pbClassification.setConfidence(cls.confidence);
      return pbClassification;
    };

    beforeEach(() => {
      VisionServiceClient.prototype.getClassifications = vi
        .fn()
        .mockImplementation((_req, _md, cb) => {
          cb(null, {
            getClassificationsList: () => [classification()],
          });
        });

      VisionServiceClient.prototype.getClassificationsFromCamera = vi
        .fn()
        .mockImplementation((_req, _md, cb) => {
          cb(null, {
            getClassificationsList: () => [classification()],
          });
        });
    });

    it('returns classifications from a camera', async () => {
      classification = vi.fn(() => encodeClassification(testClassification));

      const expected = [testClassification];

      await expect(
        vision.getClassificationsFromCamera('camera', 1)
      ).resolves.toStrictEqual(expected);
    });

    it('returns classifications from an image', async () => {
      classification = vi.fn(() => encodeClassification(testClassification));

      const expected = [testClassification];

      await expect(
        vision.getClassifications(new Uint8Array(), 1, 1, 'image/jpeg', 1)
      ).resolves.toStrictEqual(expected);
    });
  });

  describe('Object Point Cloud Tests', () => {
    const testPCO: PointCloudObject = {
      pointCloud: 'This is a PointCloudObject',
      geometries: undefined,
    };
    let pointCloudObject: Mock<[], PBPointCloudObject>;
    const encodePCO = (pco: PointCloudObject) => {
      const pbPCO = new PBPointCloudObject();
      pbPCO.setPointCloud(pco.pointCloud);
      return pbPCO;
    };

    beforeEach(() => {
      VisionServiceClient.prototype.getObjectPointClouds = vi
        .fn()
        .mockImplementation((_req, _md, cb) => {
          cb(null, {
            getObjectsList: () => [pointCloudObject()],
          });
        });
    });

    it('returns a PointCloudObject from a camera', async () => {
      pointCloudObject = vi.fn(() => encodePCO(testPCO));

      const expected = [testPCO];

      await expect(
        vision.getObjectPointClouds('camera')
      ).resolves.toStrictEqual(expected);
    });
  });
});
