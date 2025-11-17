# Contributing Guide

Welcome to the Viam TypeScript SDK. Please read this guide prior to opening a pull request.

## Development setup

Developing on the TypeScript SDK requires macOS or Linux. To get started, clone this repository:

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

To get started, run `make all` to install development dependencies, run checks, build the distributable artifacts, and build docs:

```shell
# run sequentially
make all

# run in parallel
make all -j
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

## Testing

Our test suite is divided into unit tests and integration tests.

### Unit Testing

We use [Vitest](https://vitest.dev/) for unit testing to ensure that individual components of the SDK are well-tested in isolation.

**Key Principles:**

- **Location:** Unit tests are located in `src/**/__tests__`. Related test data and mocks are stored in adjacent `__fixtures__/` and `__mocks__/` directories, respectively.
- **Isolation:** Tests must be independent. Use `vi.mock()` to mock external dependencies and ensure each test case can run on its own.
- **Clarity:** Follow the Arrange-Act-Assert (AAA) pattern to structure tests clearly. Use descriptive names for `describe` blocks and test cases (e.g., `it('should do X when Y')`).

You can run all unit tests with:

```shell
make test
```

### Integration Testing

Integration tests verify the end-to-end interaction between the SDK and a live `viam-server`. We use [Vitest](https://vitest.dev/) for Node.js tests and [Playwright](https://playwright.dev/) for browser tests. All integration test code resides in the `e2e/` directory.

**Key Principles:**

- **File Naming:** Tests are separated by environment:
  - `*.node.spec.ts` for Node.js-only tests.
  - `*.browser.spec.ts` for browser-only tests.
- **Browser Testing:** Browser tests interact with a UI test harness (`e2e/index.html`) via a Playwright Page Object Model (`e2e/fixtures/robot-page.ts`). This ensures tests are stable and maintainable.
- **Node.js Testing:** Node.js tests interact with the SDK directly using a gRPC connection.

Before running integration tests for the first time, you must download the `viam-server` binary:

```shell
cd e2e && ./setup.sh
```

You can run the full integration test suite with:

```shell
make test-e2e
```

You can also run the Node.js and browser suites separately:

```shell
npm run e2e:node
npm run e2e:browser
```
