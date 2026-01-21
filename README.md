# Viam TypeScript SDK

Build and connect to robots with TypeScript

[![license](https://img.shields.io/badge/license-Apache_2.0-blue)](https://github.com/viamrobotics/viam-typescript-sdk/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/@viamrobotics/sdk?color=33cd56&logo=npm)](https://www.npmjs.com/package/@viamrobotics/sdk)
[![documentation](https://img.shields.io/static/v1?label=docs&message=ts.viam.dev&color=lightgray)](https://ts.viam.dev)

## Usage

### Installation

```
npm install @viamrobotics/sdk
```

### Examples

[The examples directory](https://github.com/viamrobotics/viam-typescript-sdk/tree/main/examples) contains small apps that demonstrate how to use this SDK to operate a robot running Viam.

### Documentation

[https://ts.viam.dev](https://ts.viam.dev/)

## Node

To use this SDK with node, read the [documentation](https://github.com/viamrobotics/viam-typescript-sdk/blob/main/Node.md) or view the [example](https://github.com/viamrobotics/viam-typescript-sdk/tree/main/examples/node)

## React Native

To use this SDK with React Native, read the [documentation](https://github.com/viamrobotics/viam-typescript-sdk/blob/main/ReactNative.md) or view the [example](https://github.com/viamrobotics/viam-typescript-sdk/tree/main/examples/react-native/)

## Offline Mode

To run the TypeScript SDK in offline mode, see [Connect over local network or offline](https://docs.viam.com/dev/reference/sdks/connectivity/#connect-over-local-network-or-offline).

## Debugging

The SDK provides global helper functions on the `window` object for easier debugging in the browser console.

### Logging Configuration

You can change the logging level or mode for all loggers dynamically:

```javascript
// Change log level for all loggers
window.setLoggingLevel('debug');

// Change log level for a specific logger
window.setLoggingLevelFor('RobotClient', 'debug');

// Change log mode for all loggers: 'formatted', 'raw'
// 'formatted' is human-readable (default).
// 'raw' is single-line JSON Lines for easy parsing by log viewers.
window.setLoggingMode('raw');

// Change log mode for a specific logger
window.setLoggingModeFor('RobotClient', 'raw');
```

The available levels (from most to least verbose) are:

| Level   | `error` | `warn` | `info` | `debug` |
| :------ | :-----: | :----: | :----: | :-----: |
| `debug` |   ✅    |   ✅   |   ✅   |   ✅    |
| `info`  |   ✅    |   ✅   |   ✅   |         |
| `warn`  |   ✅    |   ✅   |        |         |
| `error` |   ✅    |        |        |         |
| `none`  |         |        |        |         |

### Retrieving Logs

The SDK maintains a circular buffer of the last 10,000 log statements. You can retrieve these logs as a JSON Lines string or copy them to your clipboard:

```javascript
// Copies logs to clipboard; otherwise, prints the logs to the console
await window.getLogs();
```

## License

Copyright 2022-2025 Viam Inc.

Apache 2.0 - See [LICENSE](https://github.com/viamrobotics/viam-typescript-sdk/blob/main/LICENSE) file
