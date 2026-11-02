#!/usr/bin/env bash
# Generate categorized Markdown from the previous reachable release to a tag.
# Categories follow the git-release skill: feat, fix, docs, then other changes.
# Requires complete Git history and a vX.Y.Z tag.
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage: release-notes.sh -t <tag> -r <repo-url> [-o <out-file>]

  -t, --tag       Version tag in vX.Y.Z format
  -r, --repo-url  HTTPS repository URL for commit and comparison links
  -o, --out       Output file; defaults to stdout
  -h, --help      Show this help
EOF
}

tag=""
repo_url=""
out=""
while [ $# -gt 0 ]; do
  case "$1" in
    -t | --tag)
      tag="${2:-}"
      shift 2
      ;;
    -r | --repo-url)
      repo_url="${2:-}"
      shift 2
      ;;
    -o | --out)
      out="${2:-}"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 2
      ;;
  esac
done

parse_version() {
  printf '%s' "$1" | sed -nE 's/^v([0-9]+)\.([0-9]+)\.([0-9]+)$/\1 \2 \3/p'
}

if [ -z "$(parse_version "$tag")" ]; then
  echo "Expected a vX.Y.Z tag, received: ${tag:-<empty>}" >&2
  exit 1
fi
case "$repo_url" in
  https://*) ;;
  *)
    echo "Expected an HTTPS repository URL, received: ${repo_url:-<empty>}" >&2
    exit 1
    ;;
esac
repo_url="${repo_url%/}"

if [ "$(git rev-parse --is-shallow-repository)" = "true" ]; then
  echo "Release notes require complete Git history and tags" >&2
  exit 1
fi

sha="$(git rev-parse --verify "${tag}^{commit}")"

# Compare each numeric component rather than using lexical ordering.
version_lt() {
  local va="$1" vb="$2" a1 a2 a3 b1 b2 b3
  set -- $va
  a1="$1" a2="$2" a3="$3"
  set -- $vb
  b1="$1" b2="$2" b3="$3"
  [ "$a1" -lt "$b1" ] && return 0
  [ "$a1" -gt "$b1" ] && return 1
  [ "$a2" -lt "$b2" ] && return 0
  [ "$a2" -gt "$b2" ] && return 1
  [ "$a3" -lt "$b3" ] && return 0
  return 1
}

current_version="$(parse_version "$tag")"
previous=""
for candidate in $(git tag --merged "$sha" --sort=-version:refname); do
  candidate_version="$(parse_version "$candidate")"
  [ -z "$candidate_version" ] && continue
  if version_lt "$candidate_version" "$current_version"; then
    previous="$candidate"
    break
  fi
done

range="$sha"
[ -n "$previous" ] && range="${previous}..${sha}"

escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' \
    -e 's/\x60/\\`/g' -e 's/\[/\\[/g' -e 's/\]/\\]/g' -e 's/\*/\\*/g' -e 's/_/\\_/g'
}

features=""
fixes=""
docs=""
others=""
while IFS= read -r line; do
  [ -z "$line" ] && continue
  hash="${line%%$'\x1f'*}"
  subject="${line#*$'\x1f'}"
  [ "${#hash}" -lt 7 ] && continue
  # Byte matching avoids emoji prefixes depending on the runner's locale.
  type="$(printf '%s' "$subject" | LC_ALL=C sed -nE 's/^([^ ]+ )?([a-z]+)(\([^)]*\))?!?: .*/\2/p')"
  entry="- $(escape "$subject") ([${hash:0:7}](${repo_url}/commit/${hash}))"
  case "$type" in
    feat) features="${features}${entry}"$'\n' ;;
    fix) fixes="${fixes}${entry}"$'\n' ;;
    docs) docs="${docs}${entry}"$'\n' ;;
    *) others="${others}${entry}"$'\n' ;;
  esac
done < <(git log --no-merges --reverse --format='%H%x1f%s' "$range")

body="## What's Changed"$'\n\n'
[ -n "$features" ] && body="${body}### Features"$'\n\n'"${features}"$'\n'
[ -n "$fixes" ] && body="${body}### Fixes"$'\n\n'"${fixes}"$'\n'
[ -n "$docs" ] && body="${body}### Documentation"$'\n\n'"${docs}"$'\n'
[ -n "$others" ] && body="${body}### Other Changes"$'\n\n'"${others}"$'\n'
if [ -n "$previous" ]; then
  body="${body}**Full Changelog**: [${previous}...${tag}](${repo_url}/compare/${previous}...${tag})"$'\n'
else
  body="${body}**Full Changelog**: [${tag}](${repo_url}/commits/tag/${tag})"$'\n'
fi

if [ -z "$out" ]; then
  printf '%s' "$body"
else
  printf '%s' "$body" >"$out"
fi
