/* eslint-disable max-classes-per-file */
import { type ServiceType } from '@bufbuild/protobuf';
import {
  createPromiseClient,
  type PromiseClient,
  type Transport,
} from '@connectrpc/connect';
import { backOff, type IBackOffOptions } from 'exponential-backoff';
import { isCredential, type Credentials } from '../app/viam-transport';
import { DIAL_TIMEOUT } from '../constants';
import { EventDispatcher, MachineConnectionEvent } from '../events';
import type { PoseInFrame, Transform } from '../gen/common/v1/common_pb';
import { ArmService } from '../gen/component/arm/v1/arm_connect';
import { BaseService } from '../gen/component/base/v1/base_connect';
import { BoardService } from '../gen/component/board/v1/board_connect';
import { EncoderService } from '../gen/component/encoder/v1/encoder_connect';
import { GantryService } from '../gen/component/gantry/v1/gantry_connect';
import { GenericService } from '../gen/component/generic/v1/generic_connect';
import { GripperService } from '../gen/component/gripper/v1/gripper_connect';
import { InputControllerService } from '../gen/component/inputcontroller/v1/input_controller_connect';
import { MotorService } from '../gen/component/motor/v1/motor_connect';
import { MovementSensorService } from '../gen/component/movementsensor/v1/movementsensor_connect';
import { PowerSensorService } from '../gen/component/powersensor/v1/powersensor_connect';
import { ServoService } from '../gen/component/servo/v1/servo_connect';
import { RobotService } from '../gen/robot/v1/robot_connect';
import {
  DiscoveryQuery,
  RestartModuleRequest,
  TransformPCDRequest,
  TransformPoseRequest,
} from '../gen/robot/v1/robot_pb';
import { MotionService } from '../gen/service/motion/v1/motion_connect';
import { NavigationService } from '../gen/service/navigation/v1/navigation_connect';
import { SLAMService } from '../gen/service/slam/v1/slam_connect';
import { VisionService } from '../gen/service/vision/v1/vision_connect';
import { dialDirect, dialWebRTC, type DialOptions } from '../rpc';
import { clientHeaders } from '../utils';
import GRPCConnectionManager from './grpc-connection-manager';
import type { Robot } from './robot';
import SessionManager from './session-manager';

interface WebRTCOptions {
  enabled: boolean;
  host: string;
  signalingAddress: string;
  rtcConfig: RTCConfiguration | undefined;
  noReconnect?: boolean;
  reconnectMaxAttempts?: number;
  reconnectMaxWait?: number;
}

interface DirectOptions {
  noReconnect?: boolean;
  reconnectMaxAttempts?: number;
  reconnectMaxWait?: number;
}

interface SessionOptions {
  disabled: boolean;
}

export interface ConnectOptions {
  creds?: Credentials;
  priority?: number;

  // set timeout in milliseconds for dialing. Default is defined by DIAL_TIMEOUT,
  // and a value of 0 would disable the timeout.
  dialTimeout?: number;
}

/**
 * A gRPC-web client for a Robot.
 *
 * @group Clients
 */
export class RobotClient extends EventDispatcher implements Robot {
  private readonly serviceHost: string;
  private readonly webrtcOptions: WebRTCOptions | undefined;
  private readonly directOptions: DirectOptions | undefined;
  private readonly sessionOptions: SessionOptions | undefined;
  private gRPCConnectionManager: GRPCConnectionManager;
  private sessionManager: SessionManager;

  private peerConn: RTCPeerConnection | undefined;

  private transport: Transport | undefined;

  private connecting: Promise<void> | undefined;

  private connectResolve: (() => void) | undefined;

  private savedCreds: Credentials | undefined;

  private closed: boolean;

  private robotServiceClient: PromiseClient<typeof RobotService> | undefined;

  private armServiceClient: PromiseClient<typeof ArmService> | undefined;

  private baseServiceClient: PromiseClient<typeof BaseService> | undefined;

  private boardServiceClient: PromiseClient<typeof BoardService> | undefined;

