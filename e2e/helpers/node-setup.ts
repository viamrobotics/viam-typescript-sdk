import { createGrpcTransport } from '@connectrpc/connect-node';

const isCI = process.env.CI !== undefined;

if (isCI) {
  // eslint-disable-next-line no-console
  console.log('[node-setup] Running in CI environment');
  // eslint-disable-next-line no-console
  console.log('[node-setup] Node version:', process.version);
  // eslint-disable-next-line no-console
  console.log('[node-setup] Platform:', process.platform, process.arch);
}

if (!globalThis.VIAM) {
  globalThis.VIAM = {
    GRPC_TRANSPORT_FACTORY: (opts: unknown) => {
      if (isCI) {
        // eslint-disable-next-line no-console
        console.log('[node-setup] Creating gRPC transport with opts:', opts);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return createGrpcTransport({
        httpVersion: '2',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(opts as any),
      });
    },
  };
}
