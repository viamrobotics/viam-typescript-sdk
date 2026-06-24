/// <reference types="vite/client" />

interface ElmPort {
  subscribe: (callback: (...args: never[]) => void) => void;
  send: (value: unknown) => void;
}

interface ElmApp {
  ports: Record<string, ElmPort>;
}

declare module '*.elm' {
  const Elm: Record<string, { init: (options: { node: unknown; flags: unknown }) => ElmApp }>;
  export { Elm };
}
