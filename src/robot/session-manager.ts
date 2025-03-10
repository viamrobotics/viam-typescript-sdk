/* eslint-disable max-depth */
import {
  BinaryReader,
  FileDescriptorProto,
  MethodOptions,
} from '@bufbuild/protobuf';
import {
  Code,
  ConnectError,
  createClient,
  type Transport,
} from '@connectrpc/connect';
import { createAsyncIterable } from '@connectrpc/connect/protocol';
import { safety_heartbeat_monitored as safteyHeartbeatMonitored } from '../gen/common/v1/common_pb';
import { ServerReflection } from '../gen/grpc/reflection/v1/reflection_connect';
import {
  FileDescriptorResponse,
  ListServiceResponse,
  ServerReflectionRequest,
} from '../gen/grpc/reflection/v1/reflection_pb';
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
  public static heartbeatMonitoredMethods: Record<string, boolean> = {};

  public readonly transport: Transport;

  private currentSessionID = '';
  private sessionsSupported: boolean | undefined;
  private heartbeatIntervalMs: number | undefined;
  private host = '';

  private starting: Promise<void> | undefined;

  private get client() {
    const transport = this.deferredTransport();
    return createClient(RobotService, transport);
  }

  constructor(
    host: string,
    private deferredTransport: () => Transport
  ) {
    this.host = host;
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
        await this.applyHeartbeatMonitoredMethods();
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

  private async applyHeartbeatMonitoredMethods(): Promise<void> {
    try {
      const client = createClient(ServerReflection, this.transport);
      const request = new ServerReflectionRequest({
        host: this.host,
        messageRequest: { case: 'listServices', value: '' },
      });
      const responseStream = client.serverReflectionInfo(
        createAsyncIterable([request]),
        { timeoutMs: 10_000 }
      );
      for await (const serviceResponse of responseStream) {
        const fdpRequests = (
          serviceResponse.messageResponse.value as ListServiceResponse
        ).service.map((service) => {
          return new ServerReflectionRequest({
            messageRequest: { case: 'fileContainingSymbol', value: service.name },
          });
        });
        const fdpResponseStream = client.serverReflectionInfo(
          createAsyncIterable(fdpRequests),
          { timeoutMs: 10_000 }
        );
        for await (const fdpResponse of fdpResponseStream) {
          for (const fdp of (
            fdpResponse.messageResponse.value as FileDescriptorResponse
          ).fileDescriptorProto) {
            const protoFile = FileDescriptorProto.fromBinary(fdp);
            for (const service of protoFile.service) {
              for (const method of service.method) {
                SessionManager.heartbeatMonitoredMethods[
                  `/${protoFile.package}.${service.name}/${method.name}`
                ] = SessionManager.hasHeartbeatOption(method.options);
              }
            }
          }
        }
      }
    } catch {
      // If can't get heartbeat monitored methods via reflection, use defaults.
      SessionManager.heartbeatMonitoredMethods = {
        "/viam.component.arm.v1.ArmService/MoveToPosition": true,
        "/viam.component.arm.v1.ArmService/MoveToJointPositions": true,
        "/viam.component.arm.v1.ArmService/MoveThroughJointPositions": true,
        "/viam.component.base.v1.BaseService/MoveStraight": true,
        "/viam.component.base.v1.BaseService/Spin": true,
        "/viam.component.base.v1.BaseService/SetPower": true,
        "/viam.component.base.v1.BaseService/SetVelocity": true,
        "/viam.component.gantry.v1.GantryService/MoveToPosition": true,
        "/viam.component.gripper.v1.GripperService/Open": true,
        "/viam.component.gripper.v1.GripperService/Grab": true,
        "/viam.component.motor.v1.MotorService/SetPower": true,
        "/viam.component.motor.v1.MotorService/GoFor": true,
        "/viam.component.motor.v1.MotorService/GoTo": true,
        "/viam.component.motor.v1.MotorService/SetRPM": true,
        "/viam.component.servo.v1.ServoService/Move": true,
      }
    }
  }

  private static hasHeartbeatOption(options?: MethodOptions): boolean {
    if (!options) {
      return false;
    }
    const reader = new BinaryReader(options.toBinary());
    while (reader.pos < reader.len) {
      const tag = reader.tag();
      const [fieldNumber] = tag;
      if (fieldNumber === safteyHeartbeatMonitored.field.no) {
        return true;
      }
      reader.string();
    }
    return false;
  }
}
