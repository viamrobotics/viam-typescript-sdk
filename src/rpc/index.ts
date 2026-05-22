import type { Transport } from '@connectrpc/connect';
import type { GrpcWebTransportOptions } from '@connectrpc/connect-web';

declare global {
  // eslint-disable-next-line vars-on-top
  var VIAM:
    | {
        GRPC_TRANSPORT_FACTORY?: (opts: GrpcWebTransportOptions) => Transport;
        GRPC_TRACE_LOGGING?: boolean;
      }
    | undefined;
}

export { ConnectionClosedError } from './connection-closed-error';
export {
  cloneHeaders,
  dialDirect,
  dialWebRTC,
  wrapTransportWithDebugLogging,
  type DialOptions,
  type DialWebRTCOptions,
  type WebRTCConnection,
} from './dial';
