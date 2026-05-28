import { MessageInitShape } from '@bufbuild/protobuf';
import * as motionApi from '../../gen/service/motion/v1/motion_pb';

export type CollisionSpecification = MessageInitShape<
  typeof motionApi.CollisionSpecificationSchema
>;
export type Constraints = MessageInitShape<typeof motionApi.ConstraintsSchema>;
export type GetPlanResponse = MessageInitShape<typeof motionApi.GetPlanResponseSchema>;
export type LinearConstraint = MessageInitShape<typeof motionApi.LinearConstraintSchema>;
export type PseudolinearConstraint = MessageInitShape<
  typeof motionApi.PseudolinearConstraintSchema
>;
export type ListPlanStatusesResponse = MessageInitShape<
  typeof motionApi.ListPlanStatusesResponseSchema
>;
export type MotionConfiguration = MessageInitShape<typeof motionApi.MotionConfigurationSchema>;
export type ObstacleDetector = MessageInitShape<typeof motionApi.ObstacleDetectorSchema>;
export type OrientationConstraint = MessageInitShape<typeof motionApi.OrientationConstraintSchema>;
export type PlanState = motionApi.PlanState;

export const { PlanState } = motionApi;
