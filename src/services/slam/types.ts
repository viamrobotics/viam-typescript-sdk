import * as slamApi from '../../gen/service/slam/v1/slam_pb';

export type SlamPosition = slamApi.GetPositionResponse;
export type SlamProperties = slamApi.GetPropertiesResponse;

export const {
  GetPositionResponse: SlamPosition,
  GetPropertiesResponse: SlamProperties,
} = slamApi;
