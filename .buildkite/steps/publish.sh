#!/usr/bin/env bash

set -ueo pipefail

# shellcheck source=.buildkite/steps/lib.bash
# source "${BASH_SOURCE%/*}/lib.bash"

REGISTRY="${REGISTRY:-https://repo.aurin.cloud.edu.au/repository/npm-aurin/}"
SCOPE="${NEW_SCOPE:-aurin}"

#
# Replace name in the form "package" with "@scope/package"
#
scope_name() {
    local br;
    br="$(mktemp)"
    jq ". | .name = \"@${SCOPE}/\"+.name" package.json > "${br}"
    mv "${br}" package.json
}

#
# Replace name in the form "@scope/package" with "package"
#
unscope_name() {
    local br;
    br="$(mktemp)"
    jq '. | .name|=split("/")[1]' package.json > "${br}"
    mv "${br}" package.json
}

publish() {

    if [[ -z "${BUILDKITE_TAG:-}" ]];
    then
      local original_version new_version
      original_version=$(jq -r '.version' package.json)
      new_version="${original_version}-b${BUILDKITE_BUILD_NUMBER}"
      npm version --no-git-tag-version "${new_version}"
    else
      buildkite-agent annotate --style info "Publishing release ${BUILDKITE_TAG}"
    fi

    npm publish --registry="${REGISTRY}"
    scope_name
    npm publish --registry="${REGISTRY}"
}

publish