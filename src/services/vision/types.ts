import type { JsonObject, MessageInitShape } from '@bufbuild/protobuf';

import * as commonApi from '../../gen/common/v1/common_pb';
import type { Image } from '../../gen/component/camera/v1/camera_pb';
import * as visionApi from '../../gen/service/vision/v1/vision_pb';

export type Classification = MessageInitShape<typeof visionApi.ClassificationSchema>;
export type Detection = MessageInitShape<typeof visionApi.DetectionSchema>;
export type PointCloudObject = MessageInitShape<typeof commonApi.PointCloudObjectSchema>;

export interface Properties {
  /** Whether or not classifactions are supported by the vision service */
  classificationsSupported: boolean;
  /** Whether or not detections are supported by the vision service */
  detectionsSupported: boolean;
  /** Whether or not 3d segmentation is supported by the vision service */
  objectPointCloudsSupported: boolean;
}

export interface CaptureAllOptions {
  returnImage: boolean;
  returnClassifications: boolean;
  returnDetections: boolean;
  returnObjectPointClouds: boolean;
}

export interface CaptureAllResponse {
  image: Image | undefined;
  classifications: Classification[];
  detections: Detection[];
  objectPointClouds: PointCloudObject[];
  extra: JsonObject | undefined;
}
