#!/usr/bin/env bash

CHART_REF=oci://dp.apps.rancher.io/charts/suse-storage:{patch-version}

set -euo pipefail
setopt shwordsplit 2>/dev/null || true

# Check for dependencies
for cmd in yq jq helm tar; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo >&2 "Error: '$cmd' is required but not installed."
    exit 1
  fi
done

tmp_dir=$(mktemp -d)
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

# Pull and extract chart
helm pull "$CHART_REF" --untar --untardir "$tmp_dir"

# The folder name is just the chart name, not the version
chart_dir="$tmp_dir/suse-storage"
chart_path="$chart_dir/Chart.yaml"

# Extract 'helm.sh/images' annotation and convert to JSON
images_json=$(
  yq eval '.annotations."helm.sh/images"' "$chart_path" | yq -o=json eval -
)

# Directly print image list (one per line)
echo "$images_json" | jq -r '.[] | .image' > longhorn-images.txt