/** Assertion functions for runtime and type safety. */

/**
 * Assert that a value is defined.
 *
 * @example Const stringify = (value: number | undefined): number => {
 * assertExists(value) return `${value}` // TS now knows that value is of type
 * `number` }
 */
export const assertExists: <T>(
  value: T,
  message: string
) => asserts value is NonNullable<T> = (value, message) => {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
};
