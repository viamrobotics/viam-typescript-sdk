import pb from '../../gen/service/vision/v1/vision_pb';
import commonPB from '../../gen/common/v1/common_pb';

export type Detection = pb.Detection.AsObject;
export type Classification = pb.Classification.AsObject;
export type PointCloudObject = commonPB.PointCloudObject.AsObject;