  private encoderServiceClient:
    | PromiseClient<typeof EncoderService>
    | undefined;

  private gantryServiceClient: PromiseClient<typeof GantryService> | undefined;

  private genericServiceClient:
    | PromiseClient<typeof GenericService>
    | undefined;

  private gripperServiceClient:
    | PromiseClient<typeof GripperService>
    | undefined;

  private movementSensorServiceClient:
    | PromiseClient<typeof MovementSensorService>
    | undefined;

  private powerSensorServiceClient:
    | PromiseClient<typeof PowerSensorService>
    | undefined;

  private inputControllerServiceClient:
    | PromiseClient<typeof InputControllerService>
    | undefined;

  private motorServiceClient: PromiseClient<typeof MotorService> | undefined;

  private navigationServiceClient:
    | PromiseClient<typeof NavigationService>
    | undefined;

  private motionServiceClient: PromiseClient<typeof MotionService> | undefined;

  private visionServiceClient: PromiseClient<typeof VisionService> | undefined;

  private servoServiceClient: PromiseClient<typeof ServoService> | undefined;

  private slamServiceClient: PromiseClient<typeof SLAMService> | undefined;

  constructor(
    serviceHost: string,
    webrtcOptions?: WebRTCOptions,
    sessionOptions?: SessionOptions,
    directOptions?: DirectOptions
  ) {
    super();
    this.serviceHost = serviceHost;
    this.webrtcOptions = webrtcOptions;
    this.directOptions = directOptions;
    this.sessionOptions = sessionOptions;
    this.gRPCConnectionManager = new GRPCConnectionManager(
      (): Transport => {
        if (!this.transport) {
          throw new Error(RobotClient.notConnectedYetStr);
        }
        return this.transport;
      },
      () => {
        this.onDisconnect();
      }
    );
    this.sessionManager = new SessionManager((): Transport => {
      if (!this.transport) {
        throw new Error(RobotClient.notConnectedYetStr);
      }
      return this.transport;
    });

    // For each connection event type, add a listener to capture that
    // event and re-emit it with the 'connectionstatechange' event
    // name. This makes it so consumers can listen to all connection
    // state change events without needing to individually subscribe
    // to all of them. 'connectionstatechange' should not be emitted
    // directly. Instead, the RobotClient implementation should emit
    // MachineConnectionEvents.
    for (const eventType of Object.values(MachineConnectionEvent)) {
      this.on(eventType, () => {
        this.emit('connectionstatechange', { eventType });
      });
    }

    this.closed = false;
  }

  private onDisconnect(event?: Event) {
    this.emit(MachineConnectionEvent.DISCONNECTED, event ?? {});

    if (this.noReconnect !== undefined && this.noReconnect) {
      return;
    }

    if (this.closed) {
      return;
    }

    // eslint-disable-next-line no-console
    console.debug('Connection closed, will try to reconnect');
    const backOffOpts: Partial<IBackOffOptions> = {
      retry: (error, attemptNumber) => {
        // TODO: This ought to check exceptional errors so as to not keep failing forever.

        // eslint-disable-next-line no-console
        console.debug(
          `Failed to connect, attempt ${attemptNumber} with backoff`,
          error
        );

        // Always retry the next attempt
        return true;
      },
    };
    if (this.reconnectMaxWait !== undefined) {
      backOffOpts.maxDelay = this.reconnectMaxWait;
    }
    if (this.reconnectMaxAttempts !== undefined) {
      backOffOpts.numOfAttempts = this.reconnectMaxAttempts;
    }
    void backOff(async () => this.connect(), backOffOpts)
      .then(() => {
        // eslint-disable-next-line no-console
        console.debug('Reconnected successfully!');
      })
      .catch(() => {
        // eslint-disable-next-line no-console
        console.debug(`Reached max attempts: ${this.reconnectMaxAttempts}`);
      });
  }

  private get noReconnect() {
    return this.webrtcOptions?.noReconnect ?? this.directOptions?.noReconnect;
  }

