// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ArgumentsType<T> = T extends (...args: infer U) => any ? U : never;

export type ResolvedReturnType<T> = T extends (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => Promise<infer R>
  ? R
  : never;

/** Transforms void return types to { success: boolean } for test output */
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type OutputType<T> = [T] extends [void] ? { success: boolean } : T;
