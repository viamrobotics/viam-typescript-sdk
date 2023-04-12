// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Extra = Map<string, any>;

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Orientation {
  ox: number;
  oy: number;
  oz: number;
  theta: number;
}

export interface Options {
  requestLogger?: (req: unknown) => void;
}

export interface Pose {
  x: number;
  y: number;
  z: number;
  ox: number;
  oy: number;
  oz: number;
  theta: number;
}

export enum PositionType {
  POSITION_TYPE_UNSPECIFIED = 0,
  POSITION_TYPE_TICKS_COUNT = 1,
  POSITION_TYPE_ANGLE_DEGREES = 2,
}
