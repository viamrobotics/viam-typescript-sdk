// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Extra = Map<string, any>

export interface Options {
  requestLogger?: (req: unknown) => void
}
