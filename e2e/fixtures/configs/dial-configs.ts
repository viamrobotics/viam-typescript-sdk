import type { DialConf } from '../../main';

const DEFAULT_HOST = 'e2e-ts-sdk';
const DEFAULT_SERVICE_HOST = 'http://localhost:9090';
const DEFAULT_SIGNALING_ADDRESS = 'http://localhost:9090';
const DEFAULT_ICE_SERVERS = [{ urls: 'stun:global.stun.twilio.com:3478' }];

export const defaultConfig: DialConf = {
  host: DEFAULT_HOST,
  serviceHost: DEFAULT_SERVICE_HOST,
  signalingAddress: DEFAULT_SIGNALING_ADDRESS,
  iceServers: DEFAULT_ICE_SERVERS,
} as const;

export const invalidConfig: DialConf = {
  host: DEFAULT_HOST,
  serviceHost: 'http://invalid-host:9999',
  signalingAddress: DEFAULT_SIGNALING_ADDRESS,
  iceServers: DEFAULT_ICE_SERVERS,
  dialTimeout: 2000,
} as const;

export const defaultNodeConfig: DialConf = {
  host: DEFAULT_SERVICE_HOST,
  noReconnect: true,
} as const;

export const invalidNodeConfig: DialConf = {
  host: 'http://invalid-host:9999',
  noReconnect: true,
} as const;
