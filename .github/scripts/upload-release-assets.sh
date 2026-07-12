#!/usr/bin/env bash
set -euo pipefail

: "${RELEASE_TAG:?RELEASE_TAG is required}"
: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"

shopt -s nullglob
build_dir="${ANKO_BUILD_DIR:-apps/desktop/build}"
files=("$build_dir"/release/*)
if ((${#files[@]} == 0)); then
  echo "::error::No release assets found in $build_dir/release"
  exit 1
fi

pids=()
for file in "${files[@]}"; do
  [[ -f "$file" ]] || continue
  gh release upload "$RELEASE_TAG" "$file" \
    --repo "$GITHUB_REPOSITORY" --clobber &
  pids+=("$!")
done

if ((${#pids[@]} == 0)); then
  echo "::error::No regular release assets found in $build_dir/release"
  exit 1
fi

failed=0
for pid in "${pids[@]}"; do
  if ! wait "$pid"; then
    failed=1
  fi
done

if ((failed != 0)); then
  echo "::error::One or more release assets failed to upload"
  exit 1
fi
