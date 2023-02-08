import { ConnectionClosedError } from '@viamrobotics/rpc';
import { NoResponseError } from './utils';
import { RobotClient } from './components/robot';
import type { ServiceError } from './gen/robot/v1/robot_pb_service.esm';
import SessionTransport from './SessionTransport';
import { grpc } from '@improbable-eng/grpc-web';

const timeoutBlob = new Blob(
  [
    `self.onmessage = function(e) {
  setTimeout(() => self.postMessage(""), e.data);
};`,
  ],
  { type: 'text/javascript' }
);

export default class SessionManager {
  private readonly innerTransportFactory: grpc.TransportFactory;

  private client: RobotClient;

  private currentSessionID = '';
  private sessionsSupported: boolean | undefined;
  private heartbeatIntervalMs: number | undefined;

  private starting: Promise<void> | undefined;

  private startResolve: (() => void) | undefined;

  private startReject: ((reason: ServiceError) => void) | undefined;

  constructor(serviceHost: string, transportFactory: grpc.TransportFactory) {
    this.innerTransportFactory = transportFactory;
    this.client = new RobotClient({
      serviceHost,
      opts: {
        transport: transportFactory,
      },
    });
  }

  get transportFactory() {
    return (opts: grpc.TransportOptions): grpc.Transport => {
      return new SessionTransport(opts, this.innerTransportFactory, this);
    };
  }

  get sessionID() {
    return this.currentSessionID;
  }

  private getSessionMetadataInner(): grpc.Metadata {
    const md = new grpc.Metadata();
    if (this.sessionsSupported && this.currentSessionID !== '') {
      md.set('viam-sid', this.currentSessionID);
    }
    return md;
  }

  public reset() {
    if (this.starting) {
      return;
    }
    this.sessionsSupported = undefined;
  }

  // Note: maybe support non-worker for foreground presence.
  private readonly backgroundHeartbeat = true;

  private async heartbeat() {
    if (!this.sessionsSupported || this.currentSessionID === '') {
      return;
    }
    while (this.starting) {
      // eslint-disable-next-line no-await-in-loop
      await this.starting;
    }

    let worker: Worker | undefined;
    const doHeartbeat = async () => {
      try {
        await this.client.sendSessionHeartbeat(this.currentSessionID);

        if (worker) {
          worker.postMessage(this.heartbeatIntervalMs);
        } else {
          setTimeout(() => doHeartbeat(), this.heartbeatIntervalMs);
        }
      } catch (err) {
        if (ConnectionClosedError.isError(err)) {
          /*
           * We assume the connection closing will cause getSessionMetadata to be
           * called again by way of a reset.
           */
          this.reset();
        }
        // Otherwise we want to continue in case it was just a blip
      }
    };

    /*
     * This lint is correct but it makes our lives easier to refer to a boolean in
     * case in the future we make this toggleable (e.g. foreground).
     */
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.backgroundHeartbeat && window.Worker) {
      const url = window.URL.createObjectURL(timeoutBlob);
      worker = new Worker(url);
      URL.revokeObjectURL(url);
      worker.onmessage = function () {
        doHeartbeat();
      };
    }

    doHeartbeat();
  }

  private async startSession(): Promise<void> {
    let resp;
    try {
      resp = await this.client.startSession(
        this.currentSessionID !== '' ? this.currentSessionID : undefined
      );
    } catch (err) {
      if ((err as ServiceError).code === grpc.Code.Unimplemented) {
        console.error('sessions unsupported; will not try again');
        this.sessionsSupported = false;
        this.startResolve?.();
        return;
      }
      if (err instanceof NoResponseError) {
        const newError = {
          code: grpc.Code.Internal,
          message: 'expected response to start session',
          metadata: new grpc.Metadata(),
        } as ServiceError;
        this.startReject?.(newError);
        return;
      }
      this.startReject?.(err as ServiceError);
      return;
    }

    const heartbeatWindow = resp.getHeartbeatWindow();
    if (!heartbeatWindow) {
      this.startReject?.({
        code: grpc.Code.Internal,
        message: 'expected heartbeat window in response to start session',
        metadata: new grpc.Metadata(),
      });
      return;
    }
    this.sessionsSupported = true;
    this.currentSessionID = resp.getId();
    this.heartbeatIntervalMs =
      (heartbeatWindow.getSeconds() * 1e3 + heartbeatWindow.getNanos() / 1e6) /
      5;
    this.startResolve?.();
    this.heartbeat();
  }

  public async getSessionMetadata(): Promise<grpc.Metadata> {
    while (this.starting) {
      // eslint-disable-next-line no-await-in-loop
      await this.starting;
    }
    if (this.sessionsSupported !== undefined) {
      return this.getSessionMetadataInner();
    }
    this.starting = new Promise<void>((resolve, reject) => {
      this.startResolve = resolve;
      this.startReject = reject;
    });

    try {
      await this.startSession();
      await this.starting;
      return this.getSessionMetadataInner();
    } finally {
      this.startResolve?.();
      this.startResolve = undefined;
      this.startReject = undefined;
      this.starting = undefined;
    }
  }
}
