# Node.js & Viam's TypeScript SDK

This document contains detailed instructions on including Viam in your Node.js project. For a runnable example, see the [examples directory](/examples/node/).

## Requirements

This document assumes you already have Node.js >= version 20 installed. If not, follow the [instructions](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs) provided by Node.js.

### Dependencies

In addition to the Viam SDK, the following direct dependencies are requires:

- `@connectrpc/connect-node`
- `node-datachannel`

You can use either Yarn or NPM to install the dependencies. This document will use NPM, but either will work.

`npm install @viamrobotics/sdk @connectrpc/connect-node node-datachannel`

### Polyfills

Using the SDK with Node.js also requires the use of some polyfills. In your application's entrypoint (`main.ts`, `index.ts`, or something similar), you will need to register those polyfills:

```ts
// main.ts

const wrtc = require('node-datachannel/polyfill');
for (const key in wrtc) {
  (global as any)[key] = (wrtc as any)[key];
}
```

### Transport

Communicating with your Viam machine in Node.js requires the use of a custom transport. In your app's entrypoint, you will also need to register the custom transport:

```ts
// main.ts

const connectNode = require('@connectrpc/connect-node');
globalThis.VIAM = {
  GRPC_TRANSPORT_FACTORY: (opts: any) =>
    connectNode.createGrpcTransport({ httpVersion: '2', ...opts }),
};
```

## Using the SDK

To use the SDK, you can use similar instructions to those found on the [documentation site](https://docs.viam.com/sdks/). Below is an example of how you could use the SDK to display a list of resources on the connected device:

```ts
// main.ts

const VIAM = require('@viamrobotics/sdk');
const wrtc = require('node-datachannel/polyfill');
const connectNode = require('@connectrpc/connect-node');
globalThis.VIAM = {
  GRPC_TRANSPORT_FACTORY: (opts: any) =>
    connectNode.createGrpcTransport({ httpVersion: '2', ...opts }),
};
for (const key in wrtc) {
  (global as any)[key] = (wrtc as any)[key];
}

async function connect() {
  const host = process.env.HOST;
  const apiKeyId = process.env.API_KEY_ID;
  const apiKeySecret = process.env.API_KEY_SECRET;
  if (!host) {
    throw new Error('must set HOST env var');
  }
  if (!apiKeyId) {
    throw new Error('must set API_KEY_ID env var');
  }
  if (!apiKeySecret) {
    throw new Error('must set API_KEY_SECRET env var');
  }

  const client = await VIAM.createRobotClient({
    host,
    credentials: {
      type: 'api-key',
      authEntity: apiKeyId,
      payload: apiKeySecret,
    },
    signalingAddress: 'https://app.viam.com:443',
    iceServers: [{ urls: 'stun:global.stun.twilio.com:3478' }],
  });

  console.log(await client.resourceNames());
}

connect().catch((e) => {
  console.error('error connecting to machine', e);
});
```

In the above example, it is assumed that certain environment variables are set (`HOST`, `API_KEY_ID`, and `API_KEY_SECRET`). You can set those in the process or have a `.env` file set them automatically. If you use a `.env` file, be sure to exclude it from version control.

In your terminal, you can run:

`npx tsc && node --env-file=.env main.js`
