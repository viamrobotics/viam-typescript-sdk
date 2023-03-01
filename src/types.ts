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
