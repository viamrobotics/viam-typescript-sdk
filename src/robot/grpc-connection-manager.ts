import { grpc } from '@improbable-eng/grpc-web';
import { RobotServiceClient } from '../gen/robot/v1/robot_pb_service';
import robotApi from '../gen/robot/v1/robot_pb';
import { DISCONNECTED, events } from '../events';
import { type ServiceError } from '../gen/robot/v1/robot_pb_service';

const timeoutBlob = new Blob(
  [
    `self.onmessage = function(e) {
    setTimeout(() => self.postMessage(""), e.data);
  };`,
  ],
  { type: 'text/javascript' }
);

export default class GRPCConnectionManager {
  private innerTransportFactory: grpc.TransportFactory;
  private client: RobotServiceClient;
  private heartbeatIntervalMs: number;

  public connecting: Promise<void> | undefined;
  private connectResolve: (() => void) | undefined;
  private connectReject: ((reason: ServiceError) => void) | undefined;

  constructor(
    serviceHost: string,
    transportFactory: grpc.TransportFactory,
    heartbeatIntervalMs = 10_000
  ) {
    this.innerTransportFactory = transportFactory;
    this.client = new RobotServiceClient(serviceHost, {
      transport: this.innerTransportFactory,
    });
    this.heartbeatIntervalMs = heartbeatIntervalMs;
  }

  public heartbeat() {
    let worker: Worker | undefined;
    const doHeartbeat = () => {
      const getOperationsReq = new robotApi.GetOperationsRequest();
      this.client.getOperations(
        getOperationsReq,
        new grpc.Metadata(),
        (err) => {
          if (err) {
            events.emit(DISCONNECTED, {});
            return;
          }

          if (worker) {
            worker.postMessage(this.heartbeatIntervalMs);
          } else {
            setTimeout(() => doHeartbeat(), this.heartbeatIntervalMs);
          }
        }
      );
    };

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (window.Worker) {
      const url = window.URL.createObjectURL(timeoutBlob);
      worker = new Worker(url);
      URL.revokeObjectURL(url);
      worker.onmessage = () => {
        doHeartbeat();
      };
    }

    doHeartbeat();
  }

  public async start() {
    if (this.connecting) {
      await this.connecting;
    }

    this.connecting = new Promise<void>((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;
    });

    // call heartbeat once at start
    const getOperationsReq = new robotApi.GetOperationsRequest();
    this.client.getOperations(
      getOperationsReq,
      new grpc.Metadata(),
      (err, _resp) => {
        if (err) {
          this.connectReject?.(err);
          console.debug('failed to connect');
          return;
        }
        this.connectResolve?.();
      }
    );

    try {
      await this.connecting;
    } finally {
      this.connecting = undefined;
    }

    this.heartbeat();
  }
}
