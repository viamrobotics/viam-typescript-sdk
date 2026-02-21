// @vitest-environment happy-dom

import { Struct, Timestamp } from '@bufbuild/protobuf';
import { createClient, createRouterTransport } from '@connectrpc/connect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CameraService } from '../../gen/component/camera/v1/camera_connect';
import {
  GetImagesRequest,
  GetImagesResponse,
  GetPointCloudRequest,
  GetPointCloudResponse,
  GetPropertiesResponse,
  Image,
} from '../../gen/component/camera/v1/camera_pb';
import { RobotClient } from '../../robot';
import { CameraClient } from './client';
vi.mock('../../robot');

let camera: CameraClient;

const testPointCloud = new Uint8Array([1, 2, 3]);
const testSupportsPcd = true;
const testMimeTypes = ['image/jpeg', 'image/png'];
const testImage = new Image({
  sourceName: 'color',
  image: new Uint8Array([4, 5, 6]),
  mimeType: 'image/jpeg',
});
const testTimestamp = Timestamp.fromDate(new Date(2024, 0, 1));

let capturedGetImagesReq: GetImagesRequest | undefined;
let capturedGetPointCloudReq: GetPointCloudRequest | undefined;

describe('CameraClient tests', () => {
  beforeEach(() => {
    capturedGetImagesReq = undefined;
    capturedGetPointCloudReq = undefined;

    const mockTransport = createRouterTransport(({ service }) => {
      service(CameraService, {
        getImages: (req) => {
          capturedGetImagesReq = req;
          return new GetImagesResponse({
            images: [testImage],
            responseMetadata: { capturedAt: testTimestamp },
          });
        },
        getPointCloud: (req) => {
          capturedGetPointCloudReq = req;
          return new GetPointCloudResponse({
            mimeType: 'pointcloud/pcd',
            pointCloud: testPointCloud,
          });
        },
        getProperties: () => {
          return new GetPropertiesResponse({
            supportsPcd: testSupportsPcd,
            mimeTypes: testMimeTypes,
          });
        },
      });
    });

    RobotClient.prototype.createServiceClient = vi
      .fn()
      .mockImplementation(() => createClient(CameraService, mockTransport));

    camera = new CameraClient(new RobotClient('host'), 'test-camera');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getImages', async () => {
    const result = await camera.getImages();
    expect(result.images).toHaveLength(1);
    expect(result.images[0]?.sourceName).toBe('color');
    expect(result.images[0]?.mimeType).toBe('image/jpeg');
    expect(capturedGetImagesReq?.extra).toStrictEqual(Struct.fromJson({}));
  });

  it('getImages passes extra', async () => {
    const extra = { key: 'value' };
    await camera.getImages([], extra);
    expect(capturedGetImagesReq?.extra).toStrictEqual(Struct.fromJson(extra));
  });

  it('getPointCloud', async () => {
    const result = await camera.getPointCloud();
    expect(result).toStrictEqual(testPointCloud);
    expect(capturedGetPointCloudReq?.extra).toStrictEqual(Struct.fromJson({}));
  });

  it('getPointCloud passes extra', async () => {
    const extra = { key: 'value' };
    await camera.getPointCloud(extra);
    expect(capturedGetPointCloudReq?.extra).toStrictEqual(
      Struct.fromJson(extra)
    );
  });

  it('getProperties', async () => {
    const result = await camera.getProperties();
    expect(result.supportsPcd).toBe(testSupportsPcd);
    expect(result.mimeTypes).toStrictEqual(testMimeTypes);
  });
});
