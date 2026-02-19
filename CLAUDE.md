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

- **NEVER** modify `.github/`, `Makefile`, `src/gen/`, or `package-lock.json`
- **NEVER** run `make` targets — they require protobuf tooling not available here
- Do NOT add dependencies unless absolutely necessary — this is a public SDK

## Tools

- Always prefer dedicated tools (Grep, Glob, Read, Edit, Write) over Bash equivalents (grep, find, cat, sed, etc.)
- Minimize turns: chain Bash commands with `&&`, avoid re-reading files you already explored, and do not use TodoWrite

## CI Environment

These rules apply when running in GitHub Actions (CI) workflows:

- Do NOT run ESLint, typecheck, or tests — they require tooling not available here.
- Run `npm run _prettier -- --write && npm run lint:prettier` to format code before committing.
- Dependencies are already installed — do NOT run `npm ci`.
- Bash commands CANNOT use pipes (`|`), command substitution (`$()`), or shell redirection. Run each command separately with explicit arguments.
- If a command is blocked or denied, do NOT retry it or try variations of the same approach. Switch to a different tool (e.g., use Edit instead of sed).
- For bulk edits (same change across many files): work in small batches of up to 5 files at a time — Read 5 files, then Edit those 5 files, then move to the next 5. Do NOT read all files at once then edit all at once — the Edit tool may lose track of reads from large batches. Do NOT use `Bash(sed -i ...)` — it is blocked by the sandbox.
- Always Read a file (full read, no offset/limit) before Editing it.
- Do NOT use Task subagents for file editing. Use the Edit tool directly from the main agent. Bash-type subagents only have the Bash tool — they cannot use Edit, Grep, or Glob.
- For commits, prefer `mcp__github_file_ops__commit_files` (available when `use_commit_signing` is enabled). **Always pass the `branch` parameter** with the current branch name (use `git rev-parse --abbrev-ref HEAD` to get it) — omitting it defaults to the repo's default branch, which will fail on protected branches. If the MCP tool fails, fall back to `git config user.email "noreply@anthropic.com" && git config user.name "Claude"` then `git commit -m "single-line message"`.
- For PRs, write the body to `/tmp/pr-body.md` using the Write tool, then run `gh pr create --title "Title" --body-file /tmp/pr-body.md`. NEVER pass multi-line strings directly to `--body`.

## Implementation

- Follow existing patterns. No new conventions or abstractions.
- Implement the **minimal change**. No refactors or unnecessary additions.
- Maintain backwards compatibility. No breaking changes to the public API.
- Export new public API through `src/main.ts`.
- Add or update unit tests for changed behavior. Tests should verify meaningful logic, edge cases, error paths, state transitions, not just trivial assertions.
