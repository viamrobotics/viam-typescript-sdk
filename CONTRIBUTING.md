# Contributing Guide

Welcome to the Viam TypeScript SDK. Please read this guide prior to opening a pull request.

## Development setup

Developing on the TypeScript SDK requires macOS, Linux, or WSL / Bash for Windows. To get started, clone this repository:

```shell
git clone https://github.com/viamrobotics/viam-typescript-sdk.git
```

### Prerequisites

You'll need to make sure the following tools are installed on your machine and accessible in your `PATH`.

- Node.js
  - `node`
  - `npm`
- Protobuf
  - `protobuf`
  - `protoc-gen-grpc-web`

### Makefile targets

To get started, run `make all` to install development dependencies, run checks, and build the distributable artifacts:

```shell
make all
```

You can also use individual targets:

```shell
# setup development dependencies
make setup

# remove development dependencies
make teardown

# build artifacts
make build

# remove artifacts
make clean

# run tests, checks, and code formatting
make test
make lint
make format
```
