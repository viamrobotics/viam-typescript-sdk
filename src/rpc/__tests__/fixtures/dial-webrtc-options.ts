import type { DialWebRTCOptions } from '../../dial';

export const withICEServers = {
  disableTrickleICE: false,
  rtcConfig: {
    iceServers: [{ urls: 'stun:test.server.com' }],
  } as RTCConfiguration,
  additionalSdpFields: {
    'custom-field': 'custom-value',
    'another-field': 123,
  },
} satisfies DialWebRTCOptions;
