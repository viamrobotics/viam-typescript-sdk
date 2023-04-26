import type { Extra, Orientation, Vector3 } from '../../types';
import type { Sensor } from '../sensor';
import pb from '../../gen/component/movementsensor/v1/movementsensor_pb';

export type MovementSensorPosition = pb.GetPositionResponse.AsObject;
export type MovementSensorProperties = pb.GetPropertiesResponse.AsObject;

/**
 * Represents any sensor that reports information about the robot's direction,
 * position, and/or speed.
 */
export interface MovementSensor extends Sensor {
  /** Get linear velocity across x/y/z axes */
  getLinearVelocity(extra?: Extra): Promise<Vector3>;

  /** Get the angular velocity across x/y/z axes */
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

  /** Get the current position latitude, longitude, and altitude */
  getPosition(extra?: Extra): Promise<MovementSensorPosition>;

  /** Get the properties of this movement sensor */
  getProperties(extra?: Extra): Promise<MovementSensorProperties>;

  /** Get the accuracy of various sensors */
  getAccuracy(extra?: Extra): Promise<Record<string, number>>;

  /** Get linear acceleration across x/y/z axes */
  getLinearAcceleration(extra?: Extra): Promise<Vector3>;
}
