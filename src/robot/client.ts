import { type ServiceType } from '@bufbuild/protobuf';
import { createClient, type Client, type Transport } from '@connectrpc/connect';
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
  GetModelsFromModulesRequest,
  RestartModuleRequest,
  TransformPCDRequest,
  TransformPoseRequest,
} from '../gen/robot/v1/robot_pb';
import { DiscoveryService } from '../gen/service/discovery/v1/discovery_connect';
import { MotionService } from '../gen/service/motion/v1/motion_connect';
import { NavigationService } from '../gen/service/navigation/v1/navigation_connect';
import { SLAMService } from '../gen/service/slam/v1/slam_connect';
import { VisionService } from '../gen/service/vision/v1/vision_connect';
import { dialDirect, dialWebRTC, type DialOptions } from '../rpc';
import { clientHeaders } from '../utils';
import GRPCConnectionManager from './grpc-connection-manager';
import type { Robot } from './robot';
import SessionManager from './session-manager';
import { MLModelService } from '../gen/service/mlmodel/v1/mlmodel_connect';
import type { AccessToken, Credential } from '../main';
import { WorldStateStoreService } from '../gen/service/worldstatestore/v1/world_state_store_connect';
import { assertExists } from '../assert';

interface ICEServer {
  urls: string;
  username?: string;
  credential?: string;
}

/** Options required to dial a robot via WebRTC. */
export interface DialWebRTCConf {
  host: string;
  credentials?: Credential | AccessToken;
  disableSessions?: boolean;
  noReconnect?: boolean;
  /** @default 10. */
  reconnectMaxAttempts?: number;

  /** @default Number.POSITIVE_INFINITY */
  reconnectMaxWait?: number;
  reconnectAbortSignal?: { abort: boolean };
  // WebRTC
  serviceHost?: string;
  signalingAddress: string;
  iceServers?: ICEServer[];
  priority?: number;

  /**
   * Set timeout in milliseconds for dialing. Default is defined by
   * DIAL_TIMEOUT. A value of 0 disables the timeout.
   */
  dialTimeout?: number;
}

/** Options required to dial a robot via gRPC. */
export interface DialDirectConf {
  host: string;
  credentials?: Credential | AccessToken;
  disableSessions?: boolean;
  noReconnect?: boolean;
  reconnectMaxAttempts?: number;
  reconnectMaxWait?: number;
  reconnectAbortSignal?: { abort: boolean };
  // set timeout in milliseconds for dialing. Default is defined by DIAL_TIMEOUT,
  // and a value of 0 would disable the timeout.
  dialTimeout?: number;
}

/** Options required to dial a robot. */
export type DialConf = DialDirectConf | DialWebRTCConf;

interface WebRTCOptions {
  enabled: boolean;
  host: string;
  signalingAddress: string;
  rtcConfig: RTCConfiguration;
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

export const isDialWebRTCConf = (value: DialConf): value is DialWebRTCConf => {
  const conf = value as DialWebRTCConf;

  if (typeof conf.signalingAddress !== 'string') {
    return false;
  }

  return !conf.iceServers || Array.isArray(conf.iceServers);
};

const isPosInt = (x: number): boolean => {
  return x > 0 && Number.isInteger(x);
};

/**
 * Validates a DialConf passed to createRobotClient. Throws an error for invalid
 * configs.
 */
export const validateDialConf = (conf: DialConf) => {
  if (conf.credentials && isCredential(conf.credentials)) {
    try {
      conf.credentials.authEntity = new URL(conf.credentials.authEntity).host;
    } catch (error) {
      if (!(error instanceof TypeError)) {
        throw error;
      }
    }
  }

  if (
    conf.reconnectMaxAttempts !== undefined &&
    !isPosInt(conf.reconnectMaxAttempts)
  ) {
    throw new Error(
      `Value of max reconnect attempts (${conf.reconnectMaxAttempts}) should be a positive integer`
    );
  }

  if (conf.reconnectMaxWait !== undefined && !isPosInt(conf.reconnectMaxWait)) {
    throw new Error(
      `Value of max reconnect wait (${conf.reconnectMaxWait}) should be a positive integer`
    );
  }
};

/**
 * A gRPC-web client for a Robot.
 *
 * @group Clients
 */
export class RobotClient extends EventDispatcher implements Robot {
  private serviceHost = '';

