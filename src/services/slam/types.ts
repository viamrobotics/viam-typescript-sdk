import tspb from 'google-protobuf/google/protobuf/timestamp_pb';
import pb from '../../gen/service/slam/v1/slam_pb';

export type Timestamp = tspb.Timestamp.AsObject;
export type GetPositionResponse = pb.GetPositionResponse.AsObject;
