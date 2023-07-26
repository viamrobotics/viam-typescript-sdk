import type { JavaScriptValue } from 'google-protobuf/google/protobuf/struct_pb';

import common from './gen/common/v1/common_pb';

export type StructType = Record<string, JavaScriptValue>;

export interface Options {
  requestLogger?: (req: unknown) => void;
}

export interface Resource {
  /**
   * Send/Receive arbitrary commands to the resource.
   *
   * @param command - The command to execute.
   */
  doCommand: (command: StructType) => Promise<StructType>;
}

// Common Protobuf Types

export type ResourceName = common.ResourceName.AsObject;
export type GeoObstacle = common.GeoObstacle.AsObject;
export type GeoPoint = common.GeoPoint.AsObject;

// Spatial Math
export type Vector3 = common.Vector3.AsObject;
export type Orientation = common.Orientation.AsObject;

// Motion
export type Pose = common.Pose.AsObject;
export type PoseInFrame = common.PoseInFrame.AsObject;
export type Transform = common.Transform.AsObject;
export type WorldState = common.WorldState.AsObject;
export type GeometriesInFrame = common.GeometriesInFrame.AsObject;
export type Geometry = common.Geometry.AsObject;
export type Sphere = common.Sphere.AsObject;
export type RectangularPrism = common.RectangularPrism.AsObject;
export type Capsule = common.Capsule.AsObject;
