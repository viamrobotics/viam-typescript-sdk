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
  /** Get linear velocity in mm/s across x/y/z axes */
  getLinearVelocity(extra?: Extra): Promise<Vector3D>;

  /** Get the angular velocity in degrees/s across x/y/z axes */
  getAngularVelocity(extra?: Extra): Promise<Vector3D>;

  /**
   * Get the compass heading, which is a number from 0-359 where 0 is North, 90
   * is East, 180 is South, and 270 is West
   */
  getCompassHeading(extra?: Extra): Promise<number>;

  /**
   * Get the compass heading, which is a number from 0-359 where 0 is North, 90
   * is East, 180 is South, and 270 is West
   */
  getOrientation(extra?: Extra): Promise<Orientation>;

  /** Get the current position latitude, longitude, and altitude (in mm) */
  getPosition(extra?: Extra): Promise<Position>;

  /** Get the movement sensor readings supported by this movement sensor */
  getProperties(extra?: Extra): Promise<Properties>;

  /** Get the accuracy of various sensors in mm */
  getAccuracy(extra?: Extra): Promise<Record<string, number>>;

  /** Get linear acceleration in mm/s/s across x/y/z axes */
  getLinearAcceleration(extra?: Extra): Promise<Vector3D>;
}
