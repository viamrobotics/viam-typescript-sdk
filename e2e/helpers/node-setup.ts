import { createGrpcTransport } from '@connectrpc/connect-node';

globalThis.VIAM ??= {
  GRPC_TRANSPORT_FACTORY: (opts: unknown) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    createGrpcTransport({
      httpVersion: '2',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(opts as any),
    }),
};
