import type { PartialMessage } from '@bufbuild/protobuf';
import * as slamApi from '../../gen/service/slam/v1/slam_pb';

export type SlamPosition = PartialMessage<slamApi.GetPositionResponse>;
export type SlamProperties = PartialMessage<slamApi.GetPropertiesResponse>;

export const {
  GetPositionResponse: SlamPosition,
  GetPropertiesResponse: SlamProperties,
} = slamApi;
