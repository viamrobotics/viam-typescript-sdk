import {
  Code,
  ConnectError,
  createClient,
  type Transport,
} from '@connectrpc/connect';
import { RobotService } from '../gen/robot/v1/robot_connect';
import {
  SendSessionHeartbeatRequest,
  StartSessionRequest,
} from '../gen/robot/v1/robot_pb';
import { ConnectionClosedError } from '../rpc';
import SessionTransport from './session-transport';

const timeoutBlob = new Blob(
  [
    `self.onmessage = function(e) {
  setTimeout(() => self.postMessage(""), e.data);
};`,
  ],
  { type: 'text/javascript' }
);

export default class SessionManager {
  public readonly transport: Transport;

  private currentSessionID = '';
  private sessionsSupported: boolean | undefined;
  private heartbeatIntervalMs: number | undefined;

  private starting: Promise<void> | undefined;

  private get client() {
    const transport = this.deferredTransport();
    return createClient(RobotService, transport);
  }

  constructor(private deferredTransport: () => Transport) {
    this.transport = new SessionTransport(this.deferredTransport, this);
  }

  get sessionID() {
    return this.currentSessionID;
  }

  private getSessionMetadataInner(): Headers {
    const md = new Headers();
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
      const sendHeartbeatReq = new SendSessionHeartbeatRequest({
        id: this.currentSessionID,
      });
      try {
        await this.client.sendSessionHeartbeat(sendHeartbeatReq);
      } catch (error) {
        if (
          error instanceof ConnectError &&
          error.code === Code.Unimplemented
        ) {
          console.error('sessions unsupported; will not try again'); // eslint-disable-line no-console
          this.sessionsSupported = false;
          return;
        }
        if (
          error instanceof ConnectionClosedError ||
          (error instanceof ConnectError && error.rawMessage === 'closed')
        ) {
          /**
           * We assume the connection closing will cause getSessionMetadata to
           * be called again by way of a reset.
           */
          this.reset();
          return;
        }
      }
      if (worker) {
        worker.postMessage(this.heartbeatIntervalMs);
      } else {
        setTimeout(() => {
          doHeartbeat().catch(console.error); // eslint-disable-line no-console
        }, this.heartbeatIntervalMs);
      }
    };

    /*
     * This lint is correct but it makes our lives easier to refer to a boolean in
     * case in the future we make this toggleable (e.g. foreground).
     */
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.backgroundHeartbeat && globalThis.Worker !== undefined) {
      const url = window.URL.createObjectURL(timeoutBlob);
      worker = new Worker(url);
      URL.revokeObjectURL(url);
      worker.addEventListener('message', () => {
        doHeartbeat().catch(console.error); // eslint-disable-line no-console
      });
    }

    doHeartbeat().catch(console.error); // eslint-disable-line no-console
  }

  public async getSessionMetadata(): Promise<Headers> {
    while (this.starting) {
      // eslint-disable-next-line no-await-in-loop
      await this.starting;
    }
    if (this.sessionsSupported !== undefined) {
      return this.getSessionMetadataInner();
    }

    this.starting = new Promise<void>((resolve, reject) => {
      (async () => {
        const startSessionReq = new StartSessionRequest();
        if (this.currentSessionID !== '') {
          startSessionReq.resume = this.currentSessionID;
        }

        let resp;
        try {
          resp = await this.client.startSession(startSessionReq);
        } catch (error) {
          if (
            error instanceof ConnectError &&
            error.code === Code.Unimplemented
          ) {
            console.error('sessions unsupported; will not try again'); // eslint-disable-line no-console
            this.sessionsSupported = false;
            return;
          }
          throw error;
        }

        const { heartbeatWindow } = resp;
        if (!heartbeatWindow) {
          throw new Error(
            'expected heartbeat window in response to start session'
          );
        }
        this.sessionsSupported = true;
        this.currentSessionID = resp.id;
        this.heartbeatIntervalMs =
          (Number(heartbeatWindow.seconds) * 1e3 +
            heartbeatWindow.nanos / 1e6) /
          5;
        resolve();
        this.heartbeat().catch(console.error); // eslint-disable-line no-console
      })()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.starting = undefined;
        });
    });
    await this.starting;

    return this.getSessionMetadataInner();
  }
}
