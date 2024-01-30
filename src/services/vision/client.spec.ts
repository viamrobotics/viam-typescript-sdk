// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { VisionServiceClient } from '../../gen/service/vision/v1/vision_pb_service';
import { RobotClient } from '../../robot';
import { VisionClient } from './client';
import { type Detection } from './types';
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
    const testDetections: Detection[] = [
      {
        xMin: 251,
        yMin: 225,
        xMax: 416,
        yMax: 451,
        confidence: 0.995_482_683_181_762_7,
        className: 'face',
      },
    ];

    let detections: Mock<[], Detection[]>;

    beforeEach(() => {
      VisionServiceClient.prototype.getClassifications = vi
        .fn()
        .mockImplementation((_req, _md, cb) => {
          cb(null, {
            getDetectionsList: () => detections(),
          });
        });

      VisionServiceClient.prototype.getClassificationsFromCamera = vi
        .fn()
        .mockImplementation((_req, _md, cb) => {
          cb(null, {
            getDetectionsList: () => detections(),
          });
        });
    });

    it('returns detections from camera', async () => {
      detections = vi.fn(() => testDetections);

      const expected = testDetections;

      await expect(
        vision.getDetectionsFromCamera('camera')
      ).resolves.toStrictEqual(expected);
    });
  });
});
