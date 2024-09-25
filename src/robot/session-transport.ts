import { grpc } from '@improbable-eng/grpc-web';
import { GRPCError } from '../rpc';
import type SessionManager from './session-manager';

export default class SessionTransport implements grpc.Transport {
  private readonly opts: grpc.TransportOptions;
  protected readonly transport: grpc.Transport;
  protected readonly sessionManager: SessionManager;

  private mdProm: Promise<void> | undefined;
  private mdPromResolve: (() => void) | undefined;

  constructor(
    opts: grpc.TransportOptions,
    innerFactory: grpc.TransportFactory,
    sessionManager: SessionManager
  ) {
    const actualOnEnd = opts.onEnd;
    opts.onEnd = (err?: Error) => {
      if (
        err &&
        err instanceof GRPCError &&
        err.code === grpc.Code.InvalidArgument.valueOf() &&
        err.grpcMessage === 'SESSION_EXPIRED'
      ) {
        this.sessionManager.reset();
      }
      actualOnEnd(err);
    };
    const actualOnHeaders = opts.onHeaders;
    opts.onHeaders = (headers: grpc.Metadata, status: number) => {
      const gStatus = headers.has('grpc-status')
        ? headers.get('grpc-status')
        : undefined;
      if (
        gStatus &&
        gStatus.length === 1 &&
        gStatus[0] === `${grpc.Code.InvalidArgument}`
      ) {
        const gMsg = headers.has('grpc-message')
          ? headers.get('grpc-message')
          : undefined;
        if (gMsg && gMsg.length === 1 && gMsg[0] === 'SESSION_EXPIRED') {
          this.sessionManager.reset();
        }
      }
      actualOnHeaders(headers, status);
    };
    this.opts = opts;
    this.sessionManager = sessionManager;
    this.transport = innerFactory(opts);
    this.mdProm = new Promise<void>((resolve) => {
      this.mdPromResolve = resolve;
    });
  }

  public start(metadata: grpc.Metadata) {
    this.sessionManager
      .getSessionMetadata()
      .then((md) => {
        // eslint-disable-next-line unicorn/no-array-for-each
        md.forEach((key: string, values: string | string[]) => {
          metadata.set(key, values);
        });
        this.transport.start(metadata);
        this.mdPromResolve?.();
      })
      .catch((error) => {
        this.opts.onEnd(error);
      });
  }

  public sendMessage(msgBytes: Uint8Array) {
    this.mdProm?.then(() => this.transport.sendMessage(msgBytes));
  }

  public finishSend() {
    this.mdProm?.then(() => this.transport.finishSend());
  }

  public cancel() {
    this.transport.cancel();
  }
}
