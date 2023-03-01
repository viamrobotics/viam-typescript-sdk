import type { ServiceError } from './gen/robot/v1/robot_pb_service.esm';
import { grpc } from '@improbable-eng/grpc-web';
import pb from './gen/common/v1/common_pb.esm';
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
export const encodeVector3D = function (value: Vector3D): pb.Vector3 {
  const proto = new pb.Vector3();

  proto.setX(value.x);
  proto.setY(value.y);
  proto.setZ(value.z);

  return proto;
};

/** Convert a 3D Vector Protobuf Datatype to a POJO */
export const decodeVector3D = function (proto: pb.Vector3): Vector3D {
  return {
    x: proto.getX(),
    y: proto.getY(),
    z: proto.getZ(),
  };
};
