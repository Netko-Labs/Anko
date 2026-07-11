# Releasing

Anko releases are built from version tags on commits already merged into
`main`. The tag and `package.json` version must match so every target receives
the same immutable version.

1. Update `package.json` and the changelog-worthy code on `main`.
2. Run `bun install --frozen-lockfile`, `bun run check`, `bun run typecheck`,
   `bun test`, and `bun run build`.
3. Merge the validated change.
4. Create and push the matching tag, for example:

```bash
git tag v0.8.1
git push origin v0.8.1
```

The release workflow validates the tag, generates release notes, creates a draft,
builds macOS/Windows/Linux concurrently on Blacksmith, uploads each platform's
artifacts in parallel, and publishes only after every target succeeds.
