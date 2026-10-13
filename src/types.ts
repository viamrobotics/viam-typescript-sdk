import { type JsonObject, type JsonValue, type MessageInitShape } from '@bufbuild/protobuf';

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

import {
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

export type Capsule = MessageInitShape<typeof CapsuleSchema>;
export type GeoGeometry = MessageInitShape<typeof GeoGeometrySchema>;
export type GeoPoint = MessageInitShape<typeof GeoPointSchema>;
export type GeometriesInFrame = MessageInitShape<typeof GeometriesInFrameSchema>;
export type Geometry = MessageInitShape<typeof GeometrySchema>;
export type Orientation = MessageInitShape<typeof OrientationSchema>;
export type PointCloud = MessageInitShape<typeof PointCloudSchema>;
export type Pose = MessageInitShape<typeof PoseSchema>;
export type PoseInFrame = MessageInitShape<typeof PoseInFrameSchema>;
export type RectangularPrism = MessageInitShape<typeof RectangularPrismSchema>;
export type ResourceName = MessageInitShape<typeof ResourceNameSchema>;
export type Sphere = MessageInitShape<typeof SphereSchema>;
export type Transform = MessageInitShape<typeof TransformSchema>;
export type Vector3 = MessageInitShape<typeof Vector3Schema>;
export type WorldState = MessageInitShape<typeof WorldStateSchema>;

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
};

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
