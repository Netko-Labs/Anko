# Releasing

Anko releases are built automatically from release commits pushed to `main`.
Never create or push release tags manually. The workflow creates the matching
GitHub tag after validating the release commit and every workspace version.

1. Update the version in every versioned workspace `package.json` (root,
   desktop, bridge, contract, and the four `packages/desktop/*` layer
   packages), plus the changelog-worthy code on `main`. The release workflow
   verifies all of them.
2. Run `bun install --frozen-lockfile`, `bun audit`, `bun run check`,
   `bun run typecheck`, `bun test`, and `bun run build`.
3. Commit the version change with the exact release subject, for example:

```bash
git commit -m "🚀 release: v0.8.4"
git push origin main
```

The release workflow validates that the commit subject and package version match,
creates the tag and draft release, generates release notes, builds macOS/Windows/
Linux concurrently, uploads each platform's artifacts, and publishes only after
every target succeeds.