  private get reconnectMaxAttempts() {
    return (
      this.webrtcOptions?.reconnectMaxAttempts ??
      this.directOptions?.reconnectMaxAttempts
    );
  }

  private get reconnectMaxWait() {
    return (
      this.webrtcOptions?.reconnectMaxWait ??
      this.directOptions?.reconnectMaxWait
    );
  }

  get sessionId() {
    return this.sessionManager.sessionID;
  }

  private static readonly notConnectedYetStr = 'not connected yet';

  get robotService() {
    if (!this.robotServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.robotServiceClient;
  }

  get armService() {
    if (!this.armServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.armServiceClient;
  }

  get baseService() {
    if (!this.baseServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.baseServiceClient;
  }

  get boardService() {
    if (!this.boardServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.boardServiceClient;
  }

  get encoderService() {
    if (!this.encoderServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.encoderServiceClient;
  }

  get gantryService() {
    if (!this.gantryServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.gantryServiceClient;
  }

  get genericService() {
    if (!this.genericServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.genericServiceClient;
  }

  get gripperService() {
    if (!this.gripperServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.gripperServiceClient;
  }

  get movementSensorService() {
    if (!this.movementSensorServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.movementSensorServiceClient;
  }

  get powerSensorService() {
    if (!this.powerSensorServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.powerSensorServiceClient;
  }

  get inputControllerService() {
    if (!this.inputControllerServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.inputControllerServiceClient;
  }

  get motorService() {
    if (!this.motorServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.motorServiceClient;
  }

  get navigationService() {
    if (!this.navigationServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.navigationServiceClient;
  }

  get motionService() {
    if (!this.motionServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.motionServiceClient;
  }

  get visionService() {
    if (!this.visionServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.visionServiceClient;
  }

  get servoService() {
    if (!this.servoServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.servoServiceClient;
  }

  get slamService() {
    if (!this.slamServiceClient) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return this.slamServiceClient;
  }

  createServiceClient<T extends ServiceType>(svcType: T): PromiseClient<T> {
    const clientTransport = this.sessionOptions?.disabled
      ? this.transport
      : this.sessionManager.transport;

    if (!clientTransport) {
      throw new Error(RobotClient.notConnectedYetStr);
    }
    return createPromiseClient(svcType, clientTransport);
  }

  get peerConnection() {
    return this.peerConn;
  }

  public async disconnect() {
    this.emit(MachineConnectionEvent.DISCONNECTING, {});
    while (this.connecting) {
      // eslint-disable-next-line no-await-in-loop
      await this.connecting;
    }

    if (this.peerConn) {
      this.peerConn.close();
      this.peerConn = undefined;
    }
    this.sessionManager.reset();
    this.closed = true;
    this.emit(MachineConnectionEvent.DISCONNECTED, {});
  }

  public isConnected(): boolean {
    return this.peerConn?.iceConnectionState === 'connected';
  }

  // TODO(RSDK-7672): refactor due to cognitive complexity
  // eslint-disable-next-line sonarjs/cognitive-complexity
  public async connect({
    creds = this.savedCreds,
    priority,
    dialTimeout,
  }: ConnectOptions = {}) {
    this.emit(MachineConnectionEvent.CONNECTING, {});
    this.closed = false;

    if (this.connecting) {
      // This lint is clearly wrong due to how the event loop works such that after an await, the condition may no longer be true.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (this.connecting !== undefined) {
        // eslint-disable-next-line no-await-in-loop
        await this.connecting;
      }
      return;
    }
    this.connecting = new Promise<void>((resolve) => {
      this.connectResolve = resolve;
    });

    if (this.peerConn) {
      this.peerConn.close();
      this.peerConn = undefined;
    }

    /*
     * TODO(RSDK-887): no longer reset if we are reusing authentication material; otherwise our session
     * and authentication context will no longer match.
     */
    this.sessionManager.reset();

    try {
      const opts: DialOptions = {
        webrtcOptions: {
          disableTrickleICE: false,
          rtcConfig: this.webrtcOptions?.rtcConfig,
        },
        dialTimeout: dialTimeout ?? DIAL_TIMEOUT,
        extraHeaders: clientHeaders,
      };

      if (creds) {
        if (isCredential(creds)) {
          opts.credentials = creds;
        } else {
          opts.accessToken = creds.payload;
        }
      }

      // Webrtcoptions will always be defined, but TS doesn't know this
      if (priority !== undefined && opts.webrtcOptions) {
        opts.webrtcOptions.additionalSdpFields = { 'x-priority': priority };
      }

      // Save creds
      this.savedCreds = creds;

      if (this.webrtcOptions?.enabled) {
        // This should not have to be checked but tsc can't tell the difference...
        if (opts.webrtcOptions) {
          opts.webrtcOptions.signalingCredentials = opts.credentials;
        }

        const webRTCConn = await dialWebRTC(
          this.webrtcOptions.signalingAddress || this.serviceHost,
          this.webrtcOptions.host,
          opts
        );

        /*
         * Lint disabled because we know that we are the only code to
         * read and then write to 'peerConn', even after we have awaited/paused.
         */
        this.peerConn = webRTCConn.peerConnection; // eslint-disable-line require-atomic-updates
        this.peerConn.addEventListener('iceconnectionstatechange', () => {
          /*
           * TODO: are there any disconnection scenarios where we can reuse the
           * same connection and restart ice?
           *
           * All connection loss scenarios I tested seem to result in the peer
           * connection getting closed, so restarting ice is not a valid way to
           * recover.
           */
          if (this.peerConn?.iceConnectionState === 'connected') {
            this.emit(MachineConnectionEvent.CONNECTED, {});
          } else if (this.peerConn?.iceConnectionState === 'closed') {
            this.onDisconnect();
          }
        });
        // There is not an iceconnectionstatechange nor connectionstatechange
        // event when the peerConn closes. Instead, listen to the data channel
        // closing and emit disconnect when that occurs.
        webRTCConn.dataChannel.addEventListener('close', (event) => {
          this.onDisconnect(event);
        });

        this.transport = webRTCConn.transport;

        webRTCConn.peerConnection.addEventListener('track', (event) => {
          const [eventStream] = event.streams;
          if (!eventStream) {
            this.emit('track', event);
            throw new Error('expected event stream to exist');
          }

          /*
           * Track id has +s to conform to RFC 4566 (https://www.rfc-editor.org/rfc/rfc4566)
           * where names should not contain colons.
           */
          const resName = eventStream.id.replaceAll('+', ':');
          // Overriding the stream id to match the resource name
          Object.defineProperty(eventStream, 'id', {
            value: resName,
          });
          this.emit('track', event);
        });
      } else {
        this.transport = await dialDirect(this.serviceHost, opts);
        await this.gRPCConnectionManager.start();
      }

      const clientTransport = this.sessionOptions?.disabled
        ? this.transport
        : this.sessionManager.transport;

      this.robotServiceClient = createPromiseClient(
        RobotService,
        clientTransport
      );
      // eslint-disable-next-line no-warning-comments
      // TODO(RSDK-144): these should be created as needed
      this.armServiceClient = createPromiseClient(ArmService, clientTransport);
      this.baseServiceClient = createPromiseClient(
        BaseService,
        clientTransport
      );
      this.boardServiceClient = createPromiseClient(
        BoardService,
        clientTransport
      );
      this.encoderServiceClient = createPromiseClient(
        EncoderService,
        clientTransport
      );
      this.gantryServiceClient = createPromiseClient(
        GantryService,
        clientTransport
      );
      this.genericServiceClient = createPromiseClient(
        GenericService,
        clientTransport
      );
      this.gripperServiceClient = createPromiseClient(
        GripperService,
        clientTransport
      );
      this.movementSensorServiceClient = createPromiseClient(
        MovementSensorService,
        clientTransport
      );
      this.powerSensorServiceClient = createPromiseClient(
        PowerSensorService,
        clientTransport
      );
      this.inputControllerServiceClient = createPromiseClient(
        InputControllerService,
        clientTransport
      );
      this.motorServiceClient = createPromiseClient(
        MotorService,
        clientTransport
      );
      this.navigationServiceClient = createPromiseClient(
        NavigationService,
        clientTransport
      );
      this.motionServiceClient = createPromiseClient(
        MotionService,
        clientTransport
      );
      this.visionServiceClient = createPromiseClient(
        VisionService,
        clientTransport
      );
      this.servoServiceClient = createPromiseClient(
        ServoService,
        clientTransport
      );
      this.slamServiceClient = createPromiseClient(
        SLAMService,
        clientTransport
      );

      this.emit(MachineConnectionEvent.CONNECTED, {});
    } catch (error) {
      // Need to catch the error to properly emit disconnect but
      // also throw the error so reconnect backoff keeps retrying.
      // TODO(ethanlook): clean this up
      this.emit(MachineConnectionEvent.DISCONNECTED, {});
      throw error;
    } finally {
      this.connectResolve?.();
      this.connectResolve = undefined;

      /*
       * Lint disabled because we know that we are the only code to
       * read and then write to 'connecting', even after we have awaited/paused.
       */
      this.connecting = undefined; // eslint-disable-line require-atomic-updates
    }
  }

  // SESSIONS

  async getSessions() {
    const resp = await this.robotService.getSessions({});
    return resp.sessions;
  }

  // OPERATIONS

  async getOperations() {
    const resp = await this.robotService.getOperations({});
    return resp.operations;
  }

  async cancelOperation(id: string) {
    await this.robotService.cancelOperation({ id });
  }

  async blockForOperation(id: string) {
    await this.robotService.blockForOperation({ id });
  }

  async stopAll() {
    await this.robotService.stopAll({});
  }

  // FRAME SYSTEM

  async frameSystemConfig(transforms: Transform[]) {
    const resp = await this.robotService.frameSystemConfig({
      supplementalTransforms: transforms,
    });
    return resp.frameSystemConfigs;
  }

  async transformPose(
    source: PoseInFrame,
    destination: string,
    supplementalTransforms: Transform[]
  ) {
    const request = new TransformPoseRequest({
      source,
      destination,
      supplementalTransforms,
    });
    const response = await this.robotService.transformPose(request);
    const result = response.pose;
    if (!result) {
      // eslint-disable-next-line no-warning-comments
      // TODO: Can the response frame be undefined or null?
      throw new Error('no pose');
    }
    return result;
  }

  async transformPCD(
    pointCloudPCD: Uint8Array,
    source: string,
    destination: string
  ) {
    const request = new TransformPCDRequest({
      pointCloudPcd: pointCloudPCD,
      source,
      destination,
    });
    const resp = await this.robotService.transformPCD(request);
    return resp.pointCloudPcd;
  }

  // DISCOVERY

  async discoverComponents(queries: DiscoveryQuery[]) {
    const resp = await this.robotService.discoverComponents({
      queries,
    });
    return resp.discovery;
  }

  // GET CLOUD METADATA

  async getCloudMetadata() {
    return this.robotService.getCloudMetadata({});
  }

  // RESOURCES

  async resourceNames() {
    const resp = await this.robotService.resourceNames({});
    return resp.resources;
  }

  async resourceRPCSubtypes() {
    const resp = await this.robotService.resourceRPCSubtypes({});
    return resp.resourceRpcSubtypes;
  }

  // MACHINE STATUS

  async getMachineStatus() {
    return this.robotService.getMachineStatus({});
  }

  // MODULES

  async restartModule(moduleId?: string, moduleName?: string) {
    const request = new RestartModuleRequest();
    if (moduleId !== undefined) {
      request.idOrName.case = 'moduleId';
      request.idOrName.value = moduleId;
    }
    if (moduleName !== undefined) {
      request.idOrName.case = 'moduleName';
      request.idOrName.value = moduleName;
    }
    await this.robotService.restartModule(request);
  }
}
