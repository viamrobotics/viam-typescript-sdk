import { type Duration as PBDuration } from 'google-protobuf/google/protobuf/duration_pb';
import pb from '../../gen/component/board/v1/board_pb';
import type { Resource, StructType } from '../../types';

type ValueOf<T> = T[keyof T];
export const { PowerMode } = pb;
export type PowerMode = ValueOf<typeof pb.PowerMode>;
export interface Tick {
  pinName: string;
  high: boolean;
  time: number;
}
export type Duration = PBDuration.AsObject;

/**
 * Represents a physical general purpose compute board that contains various
 * components such as analog readers, and digital interrupts.
 */
export interface Board extends Resource {
  getGPIO(pin: string, extra?: StructType): Promise<boolean>;
  /**
   * Set the high/low state of the given pin of a board.
   *
   * @param pin - The pin.
   * @param high - When true, set the given pin to high. When false, set the
   *   given pin to low.
   */
  setGPIO(pin: string, high: boolean, extra?: StructType): Promise<void>;
  /**
   * Get the duty cycle of the given pin of a board.
   *
   * @param pin - The pin.
   * @returns The duty cycle, which is a value from 0 to 1.
   */
  getPWM(pin: string, extra?: StructType): Promise<number>;
  /**
   * Set the duty cycle of the given pin of a board.
   *
   * @param pin - The pin.
   * @param dutyCyclePct - A value from 0 to 1.
   */
  setPWM(pin: string, dutyCyclePct: number, extra?: StructType): Promise<void>;
  /**
   * Get the PWM frequency of the given pin of a board.
   *
   * @param pin - The pin.
   */
  getPWMFrequency(pin: string, extra?: StructType): Promise<number>;
  /**
   * Set the PWM frequency of the given pin of a board.
   *
   * @param pin - The pin.
   * @param frequencyHz - The PWM frequency, in hertz. 0 will use the board's
   *   default PWM frequency.
   */
  setPWMFrequency(
    pin: string,
    frequencyHz: number,
    extra?: StructType
  ): Promise<void>;
  /**
   * Read the current value of an analog reader of a board.
   *
   * @param analogReader - The name of the analog reader.
   */
  readAnalogReader(analogReader: string, extra?: StructType): Promise<number>;
  /**
   * Write an analog value to a pin on the board.
   *
   * @param pin - The pin name.
   * @param value - An integer value to write.
   */
  writeAnalog(pin: string, value: number, extra?: StructType): Promise<void>;
  /**
   * Return the current value of the interrupt which is based on the type of
   * interrupt.
   *
   * @param digitalInterruptName - The name of the digital interrupt.
   */
  getDigitalInterruptValue(
    digitalInterruptName: string,
    extra?: StructType
  ): Promise<number>;
  /**
   * Stream digital interrupt ticks on the board.
   *
   * @param interrupts - Names of the interrupts to stream.
   * @param queue - Array to put the ticks in.
   */
  streamTicks(
    interrupts: string[],
    queue: Tick[],
    extra?: StructType
  ): Promise<void>;
  /**
   * Set power mode of the board.
   *
   * @param name - The name of the board.
   * @param powerMode - The requested power mode.
   * @param duration - The requested duration to stay in power mode.
   */
  setPowerMode(
    name: string,
    powerMode: PowerMode,
    duration: Duration,
    extra?: StructType
  ): Promise<void>;
}
