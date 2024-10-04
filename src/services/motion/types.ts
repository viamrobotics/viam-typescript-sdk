import type { PlainMessage } from '@bufbuild/protobuf';
import * as motionApi from '../../gen/service/motion/v1/motion_pb';

export type CollisionSpecification =
  PlainMessage<motionApi.CollisionSpecification>;
export type Constraints = PlainMessage<motionApi.Constraints>;
export type GetPlanResponse = motionApi.GetPlanResponse;
export type LinearConstraint = PlainMessage<motionApi.LinearConstraint>;
export type ListPlanStatusesResponse = motionApi.ListPlanStatusesResponse;
export type MotionConfiguration = PlainMessage<motionApi.MotionConfiguration>;
export type ObstacleDetector = PlainMessage<motionApi.ObstacleDetector>;
export type OrientationConstraint =
  PlainMessage<motionApi.OrientationConstraint>;
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
