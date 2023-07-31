import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { GetPositionResponse } from '../../gen/service/slam/v1/slam_pb';
import type { Resource } from '../../types';

export interface Slam extends Resource {
  getPosition: () => Promise<GetPositionResponse>;
  getPointCloudMap: () => Promise<string | Uint8Array>;
  getInternalState: () => Promise<string | Uint8Array>;
  getLatestMapInfo: () => Promise<Timestamp>;
}
