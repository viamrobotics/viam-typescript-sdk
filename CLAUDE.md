# Viam TypeScript SDK

Public TypeScript SDK for the Viam robotics platform (`@viamrobotics/sdk`).

## Key Paths

- `src/main.ts` — Public API entry point. All public exports must go through this file.
- `src/gen/` — Auto-generated protobuf code. Never edit. Not committed to git.

## Restrictions

- **NEVER** modify `.github/`, `Makefile`, `src/gen/`, or `package-lock.json`
- **NEVER** run `make` targets — they require protobuf tooling not available here
- Do NOT add dependencies unless absolutely necessary — this is a public SDK

## Implementation

- Follow existing patterns. Do not introduce new conventions or abstractions
- Implement the **minimal change**. No refactors, no new abstractions
- Maintain backwards compatibility. No breaking changes to the public API
- Export new public API through `src/main.ts`
- Add or update unit tests for changed behavior. Tests should verify meaningful logic, edge cases, error paths, state transitions, not just trivial assertions.
