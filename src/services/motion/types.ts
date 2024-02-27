import pb from '../../gen/service/motion/v1/motion_pb';
import { encodeResourceName } from '../../utils';

export type Constraints = pb.Constraints.AsObject;
export type ObstacleDetector = pb.ObstacleDetector.AsObject;
export type LinearConstraint = pb.LinearConstraint.AsObject;
export type OrientationConstraint = pb.OrientationConstraint.AsObject;
export type CollisionSpecification = pb.CollisionSpecification.AsObject;
export type MotionConfiguration = Partial<pb.MotionConfiguration.AsObject>;
export type GetPlanResponse = pb.GetPlanResponse.AsObject;
export type ListPlanStatusesResponse = pb.ListPlanStatusesResponse.AsObject;
type ValueOf<T> = T[keyof T];
export const { PlanState } = pb;
export type PlanState = ValueOf<typeof pb.PlanState>;

const encodeLinearConstraint = (
  obj: pb.LinearConstraint.AsObject
): pb.LinearConstraint => {
  const result = new pb.LinearConstraint();
  result.setLineToleranceMm(obj.lineToleranceMm);
  result.setOrientationToleranceDegs(obj.orientationToleranceDegs);
  return result;
};

const encodeOrientationConstraint = (
  obj: pb.OrientationConstraint.AsObject
): pb.OrientationConstraint => {
  const result = new pb.OrientationConstraint();
  result.setOrientationToleranceDegs(obj.orientationToleranceDegs);
  return result;
};

const encodeAllowedFrameCollisions = (
  obj: pb.CollisionSpecification.AllowedFrameCollisions.AsObject
): pb.CollisionSpecification.AllowedFrameCollisions => {
  const result = new pb.CollisionSpecification.AllowedFrameCollisions();
  result.setFrame1(obj.frame1);
  result.setFrame2(obj.frame2);
  return result;
};

const encodeCollisionSpecification = (
  obj: pb.CollisionSpecification.AsObject
): pb.CollisionSpecification => {
  const result = new pb.CollisionSpecification();
  result.setAllowsList(
    obj.allowsList.map((x) => encodeAllowedFrameCollisions(x))
  );
  return result;
};

/** Convert a Constraints object to a Protobuf Datatype. */
export const encodeConstraints = (obj: Constraints): pb.Constraints => {
  const result = new pb.Constraints();

  result.setLinearConstraintList(
    obj.linearConstraintList.map((x) => encodeLinearConstraint(x))
  );
  result.setOrientationConstraintList(
    obj.orientationConstraintList.map((x) => encodeOrientationConstraint(x))
  );
  result.setCollisionSpecificationList(
    obj.collisionSpecificationList.map((x) => encodeCollisionSpecification(x))
  );

  return result;
};

export const encodeMotionConfiguration = (
  obj: MotionConfiguration
): pb.MotionConfiguration => {
  const result = new pb.MotionConfiguration();

  const { obstacleDetectorsList = [] } = obj;
  result.setObstacleDetectorsList(
    obstacleDetectorsList.map((od: ObstacleDetector) => {
      const obstacleDetector = new pb.ObstacleDetector();
      if (od.visionService) {
        obstacleDetector.setVisionService(encodeResourceName(od.visionService));
      }
      if (od.camera) {
        obstacleDetector.setCamera(encodeResourceName(od.camera));
      }
      return obstacleDetector;
    })
  );
  if ('positionPollingFrequencyHz' in obj) {
    result.setPositionPollingFrequencyHz(obj.positionPollingFrequencyHz);
  }
  if ('obstaclePollingFrequencyHz' in obj) {
    result.setObstaclePollingFrequencyHz(obj.obstaclePollingFrequencyHz);
  }
  if ('planDeviationM' in obj) {
    result.setPlanDeviationM(obj.planDeviationM);
  }
  if ('linearMPerSec' in obj) {
    result.setLinearMPerSec(obj.linearMPerSec);
  }
  if ('angularDegsPerSec' in obj) {
    result.setAngularDegsPerSec(obj.angularDegsPerSec);
  }

  return result;
};
