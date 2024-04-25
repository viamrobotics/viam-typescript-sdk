# React Native & Viam's TypeScript SDK

Viam's React Native support is still experimental. Therefore, we've provided this document for with detailed instructions on including Viam in your React Native project.

## Requirements

This document assumes you already have a React Native project. If not, follow the [instructions](https://reactnative.dev/docs/environment-setup) provided by React Native.

> [!IMPORTANT]
> The SDK does **not** work with Expo (neither Expo Go nor development builds). You must use the React Native CLI.

### Dependencies

You must use the latest version of Viam's TypeScript SDK, `>=0.11.0`, alongside a few other direct dependencies: `react-native-webrtc`, `react-native-url-polyfill`, and `@improbable-eng/grpc-web-react-native-transport`.

You can use either Yarn or NPM to install the dependencies. This document will use NPM, but either will work.

`npm install @viamrobotics/sdk react-native-webrtc react-native-url-polyfill @improbable-eng/grpc-web-react-native-transport`

### Configuration

#### `index.js`

You will also have to update your `index.js`. These updates should be placed above all other imports or customizations.

Firstly, you will have to import the URL polyfill:

```js
import 'react-native-url-polyfill/auto';
```

Then, you have to register the React Native WebRTC globals:

```js
import { registerGlobals } from 'react-native-webrtc';
registerGlobals();
```

Finally, you will have to update add the GRPC connection configuration:

```js
import { ReactNativeTransport } from '@improbable-eng/grpc-web-react-native-transport';
global.VIAM = {
  GRPC_TRANSPORT_FACTORY: ReactNativeTransport,
};
```

Your final `index.js` might look something like this:

```js
/** @format */

import 'react-native-url-polyfill/auto';

import { registerGlobals } from 'react-native-webrtc';
registerGlobals();

import { ReactNativeTransport } from '@improbable-eng/grpc-web-react-native-transport';
global.VIAM = {
  GRPC_TRANSPORT_FACTORY: ReactNativeTransport,
};

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

#### `metro.config.js`

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

To use the SDK, you can use similar instructions to those found on the [documentation site](https://docs.viam.com/build/program/). Below is an example of how you could use the SDK to display a list of resources on the connected device:

```tsx
// App.tsx

import React, { PropsWithoutRef } from 'react';
import { useState } from 'react';
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
    const host = 'YOUR_HOST';
    const client = await VIAM.createRobotClient({
      host,
      credential: {
        type: 'api-key',
        payload: 'YOUR_API_KEY',
      },
      authEntity: 'YOUR_API_KEY_ID',
      signalingAddress: 'https://app.viam.com:443',
    });
    setConnected(true);
    const rns = await client.resourceNames();
    setResourceNames(rns.sort((a, b) => (a.name < b.name ? -1 : 1)));
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
