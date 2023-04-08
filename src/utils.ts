import type { ServiceError } from './gen/robot/v1/robot_pb_service';
import { grpc } from '@improbable-eng/grpc-web';
import common from './gen/common/v1/common_pb';
import type { Vector3D } from './types';

type Callback<T> = (error: ServiceError | null, response: T | null) => void;

type ServiceFunc<Req, Resp> = (
  request: Req,
  metadata: grpc.Metadata,
  callback: Callback<Resp>
) => void;

export const promisify = function <Req, Resp>(
  func: ServiceFunc<Req, Resp>,
  request: Req
): Promise<Resp> {
  return new Promise((resolve, reject) => {
    func(request, new grpc.Metadata(), (error, response) => {
      if (error) {
        return reject(error);
      }
      if (!response) {
        return reject(new Error('no response'));
      }
      return resolve(response);
    });
  });
};

/** Convert a 3D Vector POJO to a Protobuf Datatype */
export const encodeVector3D = function (value: Vector3D): common.Vector3 {
  const proto = new common.Vector3();

  proto.setX(value.x);
  proto.setY(value.y);
  proto.setZ(value.z);

  return proto;
};

/** Convert a 3D Vector Protobuf Datatype to a POJO */
export const decodeVector3D = function (proto: common.Vector3): Vector3D {
  return {
    x: proto.getX(),
    y: proto.getY(),
    z: proto.getZ(),
  };
};

/** Convert a Pose object to a Protobuf Datatype. */
export const encodePose = (obj: common.Pose.AsObject): common.Pose => {
  const result = new common.Pose();

  result.setX(obj.x);
  result.setY(obj.y);
  result.setZ(obj.z);
  result.setOX(obj.oX);
  result.setOY(obj.oY);
  result.setOZ(obj.oZ);
  result.setTheta(obj.theta);

  return result;
};

/** Convert a PoseInFrame object to a Protobuf Datatype. */
export const encodePoseInFrame = (
  obj: common.PoseInFrame.AsObject
): common.PoseInFrame => {
  if (!obj.pose) {
    throw new Error('no pose');
  }

  const result = new common.PoseInFrame();

  result.setPose(encodePose(obj.pose));
  result.setReferenceFrame(obj.referenceFrame);

  return result;
};

/** Convert a ResourceName object to a Protobuf Datatype. */
export const encodeResourceName = (
  obj: common.ResourceName.AsObject
): common.ResourceName => {
  const result = new common.ResourceName();

  result.setNamespace(obj.namespace);
  result.setType(obj.type);
  result.setSubtype(obj.subtype);
  result.setName(obj.name);

  return result;
};

const encodeGeometry = (obj: common.Geometry.AsObject): common.Geometry => {
  const result = new common.Geometry();

  if (obj.center !== undefined) {
    result.setCenter(encodePose(obj.center));
  }

  if (obj.sphere !== undefined) {
    const sphere = new common.Sphere();
    sphere.setRadiusMm(obj.sphere.radiusMm);
    result.setSphere(sphere);
  }

  if (obj.box !== undefined) {
    const rectPrism = new common.RectangularPrism();
    if (obj.box.dimsMm !== undefined) {
      rectPrism.setDimsMm(encodeVector3D(obj.box.dimsMm));
    }
    result.setBox(rectPrism);
  }

  if (obj.capsule !== undefined) {
    const capsule = new common.Capsule();
    capsule.setLengthMm(obj.capsule.lengthMm);
    capsule.setRadiusMm(obj.capsule.radiusMm);
    result.setCapsule(capsule);
  }

  return result;
};

const encodeGeometriesInFrame = (
  obj: common.GeometriesInFrame.AsObject
): common.GeometriesInFrame => {
  const result = new common.GeometriesInFrame();
  result.setReferenceFrame(obj.referenceFrame);
  result.setGeometriesList(obj.geometriesList.map(encodeGeometry));
  return result;
};

/** Convert a Transform object to a Protobuf Datatype. */
export const encodeTransform = (
  obj: common.Transform.AsObject
): common.Transform => {
  const result = new common.Transform();
  result.setReferenceFrame(obj.referenceFrame);
  if (obj.physicalObject !== undefined) {
    result.setPhysicalObject(encodeGeometry(obj.physicalObject));
  }
  if (obj.poseInObserverFrame !== undefined) {
    result.setPoseInObserverFrame(encodePoseInFrame(obj.poseInObserverFrame));
  }
  return result;
};

/** Convert a WorldState object to a Protobuf Datatype. */
export const encodeWorldState = (
  obj: common.WorldState.AsObject
): common.WorldState => {
  const result = new common.WorldState();

  result.setObstaclesList(obj.obstaclesList.map(encodeGeometriesInFrame));
  result.setTransformsList(obj.transformsList.map(encodeTransform));

  return result;
};
