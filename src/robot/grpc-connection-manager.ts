import { createPromiseClient, type Transport } from '@connectrpc/connect';
import { RobotService } from '../gen/robot/v1/robot_connect';

const timeoutBlob = new Blob(
  [
    `self.onmessage = function(e) {
    setTimeout(() => self.postMessage(""), e.data);
  };`,
  ],
  { type: 'text/javascript' }
);

export default class GRPCConnectionManager {
  public connecting: Promise<void> | undefined;

  constructor(
    private deferredTransport: () => Transport,
    private onDisconnect: () => void,
    private heartbeatIntervalMs = 10_000
  ) {}

  private get client() {
    const transport = this.deferredTransport();
    return createPromiseClient(RobotService, transport);
  }

  public heartbeat() {
    let worker: Worker | undefined;
    const doHeartbeat = async () => {
      try {
        await this.client.getOperations({});
      } catch {
        this.onDisconnect();
        return;
      }

      if (worker) {
        worker.postMessage(this.heartbeatIntervalMs);
      } else {
        setTimeout(() => {
          doHeartbeat().catch(console.error); // eslint-disable-line no-console
        }, this.heartbeatIntervalMs);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (window.Worker) {
      const url = window.URL.createObjectURL(timeoutBlob);
      worker = new Worker(url);
      URL.revokeObjectURL(url);
      worker.addEventListener('message', () => {
        doHeartbeat().catch(console.error); // eslint-disable-line no-console
      });
    }

    doHeartbeat().catch(console.error); // eslint-disable-line no-console
  }

  public async start() {
    if (this.connecting) {
      await this.connecting;
    }

    this.connecting = new Promise<void>((resolve, reject) => {
      (async () => {
        await this.client.getOperations({});
      })()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.connecting = undefined;
        });
    });

    try {
      await this.connecting;
    } finally {
      this.connecting = undefined;
    }

    this.heartbeat();
  }
}
