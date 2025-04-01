import type { Duration, Struct } from '@bufbuild/protobuf';
import type { Resource } from '../../types';

import * as boardApi from '../../gen/component/board/v1/board_pb';

export type AnalogValue = boardApi.ReadAnalogReaderResponse;
export type PowerMode = boardApi.PowerMode;

export const { ReadAnalogReaderResponse: AnalogValue, PowerMode } = boardApi;

export interface Tick {
  pinName: string;
  high: boolean;
  time: number;
}

/**
 * Represents a physical general purpose compute board that contains various
 * components such as analog readers, and digital interrupts.
 */
export interface Board extends Resource {
  /**
   * Get the high/low state of the given pin.
   *
   * @example
   *
   * ```ts
   * const board = new VIAM.BoardClient(machine, 'my_board');
   *
   * // Get if it is true or false that the state of the pin is high.
   * const high = await board.getGPIO('15');
   * ```
   *
   * @param pin - The pin number.
   */
  getGPIO(pin: string, extra?: Struct): Promise<boolean>;
  /**
   * Set the high/low state of the given pin of a board.
   *
   * @example
   *
   * ```ts
   * const board = new VIAM.BoardClient(machine, 'my_board');
   *
   * // Set the pin to high.
   * await board.setGPIO('15', true);
   * ```
   *
   * @param pin - The pin number.
   * @param high - When true, set the given pin to high. When false, set the
   *   given pin to low.
   */
  setGPIO(pin: string, high: boolean, extra?: Struct): Promise<void>;
  /**
   * Get the duty cycle of the given pin of a board.
   *
   * @example
   *
   * ```ts
   * const board = new VIAM.BoardClient(machine, 'my_board');
   *
   * // Get the duty cycle of this pin.
   * const dutyCycle = await board.getPWM('15');
   * ```
   *
   * @param pin - The pin number.
   * @returns The duty cycle, which is a value from 0 to 1.
   */
  getPWM(pin: string, extra?: Struct): Promise<number>;
  /**
   * Set the duty cycle of the given pin of a board.
   *
   * @example
   *
   * ```ts
   * const board = new VIAM.BoardClient(machine, 'my_board');
   *
   * // Set the duty cycle to 0.6, meaning that this pin will be in the high state for
   * // 60% of the duration of the PWM interval period.
   * await board.setPWM('15', 0.6);
   * ```
   *
   * @param pin - The pin.
   * @param dutyCyclePct - A value from 0 to 1.
   */
  setPWM(pin: string, dutyCyclePct: number, extra?: Struct): Promise<void>;
  /**
   * Get the PWM frequency of the given pin of a board.
   *
   * @example
   *
   * ```ts
   * const board = new VIAM.BoardClient(machine, 'my_board');
   *
   * // Get the PWM frequency of this pin.
   * const freq = await board.getPWMFrequency('15');
   * ```
   *
   * @param pin - The pin.
   */
  getPWMFrequency(pin: string, extra?: Struct): Promise<number>;
  /**
   * Set the PWM frequency of the given pin of a board.
   *
   * @example
   *
   * ```ts
   * const board = new VIAM.BoardClient(machine, 'my_board');
   *
   * // Set the PWM frequency of this pin to 1600 Hz.
   * await board.setPWMFrequency('15', 1600);
   * ```
   *
   * @param pin - The pin.
   * @param frequencyHz - The PWM frequency, in hertz. 0 will use the board's
   *   default PWM frequency.
   */
  setPWMFrequency(
    pin: string,
    frequencyHz: number,
    extra?: Struct
  ): Promise<void>;
  /**
   * Read the current value of an analog reader of a board.
   *
   * @example
   *
   * ```ts
   * const board = new VIAM.BoardClient(machine, 'my_board');
   *
   * // Get the value of the analog signal "my_example_analog_reader" has most
   * // recently measured.
   * const reading = await board.readAnalogReader(
   *   'my_example_analog_reader'
   * );
   * ```
   *
   * @param analogReader - The name of the analog reader.
   */
  readAnalogReader(analogReader: string, extra?: Struct): Promise<AnalogValue>;
  /**
   * Write an analog value to a pin on the board.
   *
   * @example
   *
   * ```ts
   * const board = new VIAM.BoardClient(machine, 'my_board');
   *
   * // Write the value 42 to "my_example_analog_writer".
   * await board.writeAnalog('my_example_analog_writer', 42);
   * ```
   *
   * @param pin - The pin name.
   * @param value - An integer value to write.
   */
  writeAnalog(pin: string, value: number, extra?: Struct): Promise<void>;
  /**
   * Return the current value of the interrupt which is based on the type of
   * interrupt.
   *
   * @example
   *
   * ```ts
   * const board = new VIAM.BoardClient(machine, 'my_board');
   *
   * // Get the number of times this DigitalInterrupt has been interrupted with a tick.
   * const count = await board.getDigitalInterruptValue(
   *   'my_example_digital_interrupt'
   * );
   * ```
   *
   * @param digitalInterruptName - The name of the digital interrupt.
   */
  getDigitalInterruptValue(
    digitalInterruptName: string,
    extra?: Struct
  ): Promise<number>;
  /**
   * Stream digital interrupt ticks on the board.
   *
   * @example
   *
   * ```ts
   * const board = new VIAM.BoardClient(machine, 'my_board');
   *
   * // Stream ticks from pins 8 and 11.
   * const ticks = await board.streamTicks(['8', '11']);
   *
   * for await (const tick of ticks) {
   *   console.log(
   *     `Pin ${tick.pinName} changed to ${tick.high ? 'high' : 'low'} at ${tick.time}`
   *   );
   * }
   * ```
   *
   * @param interrupts - Names of the interrupts to stream.
   * @param queue - Array to put the ticks in.
   */
  streamTicks(
    interrupts: string[],
    queue: Tick[],
    extra?: Struct
  ): Promise<void>;
  /**
   * Set power mode of the board.
   *
   * @example
   *
   * ```ts
   * const board = new VIAM.BoardClient(machine, 'my_board');
   *
   * // Set the power mode of the board to OFFLINE_DEEP.
   * const duration = new VIAM.Duration({ seconds: 10n });
   * await board.setPowerMode(VIAM.PowerMode.OFFLINE_DEEP, duration);
   * ```
   *
   * @param powerMode - The requested power mode.
   * @param duration - The requested duration to stay in power mode.
   */
  setPowerMode(
    powerMode: PowerMode,
    duration: Duration,
    extra?: Struct
  ): Promise<void>;
}
