import { grpc } from '@improbable-eng/grpc-web';
import { RobotServiceClient } from "../gen/robot/v1/robot_pb_service";
import robotApi from '../gen/robot/v1/robot_pb';
import { DISCONNECTED, events } from '../events';

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
    private client: RobotServiceClient
    private heartbeatIntervalMs: number | undefined;

    constructor(serviceHost: string, transportFactory: grpc.TransportFactory) {
        this.innerTransportFactory = transportFactory;
        this.client = new RobotServiceClient(serviceHost, {
            transport: this.innerTransportFactory,
        });
    }

    private async heartbeat() {
        let worker: Worker | undefined;
        const doHeartbeat = () => {
            const getOperationsReq = new robotApi.GetOperationsRequest()
            this.client.getOperations(
                getOperationsReq,
                new grpc.Metadata(),
                (err, resp) => {
                    if (err) {
                        console.debug(err, resp);
                        return
                    }
                    if (worker) {
                        worker.postMessage(this.heartbeatIntervalMs)
                    } else {
                        setTimeout(() => doHeartbeat(), this.heartbeatIntervalMs)
                    }
                }

            );
        }

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
        this.heartbeat()
    }

}