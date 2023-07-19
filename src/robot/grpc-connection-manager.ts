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
  private heartbeatIntervalMs: number | undefined;

  private connecting: Promise<void> | undefined;
  private connectResolve: (() => void) | undefined;
  private connectReject: ((reason: ServiceError) => void) | undefined;

  constructor(serviceHost: string, transportFactory: grpc.TransportFactory) {
    this.innerTransportFactory = transportFactory;
    this.client = new RobotServiceClient(serviceHost, {
      transport: this.innerTransportFactory,
    });
  }

  private heartbeat() {
    let worker: Worker | undefined;
    const doHeartbeat = () => {
      const getOperationsReq = new robotApi.GetOperationsRequest();
      this.client.getOperations(
        getOperationsReq,
        new grpc.Metadata(),
        (err, resp) => {
          if (err) {
            console.debug(err, resp);
            // Do not emit first time
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
    // call heartbeat once at start
    console.debug('connecting get operation first time');

    const getOperationsReq = new robotApi.GetOperationsRequest();

    // TODO: make sure we are not already connecting

    this.connecting = new Promise<void>((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;
    });

    this.client.getOperations(
      getOperationsReq,
      new grpc.Metadata(),
      (err, _resp) => {
        if (err) {
          this.connectReject?.(err);
          console.debug('failed to connect womp womp');
          return;
        }
        this.connectResolve?.();
        console.debug('connected yay');
      }
    );

    await this.connecting;
    this.connecting = undefined;

    this.heartbeat();
  }
}
