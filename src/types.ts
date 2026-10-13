import { type JsonObject, type JsonValue } from '@bufbuild/protobuf';

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
   * // Plain object (recommended)
   * const result = await resource.doCommand({
   *   myCommand: { key: 'value' },
   * });
   *
   * // Struct (still supported)
   * import { Struct } from '@viamrobotics/sdk';
   *
   * const result = await resource.doCommand(Struct.fromJson({ myCommand: { key: 'value' } }));
   * ```
   *
   * @param command - The command to execute. Accepts either a {@link Struct} or a plain object,
   *   which will be converted automatically.
   */
  doCommand(command: JsonObject | Record<string, JsonValue>): Promise<JsonValue>;

  /** Get the status of the resource. */
  getStatus(): Promise<JsonValue>;
}

import type * as commonApi from './gen/common/v1/common_pb';

export type Capsule = commonApi.Capsule;
export type GeoGeometry = commonApi.GeoGeometry;
export type GeoPoint = commonApi.GeoPoint;
export type GeometriesInFrame = commonApi.GeometriesInFrame;
export type Geometry = commonApi.Geometry;
export type Orientation = commonApi.Orientation;
export type PointCloud = commonApi.PointCloud;
export type Pose = commonApi.Pose;
export type PoseInFrame = commonApi.PoseInFrame;
export type RectangularPrism = commonApi.RectangularPrism;
export type ResourceName = commonApi.ResourceName;
export type Sphere = commonApi.Sphere;
export type Transform = commonApi.Transform;
export type Vector3 = commonApi.Vector3;
export type WorldState = commonApi.WorldState;

export {
  CapsuleSchema,
  GeoGeometrySchema,
  GeoPointSchema,
  GeometriesInFrameSchema,
  GeometrySchema,
  OrientationSchema,
  PointCloudSchema,
  PoseSchema,
  PoseInFrameSchema,
  RectangularPrismSchema,
  ResourceNameSchema,
  SphereSchema,
  TransformSchema,
  Vector3Schema,
  WorldStateSchema,
} from './gen/common/v1/common_pb';

export const isValidGeoPoint = (value: GeoPoint) => {
  const { latitude, longitude } = value;

  return !(
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  );
};

export type { Duration, Struct, Timestamp } from '@bufbuild/protobuf/wkt';
export { DurationSchema, StructSchema, TimestampSchema } from '@bufbuild/protobuf/wkt';
export type { JsonValue } from '@bufbuild/protobuf';
export { create, fromBinary, fromJson, toBinary, toJson, isMessage } from '@bufbuild/protobuf';
export { timestampDate, timestampFromDate } from '@bufbuild/protobuf/wkt';
