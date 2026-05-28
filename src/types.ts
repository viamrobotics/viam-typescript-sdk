import type { JsonObject } from '@bufbuild/protobuf';

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
  doCommand(command: JsonObject): Promise<JsonObject>;

  /** Get the status of the resource. */
  getStatus(): Promise<JsonObject>;
}

import * as commonApi from './gen/common/v1/common_pb';
import { DeepOmitProtobufInternals } from './internal/types';

// export type Capsule = MessageInitShape<typeof commonApi.CapsuleSchema>;
// export type GeoGeometry = MessageInitShape<typeof commonApi.GeoGeometrySchema>;
// export type GeoPoint = MessageInitShape<typeof commonApi.GeoPointSchema>;
// export type GeometriesInFrame = MessageInitShape<typeof commonApi.GeometriesInFrameSchema>;
// export type Geometry = MessageInitShape<typeof commonApi.GeometrySchema>;
// export type Orientation = MessageInitShape<typeof commonApi.OrientationSchema>;
// export type PointCloud = MessageInitShape<typeof commonApi.PointCloudSchema>;
// export type Pose = MessageInitShape<typeof commonApi.PoseSchema>;
// export type PoseInFrame = MessageInitShape<typeof commonApi.PoseInFrameSchema>;
// export type RectangularPrism = MessageInitShape<typeof commonApi.RectangularPrismSchema>;
// export type ResourceName = MessageInitShape<typeof commonApi.ResourceNameSchema>;
// export type Sphere = MessageInitShape<typeof commonApi.SphereSchema>;
// export type Transform = MessageInitShape<typeof commonApi.TransformSchema>;
// export type Vector3 = MessageInitShape<typeof commonApi.Vector3Schema>;
// export type WorldState = MessageInitShape<typeof commonApi.WorldStateSchema>;

export type Capsule = DeepOmitProtobufInternals<commonApi.Capsule>;
export type GeoGeometry = DeepOmitProtobufInternals<commonApi.GeoGeometry>;
export type GeoPoint = DeepOmitProtobufInternals<commonApi.GeoPoint>;
export type GeometriesInFrame = DeepOmitProtobufInternals<commonApi.GeometriesInFrame>;
export type Geometry = DeepOmitProtobufInternals<commonApi.Geometry>;
export type Orientation = DeepOmitProtobufInternals<commonApi.Orientation>;
export type PointCloud = DeepOmitProtobufInternals<commonApi.PointCloud>;
export type Pose = DeepOmitProtobufInternals<commonApi.Pose>;
export type PoseInFrame = DeepOmitProtobufInternals<commonApi.PoseInFrame>;
export type RectangularPrism = DeepOmitProtobufInternals<commonApi.RectangularPrism>;
export type ResourceName = DeepOmitProtobufInternals<commonApi.ResourceName>;
export type Sphere = DeepOmitProtobufInternals<commonApi.Sphere>;
export type Transform = DeepOmitProtobufInternals<commonApi.Transform>;
export type Vector3 = DeepOmitProtobufInternals<commonApi.Vector3>;
export type WorldState = DeepOmitProtobufInternals<commonApi.WorldState>;

export const isValidGeoPoint = (value: GeoPoint) => {
  const { latitude, longitude } = value;

  return !(
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  );
};

export type { JsonObject, JsonValue } from '@bufbuild/protobuf';
export type { Duration, Struct } from '@bufbuild/protobuf/wkt';
