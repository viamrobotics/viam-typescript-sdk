# Viam TypeScript SDK

Public TypeScript SDK for the Viam robotics platform (`@viamrobotics/sdk`).

## Key Paths

- `src/main.ts` — Public API entry point. All public exports must go through this file.
- `src/gen/` — Auto-generated protobuf code. Never edit. Not committed to git.

## Codebase Structure

```
src/
  main.ts                          — Public API barrel file (all exports)
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

- **NEVER** modify `.github/`, `Makefile`, `src/gen/`, or `package-lock.json`
- **NEVER** run `make` targets — they require protobuf tooling not available here
- Do NOT add dependencies unless absolutely necessary — this is a public SDK

## Tools

- Always prefer dedicated tools (Grep, Glob, Read, Edit, Write) over Bash equivalents (grep, find, cat, sed, etc.)
- Minimize turns: chain Bash commands with `&&`, avoid re-reading files you already explored, and do not use TodoWrite

## CI Environment

These rules apply when running in GitHub Actions (CI) workflows:

- Do NOT run ESLint, typecheck, or tests — they require tooling is not available here.
- Run `npm run _prettier -- --write && npm run lint:prettier` to format code before committing.
- Dependencies are already installed — do NOT run `npm ci`.
- Bash commands CANNOT use pipes (`|`), command substitution (`$()`), or shell redirection. Run each command separately with explicit arguments.
- If a command is blocked or denied, do NOT retry it or try variations of the same approach. Switch to a different tool (e.g., use Edit instead of sed).
- For commit messages use simple `-m "message"` — no heredocs or `$(cat ...)`.
- Do NOT use TodoWrite — it wastes turns.
- Do NOT use Task subagents for file editing. Use the Edit tool directly from the main agent. Bash-type subagents only have the Bash tool — they cannot use Edit, Grep, or Glob.

## Implementation

- Follow existing patterns. Do not introduce new conventions or abstractions
- Implement the **minimal change**. No refactors, no new abstractions
- Maintain backwards compatibility. No breaking changes to the public API
- Export new public API through `src/main.ts`
- Add or update unit tests for changed behavior. Tests should verify meaningful logic, edge cases, error paths, state transitions, not just trivial assertions.
