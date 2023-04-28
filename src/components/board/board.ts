import type { Resource, StructType } from '../../types';

interface Status {
  analogs: Record<string, number>;
  digitalInterrupts: Record<string, number>;
}

/**
 * Represents a physical general purpose compute board that contains various
 * components such as analog readers, and digital interrupts.
 */
export interface Board extends Resource {
  /** Get the status of the board. */
  getStatus(extra?: StructType): Promise<Status>;
  /**
   * Get the high/low state of the given pin of a board.
   *
   * @param pin - The pin.
   */
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
   * @param frequencyHz - The PWN frequency, in hertz. 0 will use the board's
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
   * Return the current value of the interrupt which is based on the type of
   * interrupt.
   *
   * @param digitalInterruptName - The name of the digital interrupt.
   */
  getDigitalInterruptValue(
    digitalInterruptName: string,
    extra?: StructType
  ): Promise<number>;
}
