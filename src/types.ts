import common from './gen/common/v1/common_pb';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Extra = Map<string, any>;

// eslint-disable-next-line no-warning-comments
// TODO: just alias Vector3.AsObject
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

// eslint-disable-next-line no-warning-comments
// TODO: just alias Orientation.AsObject
export interface Orientation {
  ox: number;
  oy: number;
  oz: number;
  theta: number;
}

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

export type Pose = common.Pose.AsObject;
export type PoseInFrame = common.PoseInFrame.AsObject;
export type Transform = common.Transform.AsObject;
export type WorldState = common.WorldState.AsObject;
