import type { DialOptions } from '../../dial';
import { TEST_AUTH_ENTITY } from '../../../__tests__/fixtures/test-constants';

export {
  TEST_URL,
  TEST_HOST,
} from '../../../__tests__/fixtures/test-constants';

export const withAccessToken: DialOptions = {
  accessToken: 'valid-token',
} as const;

export const withCredentials: DialOptions = {
  credentials: {
    authEntity: TEST_AUTH_ENTITY,
    type: 'api-key' as const,
    payload: 'key',
  },
} as const;

export const withSignalingAccessToken: DialOptions = {
  webrtcOptions: {
    disableTrickleICE: false,
    signalingAccessToken: 'sig-token',
  },
} as const;

export const withSignalingCredentials: DialOptions = {
  webrtcOptions: {
    disableTrickleICE: false,
    signalingCredentials: {
      authEntity: TEST_AUTH_ENTITY,
      type: 'api-key' as const,
      payload: 'key',
    },
  },
} as const;
