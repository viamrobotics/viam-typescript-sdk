import { MessageInitShape } from '@bufbuild/protobuf';
import * as slamApi from '../../gen/service/slam/v1/slam_pb';

export type SlamPosition = MessageInitShape<typeof slamApi.GetPositionResponseSchema>;
export type SlamProperties = MessageInitShape<typeof slamApi.GetPropertiesResponseSchema>;
