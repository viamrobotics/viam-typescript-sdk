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

## Restrictions

- Do NOT add dependencies unless absolutely necessary — this is a public SDK.

## Tools

- Prefer dedicated tools (Grep, Glob, Read, Edit, Write) over Bash equivalents when practical.

## TypeScript Conventions

- **`verbatimModuleSyntax` is enabled.** Type-only imports MUST use the `type` keyword:
  - `import { Struct, type JsonValue } from '@bufbuild/protobuf';` — mixed value + type
  - `import type { Options } from '../../types';` — type-only import
- **Before creating a new file**, read 1–2 existing files of the same kind to match patterns exactly (e.g., read an existing `client.spec.ts` before writing a new one).
- Other strict checks enabled: `noUncheckedIndexedAccess`, `strict`, `noUnusedLocals`, `noUnusedParameters`.

## Implementation

- Follow existing patterns. No new conventions or abstractions.
- Implement the **minimal change**. No refactors or unnecessary additions.
- Maintain backwards compatibility. No breaking changes to the public API.
- Export new public API through `src/main.ts`.
- Add or update unit tests for changed behavior. Tests should verify meaningful logic, edge cases, error paths, state transitions, not just trivial assertions.
