# Viam TypeScript SDK

Public TypeScript SDK for the Viam robotics platform (`@viamrobotics/sdk`).

## Codebase Structure

```
src/
  main.ts                          — Public API barrel file (all exports)
  gen/                             — Auto-generated protobuf code (never edit, not in git)
  types.ts                         — Shared type definitions (Resource interface, Options, etc.)
  utils.ts                         — Shared utilities (doCommandFromClient, etc.)
  robot/                           — Robot client and session management
  components/<name>/               — Hardware component clients
    <name>.ts                      — Interface/type definitions
    client.ts                      — gRPC client implementation
    client.spec.ts                 — Unit tests (vitest)
  services/<name>/                 — Service clients (same structure as components)
  app/                             — App/cloud API clients
```

All component/service clients follow the same pattern. Tests use `*.spec.ts` suffix.

## Language Notes

- Export new public API through `src/main.ts`.
