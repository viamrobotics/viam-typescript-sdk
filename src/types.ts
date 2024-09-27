import type { JsonValue, PartialMessage, Struct } from '@bufbuild/protobuf';

export interface Options {
  requestLogger?: (req: unknown) => void;
}

export interface Resource {
  /**
   * Send/Receive arbitrary commands to the resource.
   *
   * @param command - The command to execute.
   */
  doCommand(command: Struct): Promise<JsonValue>;
}

import * as commonApi from './gen/common/v1/common_pb';

export type Capsule = PartialMessage<commonApi.Capsule>;
export type GeoGeometry = PartialMessage<commonApi.GeoGeometry>;
export type GeoPoint = PartialMessage<commonApi.GeoPoint>;
export type GeometriesInFrame = PartialMessage<commonApi.GeometriesInFrame>;
export type Geometry = PartialMessage<commonApi.Geometry>;
export type Orientation = PartialMessage<commonApi.Orientation>;
export type Pose = PartialMessage<commonApi.Pose>;
export type PoseInFrame = PartialMessage<commonApi.PoseInFrame>;
export type RectangularPrism = PartialMessage<commonApi.RectangularPrism>;
export type ResourceName = PartialMessage<commonApi.ResourceName>;
export type Sphere = PartialMessage<commonApi.Sphere>;
export type Transform = PartialMessage<commonApi.Transform>;
export type Vector3 = PartialMessage<commonApi.Vector3>;
export type WorldState = PartialMessage<commonApi.WorldState>;

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
