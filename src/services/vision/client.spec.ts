// @vitest-environment happy-dom

import { createClient, createRouterTransport } from '@connectrpc/connect';
import { Struct } from '@bufbuild/protobuf';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Pose, PoseInFrame, Transform } from '../../gen/common/v1/common_pb';
import { VisionService } from '../../gen/service/vision/v1/vision_connect';
import {
  type CaptureAllFromCameraRequest,
  CaptureAllFromCameraResponse,
  GetClassificationsFromCameraResponse,
  GetClassificationsResponse,
  GetDetections3DResponse,
  GetDetectionsFromCameraResponse,
  GetDetectionsResponse,
  GetObjectPointCloudsResponse,
  GetPropertiesResponse,
} from '../../gen/service/vision/v1/vision_pb';
import { RobotClient } from '../../robot';
import { VisionClient } from './client';
import { Classification, Detection, Detection3D, PointCloudObject } from './types';
vi.mock('../../robot');
vi.mock('../../gen/service/vision/v1/vision_pb_service');

const visionClientName = 'test-vision';

let vision: VisionClient;

const classification: Classification = new Classification({
  className: 'face',
  confidence: 0.995_482_683_181_762_7,
});

const detection: Detection = new Detection({
  xMin: 251n,
  yMin: 225n,
  xMax: 416n,
  yMax: 451n,
  confidence: 0.995_482_683_181_762_7,
  className: 'face',
});

const pco: PointCloudObject = new PointCloudObject({
  pointCloud: new Uint8Array([1, 2, 3, 4]),
  geometries: undefined,
});

const detection3d: Detection3D = new Detection3D({
  transforms: [
    new Transform({
      referenceFrame: 'vision/mug',
      poseInObserverFrame: new PoseInFrame({
        referenceFrame: 'my_camera',
        pose: new Pose({ x: 412, oZ: 1 }),
      }),
    }),
    new Transform({
      referenceFrame: 'vision/mug/handle',
      poseInObserverFrame: new PoseInFrame({
        referenceFrame: 'vision/mug',
        pose: new Pose({ x: 52, oZ: 1 }),
      }),
    }),
  ],
  classifications: [classification],
});

const extra: Struct = Struct.fromJson({ key: 'value' });

let captureAllRequest: CaptureAllFromCameraRequest | undefined;

describe('VisionClient Tests', () => {
  beforeEach(() => {
    const mockTransport = createRouterTransport(({ service }) => {
      service(VisionService, {
        getDetections: () => new GetDetectionsResponse({ detections: [detection] }),
        getDetectionsFromCamera: () =>
          new GetDetectionsFromCameraResponse({ detections: [detection] }),
        getClassifications: () =>
          new GetClassificationsResponse({ classifications: [classification] }),
        getClassificationsFromCamera: () =>
          new GetClassificationsFromCameraResponse({
            classifications: [classification],
          }),
        getObjectPointClouds: () => new GetObjectPointCloudsResponse({ objects: [pco] }),
        getDetections3D: () => new GetDetections3DResponse({ detections3d: [detection3d] }),
        getProperties: () =>
          new GetPropertiesResponse({
            classificationsSupported: true,
            detectionsSupported: true,
            objectPointCloudsSupported: true,
            defaultCamera: 'my_camera',
            detections3dSupported: true,
          }),
        captureAllFromCamera: (req) => {
          captureAllRequest = req;
          return new CaptureAllFromCameraResponse({
            classifications: [classification],
            detections: [detection],
            objects: [pco],
            detections3d: [detection3d],
            extra,
          });
        },
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

      await expect(vision.getDetectionsFromCamera('camera')).resolves.toStrictEqual(expected);
    });

    it('returns detections from an image', async () => {
      const expected = [detection];

      await expect(
        vision.getDetections(new Uint8Array(), 1, 1, 'image/jpeg'),
      ).resolves.toStrictEqual(expected);
    });
  });

  describe('Classification Tests', () => {
    it('returns classifications from a camera', async () => {
      const expected = [classification];

      await expect(vision.getClassificationsFromCamera('camera', 1)).resolves.toStrictEqual(
        expected,
      );
    });

    it('returns classifications from an image', async () => {
      const expected = [classification];

      await expect(
        vision.getClassifications(new Uint8Array(), 1, 1, 'image/jpeg', 1),
      ).resolves.toStrictEqual(expected);
    });
  });

  describe('Object Point Cloud Tests', () => {
    it('returns a PointCloudObject from a camera', async () => {
      const expected = [pco];

      await expect(vision.getObjectPointClouds('camera')).resolves.toStrictEqual(expected);
    });
  });

  describe('3D Detection Tests', () => {
    it('returns 3D detections from a camera', async () => {
      await expect(vision.getDetections3D('camera')).resolves.toStrictEqual([detection3d]);
    });
  });

  describe('Properties', () => {
    it('returns properties', async () => {
      await expect(vision.getProperties()).resolves.toStrictEqual({
        classificationsSupported: true,
        detectionsSupported: true,
        objectPointCloudsSupported: true,
        defaultCamera: 'my_camera',
        detections3dSupported: true,
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
          returnDetections3d: true,
        }),
      ).resolves.toStrictEqual({
        image: undefined,
        classifications: [classification],
        detections: [detection],
        objectPointClouds: [pco],
        detections3d: [detection3d],
        extra,
      });
      expect(captureAllRequest?.returnDetections3d).toBe(true);
    });

    it('does not request 3D detections unless asked', async () => {
      await vision.captureAllFromCamera('camera', {
        returnImage: false,
        returnClassifications: false,
        returnDetections: false,
        returnObjectPointClouds: false,
      });
      expect(captureAllRequest?.returnDetections3d).toBe(false);
    });
  });
});
