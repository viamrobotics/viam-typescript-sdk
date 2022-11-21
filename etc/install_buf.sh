#!/bin/bash

# Substitute BIN for your bin directory.
# Substitute VERSION for the current released version.

if [[ -z "$1" ]]; then
    echo "please provide an installation direction"
    exit 1
fi

BIN="$1"
VERSION="1.9.0"

mkdir -p "$BIN"
curl -sSL \
    "https://github.com/bufbuild/buf/releases/download/v${VERSION}/buf-$(uname -s)-$(uname -m)" \
    -o "${BIN}/buf"
chmod +x "${BIN}/buf"