  private readonly webrtcOptions: WebRTCOptions = {
    enabled: false,
    host: '',
    signalingAddress: '',
    rtcConfig: {},
  };

  private readonly directOptions: DirectOptions = {};

  private readonly sessionOptions: SessionOptions = { disabled: false };

  private gRPCConnectionManager: GRPCConnectionManager;
  private sessionManager: SessionManager;

  private peerConn: RTCPeerConnection | undefined;
  private dataChannel: RTCDataChannel | undefined;

  private transport: Transport | undefined;

  private connecting: Promise<void> | undefined;

  private connectResolve: (() => void) | undefined;

  private savedCreds: Credentials | undefined;

  private closed: boolean;

  private robotServiceClient: Client<typeof RobotService> | undefined;

  private armServiceClient: Client<typeof ArmService> | undefined;

  private baseServiceClient: Client<typeof BaseService> | undefined;

  private boardServiceClient: Client<typeof BoardService> | undefined;

  private encoderServiceClient: Client<typeof EncoderService> | undefined;

  private gantryServiceClient: Client<typeof GantryService> | undefined;

  private genericServiceClient: Client<typeof GenericService> | undefined;

  private gripperServiceClient: Client<typeof GripperService> | undefined;

  private mlModelServiceClient: Client<typeof MLModelService> | undefined;

  private movementSensorServiceClient:
    | Client<typeof MovementSensorService>
    | undefined;

  private powerSensorServiceClient:
    | Client<typeof PowerSensorService>
    | undefined;

  private inputControllerServiceClient:
    | Client<typeof InputControllerService>
    | undefined;

  private motorServiceClient: Client<typeof MotorService> | undefined;

  private navigationServiceClient: Client<typeof NavigationService> | undefined;

  private discoveryServiceClient: Client<typeof DiscoveryService> | undefined;

  private motionServiceClient: Client<typeof MotionService> | undefined;

  private visionServiceClient: Client<typeof VisionService> | undefined;

  private servoServiceClient: Client<typeof ServoService> | undefined;

  private slamServiceClient: Client<typeof SLAMService> | undefined;

  private worldStateStoreServiceClient:
    | Client<typeof WorldStateStoreService>
    | undefined;

  private currentRetryAttempt = 0;

  private onICEConnectionStateChange?: () => void;
  private onDataChannelClose?: (event: Event) => void;
  private onTrack?: (event: RTCTrackEvent) => void;

  constructor(
    serviceHost?: string,
    webrtcOptions?: WebRTCOptions,
    sessionOptions?: SessionOptions,
    directOptions?: DirectOptions
  ) {
    super();

    if (serviceHost !== undefined) {
      this.serviceHost = serviceHost;
    }

    if (webrtcOptions) {
      this.webrtcOptions = webrtcOptions;
    }

    if (directOptions) {
      this.directOptions = directOptions;
    }

    if (sessionOptions) {
      this.sessionOptions = sessionOptions;
    }

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
    this.sessionManager = new SessionManager(
      this.serviceHost,
      (): Transport => {
        if (!this.transport) {
          throw new Error(RobotClient.notConnectedYetStr);
        }
        return this.transport;
      }
    );

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

  private cleanupEventListeners() {
    if (this.peerConn && this.onICEConnectionStateChange) {
      this.peerConn.removeEventListener(
        'iceconnectionstatechange',
        this.onICEConnectionStateChange
      );

      this.onICEConnectionStateChange = undefined;
    }

    if (this.peerConn && this.onTrack) {
      this.peerConn.removeEventListener('track', this.onTrack);
      this.onTrack = undefined;
    }

    if (this.dataChannel && this.onDataChannelClose) {
      this.dataChannel.removeEventListener('close', this.onDataChannelClose);
      this.onDataChannelClose = undefined;
    }
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

        this.currentRetryAttempt = attemptNumber;

        // Always retry the next attempt if not closed
        return !this.closed;
      },
    };

