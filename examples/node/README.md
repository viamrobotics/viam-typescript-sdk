# Viam SDK Quickstart - Node

This example demonstrates how to connect to a machine using Node.js.

## Usage

You must have a `.env` file in this directory with the following connection info which can be easily found in the TypeScript code sample for your machine.

```
HOST="<HOST>"
API_KEY_ID="<API_KEY_ID>"
API_KEY="<API_KEY>"
```

Installing will build the TypeScript SDK, then you can run the example using Vite.

```
cd examples/node
npm install
npm start
```

Edit `src/main.ts` to change the machine logic being run.

## Configuration

Using Viam's TypeScript SDK with Node.js requires some configurations. They are outlined below. Copying this project as a template is a good approach given the dependencies and polyfills requried. In the future, we hope to minimize the work neeed to get started here.

### Dependencies

The following direct dependencies are required:

- @connectrpc/connect-node
- node-datachannel

In addition, polyfills and a node specific gRPC Transport are provided in `main.ts`.

#### `main.ts`

The `main.ts` file was updated to include the following polyfills and updates:

- WebRTC Polyfills:

  ```js
import wrtc = require('node-datachannel/polyfill');
for (const key in wrtc) {
  (global as any)[key] = (wrtc as any)[key];
}
  ```

- GRPC connection configuration
  ```js
import VIAM = require('@viamrobotics/sdk');
globalThis.VIAM = {
  // @ts-ignore
  GRPC_TRANSPORT_FACTORY: (opts: any) =>
    connectNode.createGrpcTransport({ httpVersion: '2', ...opts }),
};
  ```
