import pb from '../../gen/service/motion/v1/motion_pb';

export type MotionConstraints = pb.Constraints.AsObject;

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
  result.setAllowsList(obj.allowsList.map(encodeAllowedFrameCollisions));
  return result;
};

/** Convert a Constraints object to a Protobuf Datatype. */
export const encodeConstraints = (obj: MotionConstraints): pb.Constraints => {
  const result = new pb.Constraints();

  result.setLinearConstraintList(
    obj.linearConstraintList.map(encodeLinearConstraint)
  );
  result.setOrientationConstraintList(
    obj.orientationConstraintList.map(encodeOrientationConstraint)
  );
  result.setCollisionSpecificationList(
    obj.collisionSpecificationList.map(encodeCollisionSpecification)
  );

  return result;
};
