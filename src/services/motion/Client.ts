import type { RobotClient } from '../../robot';
import { MotionServiceClient } from '../../gen/service/motion/v1/motion_pb_service';
import type { Options } from '../../types';
import {
  promisify,
  encodeResourceName,
  encodePose,
  encodePoseInFrame,
  encodeWorldState,
  encodeTransform,
} from '../../utils';
import type { Motion } from './Motion';

import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import common from '../../gen/common/v1/common_pb';
import pb from '../../gen/service/motion/v1/motion_pb';

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
const encodeConstraints = (obj: pb.Constraints.AsObject): pb.Constraints => {
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

export class MotionClient implements Motion {
  private client: MotionServiceClient;
  private readonly name: string;
  private readonly options: Options;

  constructor(client: RobotClient, name: string, options: Options = {}) {
    this.client = client.createServiceClient(MotionServiceClient);
    this.name = name;
    this.options = options;
  }

  private get service() {
    return this.client;
  }

  async move(
    destination: common.PoseInFrame.AsObject,
    componentName: common.ResourceName.AsObject,
    worldState?: common.WorldState.AsObject,
    constraints?: pb.Constraints.AsObject,
    extra = {}
  ) {
    const service = this.service;

    const request = new pb.MoveRequest();
    request.setName(this.name);
    request.setDestination(encodePoseInFrame(destination));
    request.setComponentName(encodeResourceName(componentName));
    if (worldState !== undefined) {
      request.setWorldState(encodeWorldState(worldState));
    }
    if (constraints !== undefined) {
      request.setConstraints(encodeConstraints(constraints));
    }
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<pb.MoveRequest, pb.MoveResponse>(
      service.move.bind(service),
      request
    );

    return response.getSuccess();
  }

  async moveOnMap(
    destination: common.Pose.AsObject,
    componentName: common.ResourceName.AsObject,
    slamServiceName: common.ResourceName.AsObject,
    extra = {}
  ) {
    const service = this.service;

    const request = new pb.MoveOnMapRequest();
    request.setName(this.name);
    request.setDestination(encodePose(destination));
    request.setComponentName(encodeResourceName(componentName));
    request.setSlamServiceName(encodeResourceName(slamServiceName));
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<pb.MoveOnMapRequest, pb.MoveOnMapResponse>(
      service.moveOnMap.bind(service),
      request
    );

    return response.getSuccess();
  }

  async moveSingleComponent(
    destination: common.PoseInFrame.AsObject,
    componentName: common.ResourceName.AsObject,
    worldState?: common.WorldState.AsObject,
    extra = {}
  ) {
    const service = this.service;

    const request = new pb.MoveSingleComponentRequest();
    request.setName(this.name);
    request.setDestination(encodePoseInFrame(destination));
    request.setComponentName(encodeResourceName(componentName));
    if (worldState !== undefined) {
      request.setWorldState(encodeWorldState(worldState));
    }
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.MoveSingleComponentRequest,
      pb.MoveSingleComponentResponse
    >(service.moveSingleComponent.bind(service), request);

    return response.getSuccess();
  }

  async getPose(
    componentName: common.ResourceName.AsObject,
    destinationFrame: string,
    supplementalTransforms: common.Transform.AsObject[],
    extra = {}
  ) {
    const service = this.service;

    const request = new pb.GetPoseRequest();
    request.setName(this.name);
    request.setComponentName(encodeResourceName(componentName));
    request.setDestinationFrame(destinationFrame);
    request.setSupplementalTransformsList(
      supplementalTransforms.map(encodeTransform)
    );
    request.setExtra(Struct.fromJavaScript(extra));

    this.options.requestLogger?.(request);

    const response = await promisify<pb.GetPoseRequest, pb.GetPoseResponse>(
      service.getPose.bind(service),
      request
    );

    const result = response.getPose();

    if (!result) {
      throw new Error('no pose');
    }

    return result.toObject();
  }
}
