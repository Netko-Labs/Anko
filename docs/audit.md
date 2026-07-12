# Project Audit

Snapshot: 2026-07-12

## Scope

The audit covered workspace ownership, dependency declarations, TypeScript
coverage, database and MCP security boundaries, release automation, packaging,
documentation, and source hot spots.

## Resolved

- Split the repository into desktop, MCP bridge, and shared-contract workspaces.
- Moved runtime dependencies out of the root and declared the renderer's direct
  `@lezer/highlight` dependency instead of relying on transitive hoisting.
- Expanded typechecking to the renderer, Bun worker, build configs, bridge, and
  contract package.
- Escaped embedded identifier delimiters in generated PostgreSQL and MySQL SQL,
  with regression tests.
- Removed an unsafe `any` override from the cross-window toast bridge while
  preserving Sonner's return contract.
- Updated clean builds, native packaging, release uploads, version validation,
  and sidecar checks for workspace-owned output paths.
- Declared Mirin platform artifacts at the orchestration root so clean Bun
  workspace installs can package on each supported runner.
- Restored the README, added architecture documentation, and brought the
  changelog and release instructions up to date.
- Removed forced ARM64 Docker platforms so database fixtures use the host's
  native image architecture.

## Verification

- `bun audit`: no known vulnerabilities.
- `bun run check`: passes.
- `bun run typecheck`: passes across all workspaces and desktop processes.
- `bun test`: 78 passing tests.
- Renderer and native MCP bridge builds: pass.
- macOS arm64 native package and launch smoke: pass, including the bundled MCP
  sidecar.

Windows and Linux packaging remain CI-owned and must pass their x64/arm64 release
runners before publishing.

## Follow-up risks

### Credential key storage

Saved passwords use authenticated AES-256-GCM encryption, but the key is derived
from a public machine identifier and a static application salt. This protects
against casual database-file inspection, not an attacker with local user access.
A future migration should store a random wrapping key in Keychain, Credential
Manager, or Secret Service and re-encrypt existing values.

### Renderer size

The production renderer's main JavaScript chunk is about 1.75 MB minified (556
KB gzip). Lazy-loading DevTools, ERD, and editor-heavy views would improve cold
startup and keep optional features out of the initial graph.

### Large ownership surfaces

Several non-generated modules exceed the repository's 300-line budget, notably
the connection store, PostgreSQL connector, MCP service, ERD view, tab container,
and data table. Split them by state slice or operation when those areas are next
changed; avoid a broad behavior-changing rewrite solely for line count.

### Renderer policy

The update Markdown renderer escapes input before inserting constrained HTML,
but the desktop document has no explicit Content Security Policy. Add and smoke
test a CSP that permits the Mirin app protocol, local assets, and the trusted
changelog fetch while blocking unexpected script and navigation sources.
