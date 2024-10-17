# React Native & Viam's TypeScript SDK

This document contains detailed instructions on including Viam in your React Native project. For an runnable example, see the [examples directory](/examples/react-native/).

## Requirements

This document assumes you already have a React Native project. If not, follow the [instructions](https://reactnative.dev/docs/environment-setup) provided by React Native.

> [!IMPORTANT]
> The SDK does **not** work with Expo (neither Expo Go nor development builds). You must use the React Native CLI.

### Dependencies

You must use the latest version of Viam's TypeScript SDK, `>=0.26.1`, alongside a few other direct dependencies:

- `fast-text-encoding`
- `react-native-fast-encoder`
- `react-native-fetch-api`
- `react-native-url-polyfill`
- `react-native-webrtc`
- `web-streams-polyfill`

You can use either Yarn or NPM to install the dependencies. This document will use NPM, but either will work.

`npm install @viamrobotics/sdk fast-text-encoding react-native-fast-encoder react-native-fetch-api react-native-url-polyfill react-native-webrtc web-streams-polyfill`

### Polyfills

Using the SDK with React Native also requires a number of polyfills. You can find these at [polyfills.native.ts](/examples/react-native/polyfills.native.ts) and [polyfills.ts](/examples/react-native/polyfills.ts). They are also pasted in their entirety below. You can copy these directly into your application.

```ts
// polyfills.native.ts

// Dervied from https://raw.githubusercontent.com/connectrpc/examples-es/refs/heads/main/react-native
import TextEncoder from 'react-native-fast-encoder';
// @ts-expect-error -- missing type declarations
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';
// @ts-expect-error -- missing type declarations
import { fetch, Headers, Request, Response } from 'react-native-fetch-api';
import 'react-native-url-polyfill/auto';
import { registerGlobals } from 'react-native-webrtc';
import { ReadableStream } from 'web-streams-polyfill';

export function polyfills() {
  polyfillGlobal('TextDecoder', () => TextEncoder);
  polyfillGlobal('TextEncoder', () => TextEncoder);
  registerGlobals();
  polyfillGlobal('ReadableStream', () => ReadableStream);
  polyfillGlobal(
    'fetch',
    () =>
      (...args: Parameters<typeof window.fetch>) =>
        fetch(args[0], {
          ...args[1],
          // Inject textStreaming: https://github.com/react-native-community/fetch/issues/15
          reactNative: { textStreaming: true },
        })
  );
  polyfillGlobal('Headers', () => Headers);
  polyfillGlobal('Request', () => Request);
  polyfillGlobal('Response', () => Response);
  // Polyfill async.Iterator. For some reason, the Babel presets and plugins are not doing the trick.
  // Code from here: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html#caveats
  (Symbol as any).asyncIterator =
    Symbol.asyncIterator || Symbol.for('Symbol.asyncIterator');
}
```

```ts
// polyfills.ts

// From https://raw.githubusercontent.com/connectrpc/examples-es/refs/heads/main/react-native
// No polyfills needed for web
export function polyfills() {}
```

### Transport

Communicating with your Viam machine in React Native requires the use of a custom transport. You can find it in the examples directory at [transport.ts](/examples/react-native/transport.ts). You can copy that file as is and put it in your project's root directory (sibling to the `polyfill` files).

## Configuration

### `App.tsx`

You will also have to update your `App.tsx` to import and install the `polyfills` and update the Viam transport factory.

```tsx
// App.tsx

// React imports here
// e.g.
// import React, { useState } from 'react';

// ADD THE FOLLOWING LINES
import * as VIAM from '@viamrobotics/sdk';
import { polyfills } from './polyfills';
polyfills();

import { GrpcWebTransportOptions } from '@connectrpc/connect-web';
import { createXHRGrpcWebTransport } from './transport';

globalThis.VIAM = {
  GRPC_TRANSPORT_FACTORY: (opts: GrpcWebTransportOptions) => {
    return createXHRGrpcWebTransport(opts);
  },
};
```

### `metro.config.js`

In addition, your `metro.config.js` file needs to be updated as well. `react-native` and `react-native-webrtc` require conflicting versions of the library `event-target-shim`. Because of that, we need to tell the Metro Bundler to package this library properly. The following is a full example of what the `metro.config.js` file could look like. If you have made any changes yourself to the bundler, yours will look different.

```js
const { getDefaultConfig } = require('@react-native/metro-config');
const resolveFrom = require('resolve-from');

/**
 * Metro configuration https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    // If the bundle is resolving "event-target-shim" from a module that is part of "react-native-webrtc".
    moduleName.startsWith('event-target-shim') &&
    context.originModulePath.includes('react-native-webrtc')
  ) {
    // Resolve event-target-shim relative to the react-native-webrtc package to use v6.
    // React Native requires v5 which is not compatible with react-native-webrtc.
    const eventTargetShimPath = resolveFrom(
      context.originModulePath,
      moduleName
    );

    return {
      filePath: eventTargetShimPath,
      type: 'sourceFile',
    };
  }

  // Ensure you call the default resolver.
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
```

### Android Configuration

If you are planning on running your app on Android, you will need the `ACCESS_NETWORK_STATE` permission. Add the following line to your `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### iOS Configuration

Some of the new dependencies install platform-specific plugins. Be sure to run `pod install`.

## Using the SDK

To use the SDK, you can use similar instructions to those found on the [documentation site](https://docs.viam.com/sdks/). Below is an example of how you could use the SDK to display a list of resources on the connected device:

```tsx
// App.tsx

import React, { PropsWithoutRef, useState } from 'react';
import {
  Button,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import * as VIAM from '@viamrobotics/sdk';
import { polyfills } from './polyfills';
polyfills();

import { GrpcWebTransportOptions } from '@connectrpc/connect-web';
import { createXHRGrpcWebTransport } from './transport';

globalThis.VIAM = {
  GRPC_TRANSPORT_FACTORY: (opts: GrpcWebTransportOptions) => {
    return createXHRGrpcWebTransport(opts);
  },
};

type ResourceNameViewProps = PropsWithoutRef<{
  resourceName: VIAM.ResourceName;
}>;

function ResourceNameView({
  resourceName,
}: ResourceNameViewProps): React.JSX.Element {
  return (
    <View style={[styles.listItem]}>
      <Text style={[styles.listItemTitle]}>{resourceName.name}</Text>
      <Text style={[styles.listItemSubtitle]}>
        {resourceName.namespace}/{resourceName.type}/{resourceName.subtype}
      </Text>
    </View>
  );
}

function App(): React.JSX.Element {
  const [connected, setConnected] = useState<boolean>(false);
  const [resourceNames, setResourceNames] = useState<VIAM.ResourceName[]>([]);

  async function connect() {
    const host = 'test4-main.hrsdzs2gp3.viam.cloud';
    try {
      const client = await VIAM.createRobotClient({
        host,
        credentials: {
          type: 'api-key',
          authEntity: '2f862d8c-7824-4f1f-aca1-0a9fab38506a',
          payload: '4ft2ch1zdxsjyj5trn4ppq4rk7crj2jc',
        },
        signalingAddress: 'https://app.viam.com:443',
      });
      setConnected(true);
      const rns = await client.resourceNames();
      setResourceNames(rns.sort((a, b) => (a.name < b.name ? -1 : 1)));
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <SafeAreaView>
      <StatusBar />
      <Button
        title={connected ? 'Connected' : 'Connect'}
        onPress={connect}
        disabled={connected}
      />
      <FlatList
        data={resourceNames}
        renderItem={({ item }) => <ResourceNameView resourceName={item} />}
        keyExtractor={(item) =>
          `${item.namespace}/${item.type}/${item.subtype}:${item.name}`
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listItem: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  listItemSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
});

export default App;
```

To view the app, you can run `npm run {ios|android}`.

If you choose to run on Android, you may have to set the following environment variables:

```sh
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```
