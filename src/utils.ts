import type { ServiceError } from './gen/robot/v1/robot_pb_service.esm';
import { grpc } from '@improbable-eng/grpc-web';

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
