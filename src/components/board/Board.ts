import type { Extra } from '../../types';
import type pb from '../../gen/component/board/v1/board_pb.esm';

export interface Board {
  /** Get the status of the board. */
  status(extra?: Extra): Promise<pb.StatusResponse>;
  /**
   * Get the high/low state of the given pin of a board.
   *
   * @param pin - The pin.
   */
  getGPIO(pin: string, extra?: Extra): Promise<boolean>;
  /**
   * Set the high/low state of the given pin of a board.
   *
   * @param pin - The pin.
   * @param high - When true, set the given pin to high. When false, set the
   *   given pin to low.
   */
  setGPIO(pin: string, high: boolean, extra?: Extra): Promise<void>;
  /**
   * Get the duty cycle of the given pin of a board.
   *
   * @param pin - The pin.
   * @returns The duty cycle, which is a value from 0 to 1.
   */
  getPWM(pin: string, extra?: Extra): Promise<number>;
  /**
   * Set the duty cycle of the given pin of a board.
   *
   * @param pin - The pin.
   * @param dutyCyclePct - A value from 0 to 1.
   */
  setPWM(pin: string, dutyCyclePct: number, extra?: Extra): Promise<void>;
  /**
   * Get the PWM frequency of the given pin of a board.
   *
   * @param pin - The pin.
   */
  getPWMFrequency(pin: string, extra?: Extra): Promise<number>;
  /**
   * Set the PWM frequency of the given pin of a board.
   *
   * @param pin - The pin.
   * @param frequencyHz - The PWN frequency, in hertz. 0 will use the board's
   *   default PWM frequency.
   */
  setPWMFrequency(
    pin: string,
    frequencyHz: number,
    extra?: Extra
  ): Promise<void>;
  /**
   * Read the current value of an analog reader of a board.
   *
   * @param analogReader - The name of the analog reader.
   */
  readAnalogReader(
    // eslint-disable-next-line no-warning-comments
    // TODO: remove this argument.
    boardName: string,
    analogReader: string,
    extra?: Extra
  ): Promise<number>;
  /**
   * Return the current value of the interrupt which is based on the type of
   * interrupt.
   *
   * @param digitalInterruptName - The name of the digital interrupt.
   */
  getDigitalInterruptValue(
    // eslint-disable-next-line no-warning-comments
    // TODO: remove this argument.
    boardName: string,
    digitalInterruptName: string,
    extra?: Extra
  ): Promise<number>;
}
