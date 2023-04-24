import type { Extra, Orientation, Vector3 } from '../../types';
import type { Sensor } from '../sensor';

export interface Position {
  latitude: number;
  longitude: number;
  altitudeMM: number;
}

/** The readings supported by this movement sensor */
export interface Properties {
  linearVelocitySupported: boolean;
  angularVelocitySupported: boolean;
  orientationSupported: boolean;
  positionSupported: boolean;
  compassHeadingSupported: boolean;
  linearAccelerationSupported: boolean;
}

/**
 * Represents any sensor that reports information about the robot's direction,
 * position, and/or speed.
 */
export interface MovementSensor extends Sensor {
  /** Get linear velocity in mm/s across x/y/z axes */
  getLinearVelocity(extra?: Extra): Promise<Vector3>;

  /** Get the angular velocity in degrees/s across x/y/z axes */
  getAngularVelocity(extra?: Extra): Promise<Vector3>;

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

  /** Get the properties of this movement sensor */
  getProperties(extra?: Extra): Promise<Properties>;

  /** Get the accuracy of various sensors in mm */
  getAccuracy(extra?: Extra): Promise<Record<string, number>>;

  /** Get linear acceleration in mm/s/s across x/y/z axes */
  getLinearAcceleration(extra?: Extra): Promise<Vector3>;
}
