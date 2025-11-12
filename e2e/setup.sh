#!/bin/bash

set -e

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
BIN_DIR=$SCRIPT_DIR/bin
BIN_NAME=viam-server
BIN_PATH=$BIN_DIR/$BIN_NAME

mkdir -p $BIN_DIR

# Download the same stable version across all platforms
if [ "$(uname)" == "Linux" ]; then
	if [ "$(uname -m)" == "aarch64" ]; then
		curl -fsSL https://storage.googleapis.com/packages.viam.com/apps/viam-server/viam-server-stable-aarch64 -o $BIN_PATH
	elif [ "$(uname -m)" == "x86_64" ]; then
		curl -fsSL https://storage.googleapis.com/packages.viam.com/apps/viam-server/viam-server-stable-x86_64 -o $BIN_PATH
	else
		echo -e "Cannot run E2E tests on $(uname -m)"
		exit 1
	fi
	chmod +x $BIN_PATH
elif [ "$(uname)" == "Darwin" ]; then
	if [ "$(uname -m)" == "arm64" ]; then
		curl -fsSL https://storage.googleapis.com/packages.viam.com/apps/viam-server/viam-server-stable-aarch64 -o $BIN_PATH
	elif [ "$(uname -m)" == "x86_64" ]; then
		curl -fsSL https://storage.googleapis.com/packages.viam.com/apps/viam-server/viam-server-stable-x86_64 -o $BIN_PATH
	else
		echo -e "Cannot run E2E tests on $(uname -m)"
		exit 1
	fi
	chmod +x $BIN_PATH
fi
