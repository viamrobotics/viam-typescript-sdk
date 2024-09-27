import type { JsonValue, PartialMessage, Struct } from '@bufbuild/protobuf';
import type { Orientation, Resource, Vector3 } from '../../types';

import * as sensorApi from '../../gen/component/movementsensor/v1/movementsensor_pb';

export type MovementSensorAccuracy =
  PartialMessage<sensorApi.GetAccuracyResponse>;
export type MovementSensorPosition =
  PartialMessage<sensorApi.GetPositionResponse>;
export type MovementSensorProperties =
  PartialMessage<sensorApi.GetPropertiesResponse>;

export const {
  GetAccuracyResponse: MovementSensorAccuracy,
  GetPositionResponse: MovementSensorPosition,
  GetPropertiesResponse: MovementSensorProperties,
} = sensorApi;

/**
 * Represents any sensor that reports information about the robot's direction,
 * position, and/or speed.
 */
export interface MovementSensor extends Resource {
  /** Get linear velocity across x/y/z axes */
  getLinearVelocity(extra?: Struct): Promise<Vector3>;

  /** Get the angular velocity across x/y/z axes */
  getAngularVelocity(extra?: Struct): Promise<Vector3>;

  /**
   * Get the compass heading, which is a number from 0-359 where 0 is North, 90
   * is East, 180 is South, and 270 is West
   */
  getCompassHeading(extra?: Struct): Promise<number>;

  /**
   * Get the compass heading, which is a number from 0-359 where 0 is North, 90
   * is East, 180 is South, and 270 is West
   */
  getOrientation(extra?: Struct): Promise<Orientation>;

  /** Get the current position latitude, longitude, and altitude */
  getPosition(extra?: Struct): Promise<MovementSensorPosition>;

  /** Get the properties of this movement sensor */
  getProperties(extra?: Struct): Promise<MovementSensorProperties>;

  /** Get the accuracy of various sensors */
  getAccuracy(extra?: Struct): Promise<MovementSensorAccuracy>;

  /** Get linear acceleration across x/y/z axes */
  getLinearAcceleration(extra?: Struct): Promise<Vector3>;

  /** Return the readings of a sensor. */
  getReadings(extra?: Struct): Promise<Record<string, JsonValue>>;
}
