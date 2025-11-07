import {
  TEST_HOST,
  TEST_SIGNALING_ADDRESS,
} from '../../__fixtures__/test-constants';
import type { DialConf } from '../../main';

export const baseDialConfig: DialConf = {
  host: TEST_HOST,
  signalingAddress: TEST_SIGNALING_ADDRESS,
} as const;

export const withDisableSessions: DialConf = {
  ...baseDialConfig,
  disableSessions: true,
} as const;

export const withNoReconnect: DialConf = {
  ...baseDialConfig,
  noReconnect: true,
} as const;
