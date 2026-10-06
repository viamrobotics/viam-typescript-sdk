import type { Image } from '../../gen/component/camera/v1/camera_pb';

import type { PlainMessage, Struct } from '@bufbuild/protobuf';
import * as commonApi from '../../gen/common/v1/common_pb';
import * as visionApi from '../../gen/service/vision/v1/vision_pb';

export type Classification = PlainMessage<visionApi.Classification>;
export type Detection = PlainMessage<visionApi.Detection>;
export type Detection3D = PlainMessage<visionApi.Detection3D>;

export const { Classification, Detection, Detection3D } = visionApi;

export type PointCloudObject = PlainMessage<commonApi.PointCloudObject>;

export const { PointCloudObject } = commonApi;

export interface Properties {
  /** Whether or not classifactions are supported by the vision service */
  classificationsSupported: boolean;
  /** Whether or not detections are supported by the vision service */
  detectionsSupported: boolean;
  /** Whether or not 3d segmentation is supported by the vision service */
  objectPointCloudsSupported: boolean;
  /** The default camera used for *FromCamera and GetObjectPointClouds calls */
  defaultCamera?: string;
  /** Whether or not GetDetections3D is supported by the vision service */
  detections3dSupported: boolean;
}

export interface CaptureAllOptions {
  returnImage: boolean;
  returnClassifications: boolean;
  returnDetections: boolean;
  returnObjectPointClouds: boolean;
  /** Whether or not to include 3D detections in the response. Defaults to false. */
  returnDetections3d?: boolean;
}

export interface CaptureAllResponse {
  image: Image | undefined;
  classifications: Classification[];
  detections: Detection[];
  objectPointClouds: PointCloudObject[];
  detections3d: Detection3D[];
  extra: Struct | undefined;
}
