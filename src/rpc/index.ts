import type { Transport } from '@connectrpc/connect';

declare global {
  // eslint-disable-next-line vars-on-top,no-var
  var VIAM:
    | {
        GRPC_TRANSPORT_FACTORY?: (opts: unknown) => Transport;
        GRPC_TRACE_LOGGING?: boolean;
      }
    | undefined;
}

export {
  cloneHeaders,
  dialDirect,
  dialWebRTC,
  type DialOptions,
  type DialWebRTCOptions,
  type WebRTCConnection,
} from './dial';

export { ConnectionClosedError } from './connection-closed-error';
