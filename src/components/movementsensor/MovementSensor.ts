import type { Extra, Orientation, Vector3D } from '../../types';

export interface Position {
  latitude: number;
  longitude: number;
  altitudeMM: number;
}

export interface Properties {
  linearVelocitySupported: boolean;
  angularVelocitySupported: boolean;
  orientationSupported: boolean;
  positionSupported: boolean;
  compassHeadingSupported: boolean;
  linearAccelerationSupported: boolean;
}

export interface MovementSensor {
  getLinearVelocity(extra?: Extra): Promise<Vector3D>;
  getAngularVelocity(extra?: Extra): Promise<Vector3D>;
  getCompassHeading(extra?: Extra): Promise<number>;
  getOrientation(extra?: Extra): Promise<Orientation>;
  getPosition(extra?: Extra): Promise<Position>;
  getProperties(extra?: Extra): Promise<Properties>;
  getAccuracy(extra?: Extra): Promise<Record<string, number>>;
  getLinearAcceleration(extra?: Extra): Promise<Vector3D>;
}
