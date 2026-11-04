#!/usr/bin/env bash
# Print one line for each input of the site build:
#   playbook <commit SHA>        (playbook, package-lock.json, submodule pointers)
#   <url> <branch> <commit SHA>  (each content source in the playbook)
# The publish workflow hashes this output to decide if a scheduled build can
# be skipped. Exit non-zero if a lookup fails, so that the caller builds.
#
# Usage: ci/source-fingerprint.sh <playbook-file> <playbook-commit-sha>
set -euo pipefail

playbook=${1:?playbook file required}
playbook_sha=${2:?playbook commit SHA required}

echo "playbook ${playbook_sha}"

yq -r '.content.sources[] | .url + " " + ((.branches // ["HEAD"]) | join(" "))' "$playbook" \
  | sort -u \
  | while read -r url branches; do
      for branch in $branches; do
        if [ "$branch" = "HEAD" ]; then
          ref=HEAD
        else
          ref="refs/heads/${branch}"
        fi
        sha=$(git ls-remote --exit-code "$url" "$ref" | cut -f1)
        if [ -z "$sha" ]; then
          echo "No SHA for ${url} ${branch}" >&2
          exit 1
        fi
        echo "${url} ${branch} ${sha}"
      done
    done
