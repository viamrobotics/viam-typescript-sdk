#!/bin/bash

# Substitute BIN for your bin directory.
# Substitute VERSION for the current released version.
BIN="$(pwd)/bin"
VERSION="1.9.0"

mkdir -p "$BIN"
curl -sSL \
    "https://github.com/bufbuild/buf/releases/download/v${VERSION}/buf-$(uname -s)-$(uname -m)" \
    -o "${BIN}/buf"
chmod +x "${BIN}/buf"
