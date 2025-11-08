/**
 * Node.js E2E Test Setup
 *
 * This file configures the SDK for Node.js environments by setting up the gRPC
 * transport factory to use @connectrpc/connect-node instead of the browser's
 * createGrpcWebTransport.
 */

import { createGrpcTransport } from '@connectrpc/connect-node';

// Configure the SDK to use Node.js gRPC transport
// This is required because dialDirect defaults to createGrpcWebTransport
// which doesn't work in Node.js environments
if (!globalThis.VIAM) {
  globalThis.VIAM = {
    GRPC_TRANSPORT_FACTORY: (opts: unknown) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      createGrpcTransport({
        httpVersion: '2',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(opts as any),
      }),
  };
}
