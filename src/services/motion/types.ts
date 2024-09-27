import type { PartialMessage } from '@bufbuild/protobuf';

import * as motionApi from '../../gen/service/motion/v1/motion_pb';

export type CollisionSpecification =
  PartialMessage<motionApi.CollisionSpecification>;
export type Constraints = PartialMessage<motionApi.Constraints>;
export type GetPlanResponse = PartialMessage<motionApi.GetPlanResponse>;
export type LinearConstraint = PartialMessage<motionApi.LinearConstraint>;
export type ListPlanStatusesResponse =
  PartialMessage<motionApi.ListPlanStatusesResponse>;
export type MotionConfiguration = PartialMessage<motionApi.MotionConfiguration>;
export type ObstacleDetector = PartialMessage<motionApi.ObstacleDetector>;
export type OrientationConstraint =
  PartialMessage<motionApi.OrientationConstraint>;
export type PlanState = motionApi.PlanState;

export const {
  CollisionSpecification,
  Constraints,
  GetPlanResponse,
  LinearConstraint,
  ListPlanStatusesResponse,
  MotionConfiguration,
  ObstacleDetector,
  OrientationConstraint,
  PlanState,
} = motionApi;
