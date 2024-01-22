import { grpc } from '@improbable-eng/grpc-web';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import type { ServiceError } from './gen/robot/v1/robot_pb_service';
import common from './gen/common/v1/common_pb';
import type { Options, StructType, Vector3 } from './types';

type Callback<T> = (error: ServiceError | null, response: T | null) => void;

type ServiceFunc<Req, Resp> = (
  request: Req,
  metadata: grpc.Metadata,
  callback: Callback<Resp>
) => void;

export const promisify = async <Req, Resp>(
  func: ServiceFunc<Req, Resp>,
  request: Req
): Promise<Resp> => {
  return new Promise((resolve, reject) => {
    func(request, new grpc.Metadata(), (error, response) => {
      if (error) {
        reject(error);
        return;
      }
      if (!response) {
        reject(new Error('no response'));
        return;
      }
      resolve(response);
    });
  });
};

interface DoCommandClient {
  doCommand: ServiceFunc<common.DoCommandRequest, common.DoCommandResponse>;
}

/** Send/Receive an arbitrary command using a resource client */
export const doCommandFromClient = async function doCommandFromClient(
  client: DoCommandClient,
  name: string,
  command: StructType,
  options: Options = {}
): Promise<StructType> {
  const request = new common.DoCommandRequest();
  request.setName(name);
  request.setCommand(Struct.fromJavaScript(command));

  options.requestLogger?.(request);

  const response = await promisify<
    common.DoCommandRequest,
    common.DoCommandResponse
  >(client.doCommand.bind(client), request);
  const result = response.getResult()?.toJavaScript();
  if (!result) {
    return {};
  }
  return result;
};

/** Convert a 3D Vector POJO to a Protobuf Datatype */
export const encodeVector3 = (value: Vector3): common.Vector3 => {
  const proto = new common.Vector3();

  proto.setX(value.x);
  proto.setY(value.y);
  proto.setZ(value.z);

  return proto;
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

  if (obj.label) {
    result.setLabel(obj.label);
  }

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
      rectPrism.setDimsMm(encodeVector3(obj.box.dimsMm));
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
  result.setGeometriesList(obj.geometriesList.map((x) => encodeGeometry(x)));
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

  result.setObstaclesList(
    obj.obstaclesList.map((x) => encodeGeometriesInFrame(x))
  );
  result.setTransformsList(obj.transformsList.map((x) => encodeTransform(x)));

  return result;
};

/** Convert a GeoPoint object to a Protobuf Datatype */
export const encodeGeoPoint = (
  obj: common.GeoPoint.AsObject
): common.GeoPoint => {
  const result = new common.GeoPoint();

  result.setLatitude(obj.latitude);
  result.setLongitude(obj.longitude);

  return result;
};

/** Convert a GeoObstacle object to a Protobuf Datatype */
export const encodeGeoObstacle = (
  obj: common.GeoObstacle.AsObject
): common.GeoObstacle => {
  const result = new common.GeoObstacle();

  if (obj.location) {
    result.setLocation(encodeGeoPoint(obj.location));
  }
  result.setGeometriesList(obj.geometriesList.map((x) => encodeGeometry(x)));

  return result;
};
