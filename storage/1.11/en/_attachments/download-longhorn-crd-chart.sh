#!/bin/bash

set -euo pipefail

if [ $# -lt 1 ] || [ $# -gt 2 ]; then
    echo "Usage: $0 <version> [github_token]"
    exit 1
fi

REPO="rancher/charts"
VERSION="$1"
TARGET_PATH="charts/longhorn-crd/${VERSION}"
LOCAL_DIR=""$VERSION""

# GitHub Token is optional
if [ $# -eq 2 ]; then
    GITHUB_TOKEN="$2"
    AUTH_HEADER="Authorization: token ${GITHUB_TOKEN}"
else
    AUTH_HEADER=""
fi

# Get all release-* branches and sort by latest first
if [ -n "$AUTH_HEADER" ]; then
    branches=$(curl -s -H "${AUTH_HEADER}" "https://api.github.com/repos/${REPO}/branches?per_page=100" | jq -r '.[].name' | grep '^release-' | sort -r)
else
    branches=$(curl -s "https://api.github.com/repos/${REPO}/branches?per_page=100" | jq -r '.[].name' | grep '^release-' | sort -r)
fi

# Function to recursively download files and folders
download_directory() {
    local remote_path=$1
    local local_path=$2
    local branch=$3
    echo "Fetching content from: ${remote_path} (branch: ${branch})"
    if [ -n "$AUTH_HEADER" ]; then
        response=$(curl -s -w "%{http_code}" -H "${AUTH_HEADER}" -o /tmp/api_response.json "https://api.github.com/repos/${REPO}/contents/${remote_path}?ref=${branch}")
    else
        response=$(curl -s -w "%{http_code}" -o /tmp/api_response.json "https://api.github.com/repos/${REPO}/contents/${remote_path}?ref=${branch}")
    fi
    http_code="${response: -3}"
    body=$(cat /tmp/api_response.json)
    if [[ "$http_code" != "200" ]]; then
        echo "Error fetching directory: ${remote_path}"
        echo "HTTP status: $http_code"
        echo "Response: $body"
        exit 1
    fi
    if ! echo "$body" | jq -e '. | type == "array"' > /dev/null; then
        echo "Unexpected API response format for ${remote_path}"
        echo "Response: $body"
        exit 1
    fi
    for row in $(echo "${body}" | jq -r '.[] | @base64'); do
        _jq() {
            echo "${row}" | base64 --decode | jq -r "${1}"
        }
        name=$(_jq '.name')
        type=$(_jq '.type')
        path=$(_jq '.path')
        if [[ "${type}" == "file" ]]; then
            file_url="https://raw.githubusercontent.com/${REPO}/${branch}/${path}"
            echo "Downloading file: ${path}"
            mkdir -p "${local_path}"
            curl -s -L -o "${local_path}/${name}" "${file_url}"
        elif [[ "${type}" == "dir" ]]; then
            echo "Entering directory: ${path}"
            mkdir -p "${local_path}/${name}"
            download_directory "${path}" "${local_path}/${name}" "${branch}"
        fi
    done
}

for branch in $branches; do
    echo "Checking branch: $branch"
    url="https://api.github.com/repos/${REPO}/contents/${TARGET_PATH}?ref=${branch}"
    if [ -n "$AUTH_HEADER" ]; then
        response=$(curl -s -w "%{http_code}" -H "${AUTH_HEADER}" -o /tmp/check_response.json "$url")
    else
        response=$(curl -s -w "%{http_code}" -o /tmp/check_response.json "$url")
    fi
    http_code="${response: -3}"
    body=$(cat /tmp/check_response.json)
    if [[ "$http_code" == "200" ]]; then
        echo "Found target in branch: $branch"
        mkdir -p "${LOCAL_DIR}"
        download_directory "${TARGET_PATH}" "${LOCAL_DIR}" "${branch}"
        echo "Download completed to ${LOCAL_DIR}."
        exit 0
    elif [[ "$http_code" != "404" ]]; then
        echo "Error checking branch: ${branch}"
        echo "HTTP status: $http_code"
        echo "Response: $body"
        exit 1
    fi
done

echo "Target not found in any release-* branch."
exit 1