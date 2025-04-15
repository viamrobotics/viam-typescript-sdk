import type { Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';

/** Represents a physical servo. */
export interface Servo extends Resource {
  /**
   * Move the servo by a given angle in degrees.
   *
   * @example
   *
   * ```ts
   * const servo = new VIAM.ServoClient(machine, 'my_servo');
   *
   * // Move the servo from its origin to the desired angle of 10 degrees
   * await servo.move(10);
   *
   * // Move the servo from its origin to the desired angle of 90 degrees
   * await servo.move(90);
   * ```
   *
   * For more information, see [Servo
   * API](https://docs.viam.com/dev/reference/apis/components/servo/#move).
   */
  move(angleDeg: number, extra?: Struct): Promise<void>;

  /**
   * Return the current set angle of the servo in degrees.
   *
   * @example
   *
   * ```ts
   * const servo = new VIAM.ServoClient(machine, 'my_servo');
   *
   * // Get the current set angle of the servo
   * const pos = await servo.getPosition();
   * ```
   *
   * For more information, see [Servo
   * API](https://docs.viam.com/dev/reference/apis/components/servo/#getposition).
   */
  getPosition(extra?: Struct): Promise<number>;

  /**
   * Stop the servo.
   *
   * @example
   *
   * ```ts
   * const servo = new VIAM.ServoClient(machine, 'my_servo');
   *
   * // Move the servo from its origin to the desired angle of 10 degrees
   * await servo.move(10);
   *
   * // Stop the servo. It is assumed that the servo stops moving immediately
   * await servo.stop();
   * ```
   *
   * For more information, see [Servo
   * API](https://docs.viam.com/dev/reference/apis/components/servo/#stop).
   */
  stop(extra?: Struct): Promise<void>;

  /**
   * Return true if the servo is in motion.
   *
   * @example
   *
   * ```ts
   * const servo = new VIAM.ServoClient(machine, 'my_servo');
   *
   * const moving = await servo.isMoving();
   * console.log('Moving:', moving);
   * ```
   *
   * For more information, see [Servo
   * API](https://docs.viam.com/dev/reference/apis/components/servo/#ismoving).
   */
  isMoving(): Promise<boolean>;
}
