import type { JsonObject, MessageInitShape } from '@bufbuild/protobuf';

import * as sensorApi from '../../gen/component/movementsensor/v1/movementsensor_pb';
import type { Orientation, Resource, Vector3 } from '../../types';

export type MovementSensorAccuracy = MessageInitShape<typeof sensorApi.GetAccuracyResponseSchema>;
export type MovementSensorPosition = MessageInitShape<typeof sensorApi.GetPositionResponseSchema>;
export type MovementSensorProperties = MessageInitShape<
  typeof sensorApi.GetPropertiesResponseSchema
>;

/**
 * Represents any sensor that reports information about the robot's direction, position, and/or
 * speed.
 */
export interface MovementSensor extends Resource {
  /**
   * Get linear velocity across x/y/z axes.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(machine, 'my_movement_sensor');
   * const linearVelocity = await movementSensor.getLinearVelocity();
   * ```
   *
   * For more information, see [Movement Sensor
   * API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getlinearvelocity).
   */
  getLinearVelocity(extra?: JsonObject): Promise<Vector3>;

  /**
   * Get the angular velocity across x/y/z axes.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(machine, 'my_movement_sensor');
   * const angularVelocity = await movementSensor.getAngularVelocity();
   * ```
   *
   * For more information, see [Movement Sensor
   * API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getangularvelocity).
   */
  getAngularVelocity(extra?: JsonObject): Promise<Vector3>;

  /**
   * Get the compass heading, which is a number from 0-359 where 0 is North, 90 is East, 180 is
   * South, and 270 is West.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(machine, 'my_movement_sensor');
   * const compassHeading = await movementSensor.getCompassHeading();
   * ```
   *
   * For more information, see [Movement Sensor
   * API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getcompassheading).
   */
  getCompassHeading(extra?: JsonObject): Promise<number>;

  /**
   * Get the current orientation of the sensor.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(machine, 'my_movement_sensor');
   * const orientation = await movementSensor.getOrientation();
   * ```
   *
   * For more information, see [Movement Sensor
   * API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getorientation).
   */
  getOrientation(extra?: JsonObject): Promise<Orientation>;

  /**
   * Get the current position latitude, longitude, and altitude.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(machine, 'my_movement_sensor');
   * const position = await movementSensor.getPosition();
   * ```
   *
   * For more information, see [Movement Sensor
   * API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getposition).
   */
  getPosition(extra?: JsonObject): Promise<sensorApi.GetPositionResponse>;

  /**
   * Get the properties of this movement sensor.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(machine, 'my_movement_sensor');
   * const properties = await movementSensor.getProperties();
   * ```
   *
   * For more information, see [Movement Sensor
   * API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getproperties).
   */
  getProperties(extra?: JsonObject): Promise<sensorApi.GetPropertiesResponse>;

  /**
   * Get the accuracy of various sensors.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(machine, 'my_movement_sensor');
   * const accuracy = await movementSensor.getAccuracy();
   * ```
   *
   * For more information, see [Movement Sensor
   * API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getaccuracy).
   */
  getAccuracy(extra?: JsonObject): Promise<sensorApi.GetAccuracyResponse>;

  /**
   * Get linear acceleration across x/y/z axes.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(machine, 'my_movement_sensor');
   * const linearAcceleration = await movementSensor.getLinearAcceleration();
   * ```
   *
   * For more information, see [Movement Sensor
   * API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getlinearacceleration).
   */
  getLinearAcceleration(extra?: JsonObject): Promise<Vector3>;

  /**
   * Return the readings of a sensor.
   *
   * @example
   *
   * ```ts
   * const movementSensor = new VIAM.MovementSensorClient(machine, 'my_movement_sensor');
   * const readings = await movementSensor.getReadings();
   * ```
   *
   * For more information, see [Movement Sensor
   * API](https://docs.viam.com/dev/reference/apis/components/movement-sensor/#getreadings).
   */
  getReadings(extra?: JsonObject): Promise<JsonObject>;
}
