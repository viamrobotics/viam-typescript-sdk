import type { TransportFactory } from '@improbable-eng/grpc-web/dist/typings/transports/Transport';
import type { CrossBrowserHttpTransportInit } from '@improbable-eng/grpc-web/dist/typings/transports/http/http';

declare global {
  // eslint-disable-next-line vars-on-top,no-var
  var VIAM:
    | {
        GRPC_TRANSPORT_FACTORY?: (
          opts: CrossBrowserHttpTransportInit
        ) => TransportFactory;
      }
    | undefined;
}

export {
  dialDirect,
  dialWebRTC,
  type Credentials,
  type DialOptions,
  type DialWebRTCOptions,
  type WebRTCConnection,
} from './dial';

export { ConnectionClosedError } from './connection-closed-error';
export { GRPCError } from './grpc-error';
