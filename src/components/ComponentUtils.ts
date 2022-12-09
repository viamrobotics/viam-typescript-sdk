import { grpc } from "@improbable-eng/grpc-web";
import type { ServiceError } from "../main";


export const rcLogConditionally = (req: unknown) => {
  if (window) {
    console.log('gRPC call:', req);
  }
};

export const Promisify = function <Req, Resp> (
  func: ServiceFunc<Req, Resp>,
  request: Req
): Promise<Resp> {
  return new Promise((resolve, reject) => {
    func(request, new grpc.Metadata(), (error, response) => {
      if (error) {
        return reject(error)
      }
      if (!response) {
        // TODO: improve error message?
        return reject(new Error('no response'))
      }
      return resolve(response)
    })
  })
}

export type ServiceFunc<Req, Resp> = (
  request: Req,
  metadata: grpc.Metadata,
  callback: Callback<Resp>
) => void;

export type Callback<T> = (error: ServiceError | null, response: T | null) => void;