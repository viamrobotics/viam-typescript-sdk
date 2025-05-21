import { Struct, type JsonValue, type PlainMessage } from '@bufbuild/protobuf';

export { Code, ConnectError } from '@connectrpc/connect';
export { ConnectionClosedError } from './rpc';

export interface Options {
  requestLogger?: (req: unknown) => void;
}

export interface Resource {
  /** The name of the resource. */
  readonly name: string;

  /**
   * Send/Receive arbitrary commands to the resource.
   *
   * @example
   *
   * ```ts
   * import { Struct } from '@viamrobotics/sdk';
   *
   * const result = await resource.doCommand(
   *   Struct.fromJson({
   *     myCommand: { key: 'value' },
   *   })
   * );
   * ```
   *
   * @param command - The command to execute.
   */
  doCommand(command: Struct): Promise<JsonValue>;
}

import * as commonApi from './gen/common/v1/common_pb';

export type Capsule = PlainMessage<commonApi.Capsule>;
export type GeoGeometry = PlainMessage<commonApi.GeoGeometry>;
export type GeoPoint = PlainMessage<commonApi.GeoPoint>;
export type GeometriesInFrame = PlainMessage<commonApi.GeometriesInFrame>;
export type Geometry = PlainMessage<commonApi.Geometry>;
export type Orientation = PlainMessage<commonApi.Orientation>;
export type Pose = PlainMessage<commonApi.Pose>;
export type PoseInFrame = PlainMessage<commonApi.PoseInFrame>;
export type RectangularPrism = PlainMessage<commonApi.RectangularPrism>;
export type ResourceName = PlainMessage<commonApi.ResourceName>;
export type Sphere = PlainMessage<commonApi.Sphere>;
export type Transform = PlainMessage<commonApi.Transform>;
export type Vector3 = PlainMessage<commonApi.Vector3>;
export type WorldState = PlainMessage<commonApi.WorldState>;

export const {
  Capsule,
  GeoGeometry,
  GeoPoint,
  GeometriesInFrame,
  Geometry,
  Orientation,
  Pose,
  PoseInFrame,
  RectangularPrism,
  ResourceName,
  Sphere,
  Transform,
  Vector3,
  WorldState,
} = commonApi;

export const isValidGeoPoint = (value: GeoPoint) => {
  const { latitude, longitude } = value;

  return !(
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  );
};

export {
  Duration,
  Struct,
  Timestamp,
  type JsonValue,
  type PlainMessage,
} from '@bufbuild/protobuf';
