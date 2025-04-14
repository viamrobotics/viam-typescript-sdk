import type { JsonValue, Struct } from '@bufbuild/protobuf';
import type { Orientation, Resource, Vector3 } from '../../types';

import * as sensorApi from '../../gen/component/movementsensor/v1/movementsensor_pb';

export type MovementSensorAccuracy = sensorApi.GetAccuracyResponse;
export type MovementSensorPosition = sensorApi.GetPositionResponse;
export type MovementSensorProperties = sensorApi.GetPropertiesResponse;

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
  /**
   * Get linear velocity across x/y/z axes.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(
   *   machine,
   *   'my_movement_sensor'
   * );
   * const linearVelocity = await movementSensor.getLinearVelocity();
   * ```
   *
   * For more information, see [Movement Sensor API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getlinearvelocity).
   */
  getLinearVelocity(extra?: Struct): Promise<Vector3>;

  /**
   * Get the angular velocity across x/y/z axes.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(
   *   machine,
   *   'my_movement_sensor'
   * );
   * const angularVelocity = await movementSensor.getAngularVelocity();
   * ```
   *
   * For more information, see [Movement Sensor API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getangularvelocity).
   */
  getAngularVelocity(extra?: Struct): Promise<Vector3>;

  /**
   * Get the compass heading, which is a number from 0-359 where 0 is North, 90
   * is East, 180 is South, and 270 is West.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(
   *   machine,
   *   'my_movement_sensor'
   * );
   * const compassHeading = await movementSensor.getCompassHeading();
   * ```
   *
   * For more information, see [Movement Sensor API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getcompassheading).
   */
  getCompassHeading(extra?: Struct): Promise<number>;

  /**
   * Get the current orientation of the sensor.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(
   *   machine,
   *   'my_movement_sensor'
   * );
   * const orientation = await movementSensor.getOrientation();
   * ```
   *
   * For more information, see [Movement Sensor API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getorientation).
   */
  getOrientation(extra?: Struct): Promise<Orientation>;

  /**
   * Get the current position latitude, longitude, and altitude.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(
   *   machine,
   *   'my_movement_sensor'
   * );
   * const position = await movementSensor.getPosition();
   * ```
   *
   * For more information, see [Movement Sensor API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getposition).
   */
  getPosition(extra?: Struct): Promise<MovementSensorPosition>;

  /**
   * Get the properties of this movement sensor.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(
   *   machine,
   *   'my_movement_sensor'
   * );
   * const properties = await movementSensor.getProperties();
   * ```
   *
   * For more information, see [Movement Sensor API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getproperties).
   */
  getProperties(extra?: Struct): Promise<MovementSensorProperties>;

  /**
   * Get the accuracy of various sensors.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(
   *   machine,
   *   'my_movement_sensor'
   * );
   * const accuracy = await movementSensor.getAccuracy();
   * ```
   *
   * For more information, see [Movement Sensor API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getaccuracy).
   */
  getAccuracy(extra?: Struct): Promise<MovementSensorAccuracy>;

  /**
   * Get linear acceleration across x/y/z axes.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(
   *   machine,
   *   'my_movement_sensor'
   * );
   * const linearAcceleration =
   *   await movementSensor.getLinearAcceleration();
   * ```
   *
   * For more information, see [Movement Sensor API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getlinearacceleration).
   */
  getLinearAcceleration(extra?: Struct): Promise<Vector3>;

  /**
   * Return the readings of a sensor.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(
   *   machine,
   *   'my_movement_sensor'
   * );
   * const readings = await movementSensor.getReadings();
   * ```
   *
   * For more information, see [Movement Sensor API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getreadings).
   */
  getReadings(extra?: Struct): Promise<Record<string, JsonValue>>;
}
