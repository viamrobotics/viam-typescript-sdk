import type { Resource, Orientation, StructType, Vector3 } from '../../types';
import pb from '../../gen/component/movementsensor/v1/movementsensor_pb';

export type MovementSensorPosition = pb.GetPositionResponse.AsObject;
export type MovementSensorProperties = pb.GetPropertiesResponse.AsObject;
export type MovementSensorAccuracy = pb.GetAccuracyResponse.AsObject;

/**
 * Represents any sensor that reports information about the robot's direction,
 * position, and/or speed.
 */
export interface MovementSensor extends Resource {
  /** Get linear velocity across x/y/z axes */
  getLinearVelocity(extra?: StructType): Promise<Vector3>;

  /** Get the angular velocity across x/y/z axes */
  getAngularVelocity(extra?: StructType): Promise<Vector3>;

  /**
   * Get the compass heading, which is a number from 0-359 where 0 is North, 90
   * is East, 180 is South, and 270 is West
   */
  getCompassHeading(extra?: StructType): Promise<number>;

  /**
   * Get the compass heading, which is a number from 0-359 where 0 is North, 90
   * is East, 180 is South, and 270 is West
   */
  getOrientation(extra?: StructType): Promise<Orientation>;

  /** Get the current position latitude, longitude, and altitude */
  getPosition(extra?: StructType): Promise<MovementSensorPosition>;

  /** Get the properties of this movement sensor */
  getProperties(extra?: StructType): Promise<MovementSensorProperties>;

  /** Get the accuracy of various sensors */
  getAccuracy(extra?: StructType): Promise<MovementSensorAccuracy>;

  /** Get linear acceleration across x/y/z axes */
  getLinearAcceleration(extra?: StructType): Promise<Vector3>;

  /** Return the readings of a sensor. */
  getReadings(extra?: StructType): Promise<Record<string, unknown>>;
}
