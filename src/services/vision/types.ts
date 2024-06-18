import pb from '../../gen/service/vision/v1/vision_pb';
import commonPB from '../../gen/common/v1/common_pb';
import cameraPB from '../../gen/component/camera/v1/camera_pb';

export type Detection = pb.Detection.AsObject;
export type Classification = pb.Classification.AsObject;
export type PointCloudObject = commonPB.PointCloudObject.AsObject;

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
  image: cameraPB.Image.AsObject | undefined;
  classifications: Classification[];
  detections: Detection[];
  objectPointClouds: PointCloudObject[];
}