    if (this.reconnectMaxWait !== undefined) {
      backOffOpts.maxDelay = this.reconnectMaxWait;
    }

    if (this.reconnectMaxAttempts !== undefined) {
      backOffOpts.numOfAttempts = this.reconnectMaxAttempts;
    }

    this.currentRetryAttempt = 0;

    void backOff(async () => this.connect(), backOffOpts)
      .then(() => {
        // eslint-disable-next-line no-console
        console.debug('Reconnected successfully!');
      })
      .catch((error) => {
        if (
          this.reconnectMaxAttempts !== undefined &&
          this.currentRetryAttempt >= this.reconnectMaxAttempts
        ) {
          // eslint-disable-next-line no-console
          console.debug(`Reached max attempts: ${this.reconnectMaxAttempts}`);
          return;
        }

        // eslint-disable-next-line no-console
        console.error(error);
      });
  }

  private get noReconnect() {
    return this.webrtcOptions.noReconnect ?? this.directOptions.noReconnect;
  }

  private get reconnectMaxAttempts() {
    return (
      this.webrtcOptions.reconnectMaxAttempts ??
      this.directOptions.reconnectMaxAttempts
    );
  }

  private get reconnectMaxWait() {
    return (
      this.webrtcOptions.reconnectMaxWait ?? this.directOptions.reconnectMaxWait
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
    this.armServiceClient ??= this.createServiceClient(ArmService);
    return this.armServiceClient;
  }

  get baseService() {
    this.baseServiceClient ??= this.createServiceClient(BaseService);
    return this.baseServiceClient;
  }

  get boardService() {
    this.boardServiceClient ??= this.createServiceClient(BoardService);
    return this.boardServiceClient;
  }

  get encoderService() {
    this.encoderServiceClient ??= this.createServiceClient(EncoderService);
    return this.encoderServiceClient;
  }

  get gantryService() {
    this.gantryServiceClient ??= this.createServiceClient(GantryService);
    return this.gantryServiceClient;
  }

  get genericService() {
    this.genericServiceClient ??= this.createServiceClient(GenericService);
    return this.genericServiceClient;
  }

  get gripperService() {
    this.gripperServiceClient ??= this.createServiceClient(GripperService);
    return this.gripperServiceClient;
  }

  get mlModelService() {
    this.mlModelServiceClient ??= this.createServiceClient(MLModelService);
    return this.mlModelServiceClient;
  }

  get movementSensorService() {
    this.movementSensorServiceClient ??= this.createServiceClient(
      MovementSensorService
    );
    return this.movementSensorServiceClient;
  }

  get powerSensorService() {
    this.powerSensorServiceClient ??=
      this.createServiceClient(PowerSensorService);
    return this.powerSensorServiceClient;
  }

  get inputControllerService() {
    this.inputControllerServiceClient ??= this.createServiceClient(
      InputControllerService
    );
    return this.inputControllerServiceClient;
  }

  get motorService() {
    this.motorServiceClient ??= this.createServiceClient(MotorService);
    return this.motorServiceClient;
  }

  get navigationService() {
    this.navigationServiceClient ??=
      this.createServiceClient(NavigationService);
    return this.navigationServiceClient;
  }

  get discoveryService() {
    this.discoveryServiceClient ??= this.createServiceClient(DiscoveryService);
    return this.discoveryServiceClient;
  }

  get motionService() {
    this.motionServiceClient ??= this.createServiceClient(MotionService);
    return this.motionServiceClient;
  }

  get visionService() {
    this.visionServiceClient ??= this.createServiceClient(VisionService);
    return this.visionServiceClient;
  }

  get servoService() {
    this.servoServiceClient ??= this.createServiceClient(ServoService);
    return this.servoServiceClient;
  }

  get slamService() {
    this.slamServiceClient ??= this.createServiceClient(SLAMService);
    return this.slamServiceClient;
  }

  get worldStateStoreService() {
    this.worldStateStoreServiceClient ??= this.createServiceClient(
      WorldStateStoreService
    );
    return this.worldStateStoreServiceClient;
  }

  createServiceClient<T extends ServiceType>(svcType: T): Client<T> {
    assertExists(this.clientTransport, RobotClient.notConnectedYetStr);
    return createClient(svcType, this.clientTransport);
  }

  get peerConnection() {
    return this.peerConn;
  }

  private get clientTransport() {
    return this.sessionOptions.disabled
      ? this.transport
      : this.sessionManager.transport;
  }

  private async dialWebRTC(conf: DialWebRTCConf) {
    this.emit('dialing', {
      method: 'webrtc',
      attempt: this.currentRetryAttempt,
    });

    this.serviceHost = conf.serviceHost ?? conf.host;
    this.sessionManager.setHost(this.serviceHost);

    this.webrtcOptions.enabled = true;
    this.webrtcOptions.host = conf.host;
    this.webrtcOptions.signalingAddress = conf.signalingAddress;
    this.webrtcOptions.rtcConfig.iceServers = conf.iceServers ?? [];
    this.webrtcOptions.noReconnect = conf.noReconnect;
    this.webrtcOptions.reconnectMaxWait = conf.reconnectMaxWait;
    this.webrtcOptions.reconnectMaxAttempts = conf.reconnectMaxAttempts;

    this.sessionOptions.disabled = conf.disableSessions ?? false;

    await this.connect({
      priority: conf.priority,
      dialTimeout: conf.dialTimeout ?? DIAL_TIMEOUT,
      creds: conf.credentials,
    });

    return this;
  }

  private async dialDirect(conf: DialDirectConf) {
    this.emit('dialing', {
      method: 'grpc',
      attempt: this.currentRetryAttempt,
    });

    /** Check if a url corresponds to a local connection via heuristic */
    if (!conf.host.includes('local')) {
      throw new Error(
        `cannot dial "${conf.host}" directly, please use a local url instead.`
      );
    }

    this.serviceHost = conf.host;
    this.sessionManager.setHost(this.serviceHost);

    this.webrtcOptions.enabled = false;

    this.directOptions.noReconnect = conf.noReconnect;
    this.directOptions.reconnectMaxWait = conf.reconnectMaxWait;
    this.directOptions.reconnectMaxAttempts = conf.reconnectMaxAttempts;

    this.sessionOptions.disabled = conf.disableSessions ?? false;

    await this.connect({
      creds: conf.credentials,
      dialTimeout: conf.dialTimeout ?? DIAL_TIMEOUT,
    });

    return this;
  }

  public async dial(conf: DialConf) {
    validateDialConf(conf);

    const backOffOpts: Partial<IBackOffOptions> = {
      retry: (error, attemptNumber) => {
        // TODO: This ought to check exceptional errors so as to not keep failing forever.

        // eslint-disable-next-line no-console
        console.debug(
          `Failed to connect, attempt ${attemptNumber} with backoff`,
          error
        );

        this.currentRetryAttempt = attemptNumber;

        const aborted = conf.reconnectAbortSignal?.abort ?? false;

        // Retry if not closed or aborted
        return !aborted && !this.closed;
      },
    };

    if (conf.reconnectMaxWait !== undefined) {
      backOffOpts.maxDelay = conf.reconnectMaxWait;
    }

    backOffOpts.numOfAttempts = conf.noReconnect
      ? 1
      : conf.reconnectMaxAttempts;

    this.currentRetryAttempt = 0;

    let dialWebRTCError: Error | undefined;
    let dialDirectError: Error | undefined;

    // Try to dial via WebRTC first.
    if (isDialWebRTCConf(conf) && !conf.reconnectAbortSignal?.abort) {
      try {
        return await backOff(async () => this.dialWebRTC(conf), backOffOpts);
      } catch (error) {
        dialWebRTCError =
          error instanceof Error ? error : new Error(String(error));
        // eslint-disable-next-line no-console
        console.debug('Failed to connect via WebRTC', dialWebRTCError);
        this.emit(MachineConnectionEvent.DISCONNECTED, {
          error: dialWebRTCError,
        });
      }
    }

    this.currentRetryAttempt = 0;

    if (!conf.reconnectAbortSignal?.abort) {
      try {
        return await backOff(async () => this.dialDirect(conf), backOffOpts);
      } catch (error) {
        dialDirectError =
          error instanceof Error ? error : new Error(String(error));
        // eslint-disable-next-line no-console
        console.debug('Failed to connect via gRPC', dialDirectError);
        this.emit(MachineConnectionEvent.DISCONNECTED, {
          error: dialDirectError,
        });
      }
    }

    if (dialWebRTCError && dialDirectError) {
      throw new Error('Failed to connect via all methods', {
        cause: [dialWebRTCError, dialDirectError],
      });
    }

    return this;
  }

  public async disconnect() {
    this.emit(MachineConnectionEvent.DISCONNECTING, {});

    while (this.connecting) {
      // eslint-disable-next-line no-await-in-loop
      await this.connecting;
    }

    this.cleanupEventListeners();

    if (this.peerConn) {
      this.peerConn.close();
      this.peerConn = undefined;
    }

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = undefined;
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

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = undefined;
    }

    /*
     * Only reset session if credentials have changed or if explicitly required;
     * otherwise our session and authentication context will no longer match.
     */
    if (!creds || creds !== this.savedCreds || this.sessionOptions.disabled) {
      this.sessionManager.reset();
    }

    try {
      const opts: DialOptions = {
        webrtcOptions: {
          disableTrickleICE: false,
          rtcConfig: this.webrtcOptions.rtcConfig,
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

      if (this.webrtcOptions.enabled) {
        // This should not have to be checked but tsc can't tell the difference...
        if (opts.webrtcOptions) {
          opts.webrtcOptions.signalingCredentials = opts.credentials;
        }

        const signalingAddress =
          this.webrtcOptions.signalingAddress || this.serviceHost;
        const webRTCConn = await dialWebRTC(
          signalingAddress,
          this.webrtcOptions.host,
          opts,
          this.serviceHost !== '' && signalingAddress !== this.serviceHost
        );

        this.peerConn = webRTCConn.peerConnection;
        this.dataChannel = webRTCConn.dataChannel;

        this.cleanupEventListeners();

        this.onICEConnectionStateChange = () => {
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
        };

        this.peerConn.addEventListener(
          'iceconnectionstatechange',
          this.onICEConnectionStateChange
        );

        // There is not an iceconnectionstatechange nor connectionstatechange
        // event when the peerConn closes. Instead, listen to the data channel
        // closing and emit disconnect when that occurs.
        this.onDataChannelClose = (event: Event) => this.onDisconnect(event);
        this.dataChannel.addEventListener('close', this.onDataChannelClose);

        this.transport = webRTCConn.transport;

        this.onTrack = (event: RTCTrackEvent) => {
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
        };

        this.peerConn.addEventListener('track', this.onTrack);
      } else {
        this.transport = await dialDirect(this.serviceHost, opts);
        await this.gRPCConnectionManager.start();
      }

      const clientTransport = this.sessionOptions.disabled
        ? this.transport
        : this.sessionManager.transport;

      this.robotServiceClient = createClient(RobotService, clientTransport);

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
      this.connecting = undefined;
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

  // GET MODELS FROM MODULES

  async getModelsFromModules() {
    const request = new GetModelsFromModulesRequest({});
    const resp = await this.robotService.getModelsFromModules(request);
    return resp.models;
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

  // VERSION INFO

  async getVersion() {
    return this.robotService.getVersion({});
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
