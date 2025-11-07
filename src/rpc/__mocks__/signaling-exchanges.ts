import { SignalingExchange } from '../signaling-exchange';
import {
  createMockDataChannel,
  createMockPeerConnection,
} from '../../__mocks__/webrtc';
import { withICEServers } from '../__fixtures__/dial-webrtc-options';
import type { DialWebRTCOptions } from '../dial';
import { createClient } from '@connectrpc/connect';
import { SignalingService } from '../../gen/proto/rpc/webrtc/v1/signaling_connect';
import { createMockTransport } from '../../__mocks__/transports';

export const createMockSignalingExchange = (
  transport = createMockTransport(),
  peerConnection = createMockPeerConnection(),
  dataChannel = createMockDataChannel(),
  webrtcOptions: DialWebRTCOptions = withICEServers
) => {
  return new SignalingExchange(
    createClient(SignalingService, transport),
    {},
    peerConnection,
    dataChannel,
    webrtcOptions
  );
};
