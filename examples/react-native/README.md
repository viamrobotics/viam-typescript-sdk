# React Native & Viam's TypeScript SDK

This example demonstrates how to connect to a robot using a React Native app. For a summary of changes required to use the TypeScript SDK with React Native, view the [Configuration](#Configuration) section.

## Table of Contennts

1. [Usage](#Usage)
2. [Configuration](#Configuration)

## Usage

- Run `npm install`
- Open `App.tsx` and update the `host` and API `credentials`.
- Run `npm run {ios|android}`
  - If running on iOS, you may have to install dependencies: `cd ios && pod install && popd`
  - If running on Android, you may have to export Android tool locations:
    ```sh
    export ANDROID_HOME=$HOME/Library/Android/sdk
    export PATH=$PATH:$ANDROID_HOME/emulator
    export PATH=$PATH:$ANDROID_HOME/platform-tools
    ```

## Configuration

Using Viam's TypeScript SDK with React Native requires some configurations. They are outlined below:

### Dependencies

The following direct dependencies are required:

- `react-native-webrtc`
- `react-native-url-polyfill`
- `@improbable-eng/grpc-web-react-native-transport`

#### `index.js`

The `index.js` file was updated to include the following polyfills and updates:

- URL polyfill:

  ```js
  import 'react-native-url-polyfill/auto';
  ```

- React Native WebRTC globals:

  ```js
  import {registerGlobals} from 'react-native-webrtc';
  registerGlobals();
  ```

- GRPC connection configuration
  ```js
  import {ReactNativeTransport} from '@improbable-eng/grpc-web-react-native-transport';
  global.VIAM = {
    GRPC_TRANSPORT_FACTORY: ReactNativeTransport,
  };
  ```

#### `metro.config.js`

The `metro.config.js` file was also updated. `react-native` and `react-native-webrtc` require conflicting versions of the library `event-target-shim`. By updating the `metro.config.js` file, the Metro Bundler knows how to package this library properly.

### Android Configuration

The `ACCESS_NETWORK_STATE` permission was added to the `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```
