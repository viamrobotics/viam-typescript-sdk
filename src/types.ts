import common from './gen/common/v1/common_pb';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Extra = Map<string, any>;

export interface Options {
  requestLogger?: (req: unknown) => void;
}

export enum PositionType {
  POSITION_TYPE_UNSPECIFIED = 0,
  POSITION_TYPE_TICKS_COUNT = 1,
  POSITION_TYPE_ANGLE_DEGREES = 2,
}

// Common Protobuf Types

export type ResourceName = common.ResourceName.AsObject;

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
