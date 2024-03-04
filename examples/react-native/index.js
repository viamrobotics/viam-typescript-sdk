/**
 * @format
 */

import 'react-native-url-polyfill/auto';

import {registerGlobals} from 'react-native-webrtc';
registerGlobals();

import {ReactNativeTransport} from '@improbable-eng/grpc-web-react-native-transport';
global.VIAM = {
  GRPC_TRANSPORT_FACTORY: ReactNativeTransport,
};

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
