#!/bin/bash

set -e

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
BIN_DIR=$SCRIPT_DIR/bin
BIN_NAME=viam-server
BIN_PATH=$BIN_DIR/$BIN_NAME

mkdir -p $BIN_DIR

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
	brew tap viamrobotics/brews 2>/dev/null || true
	
	if brew list viam-server &>/dev/null; then
		brew upgrade viam-server || echo "viam-server is already up to date"
	else
		brew install viam-server
	fi

	ln -s $(which viam-server) $BIN_PATH
	chmod +x $BIN_PATH
fi
