import * as motionApi from '../../gen/service/motion/v1/motion_pb';

export type CollisionSpecification = motionApi.CollisionSpecification;
export type Constraints = motionApi.Constraints;
export type GetPlanResponse = motionApi.GetPlanResponse;
export type LinearConstraint = motionApi.LinearConstraint;
export type PseudolinearConstraint = motionApi.PseudolinearConstraint;
export type ListPlanStatusesResponse = motionApi.ListPlanStatusesResponse;
export type MotionConfiguration = motionApi.MotionConfiguration;
export type ObstacleDetector = motionApi.ObstacleDetector;
export type OrientationConstraint = motionApi.OrientationConstraint;
export type PlanState = motionApi.PlanState;

export const { PlanState } = motionApi;
