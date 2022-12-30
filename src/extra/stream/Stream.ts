export interface Stream {
  add: (name: string) => Promise<void>
  remove: (name: string) => Promise<void>
}
