import { grpc } from '@improbable-eng/grpc-web';
import type { ProtobufMessage } from '@improbable-eng/grpc-web/dist/typings/message';
import { Code } from '../gen/google/rpc/code_pb';
import { Status } from '../gen/google/rpc/status_pb';
import {
  AuthenticateRequest,
  AuthenticateResponse,
  AuthenticateToRequest,
  AuthenticateToResponse,
  Credentials as PBCredentials,
} from '../gen/proto/rpc/v1/auth_pb';
import {
  AuthService,
  ExternalAuthService,
} from '../gen/proto/rpc/v1/auth_pb_service';
import {
  CallRequest,
  CallResponse,
  CallUpdateRequest,
  CallUpdateResponse,
  ICECandidate,
  OptionalWebRTCConfigRequest,
  OptionalWebRTCConfigResponse,
  WebRTCConfig,
} from '../gen/proto/rpc/webrtc/v1/signaling_pb';
import { SignalingService } from '../gen/proto/rpc/webrtc/v1/signaling_pb_service';
import { ClientChannel } from './client-channel';
import { ConnectionClosedError } from './connection-closed-error';
import { addSdpFields, newPeerConnectionForClient } from './peer';

import type { CrossBrowserHttpTransportInit } from '@improbable-eng/grpc-web/dist/typings/transports/http/http';
import { atob, btoa } from './polyfills';

export interface DialOptions {
  authEntity?: string | undefined;
  credentials?: Credentials | undefined;
  webrtcOptions?: DialWebRTCOptions;
  externalAuthAddress?: string | undefined;
  externalAuthToEntity?: string | undefined;

  // `accessToken` allows a pre-authenticated client to dial with
  // an authorization header. Direct dial will have the access token
  // appended to the "Authorization: Bearer" header. WebRTC dial will
  // appened it to the signaling server communication
  //
  // If enabled, other auth options have no affect. Eg. authEntity, credentials,
  // externalAuthAddress, externalAuthToEntity, webrtcOptions.signalingAccessToken
  accessToken?: string | undefined;

  // set timeout in milliseconds for dialing.
  dialTimeout?: number | undefined;
}

export interface DialWebRTCOptions {
  disableTrickleICE: boolean;
  rtcConfig?: RTCConfiguration;

  // signalingAuthEntity is the entity to authenticate as to the signaler.
  signalingAuthEntity?: string;

  // signalingExternalAuthAddress is the address to perform external auth yet.
  // This is unlikely to be needed since the signaler is typically in the same
  // place where authentication happens.
  signalingExternalAuthAddress?: string;

  // signalingExternalAuthToEntity is the entity to authenticate for after
  // externally authenticating.
  // This is unlikely to be needed since the signaler is typically in the same
  // place where authentication happens.
  signalingExternalAuthToEntity?: string;

  // signalingCredentials are used to authenticate the request to the signaling server.
  signalingCredentials?: Credentials;

  // `signalingAccessToken` allows a pre-authenticated client to dial with
  // an authorization header to the signaling server. This skips the Authenticate()
  // request to the singaling server or external auth but does not skip the
  // AuthenticateTo() request to retrieve the credentials at the external auth
  // endpoint.
  //
  // If enabled, other auth options have no affect. Eg. authEntity, credentials, signalingAuthEntity, signalingCredentials.
  signalingAccessToken?: string;

  // `additionalSDPValues` is a collection of additional SDP values that we want to pass into the connection's call request.
  additionalSdpFields?: Record<string, string | number>;
}

export interface Credentials {
  type: string;
  payload: string;
}

declare global {
  // eslint-disable-next-line vars-on-top,no-var
  var VIAM:
    | {
        GRPC_TRANSPORT_FACTORY?: (
          opts: CrossBrowserHttpTransportInit
        ) => grpc.TransportFactory;
      }
    | undefined;
}

export const dialDirect = async (
  address: string,
  opts?: DialOptions
): Promise<grpc.TransportFactory> => {
  validateDialOptions(opts);
  const defaultFactory = (
    transportOpts: grpc.TransportOptions
  ): grpc.Transport => {
    const transFact: (
      init: CrossBrowserHttpTransportInit
    ) => grpc.TransportFactory =
      window.VIAM?.GRPC_TRANSPORT_FACTORY ?? grpc.CrossBrowserHttpTransport;
    return transFact({ withCredentials: false })(transportOpts);
  };

  // Client already has access token with no external auth, skip Authenticate process.
  if (
    opts?.accessToken &&
    !(opts.externalAuthAddress && opts.externalAuthToEntity)
  ) {
    const md = new grpc.Metadata();
    md.set('authorization', `Bearer ${opts.accessToken}`);
    return (transportOpts: grpc.TransportOptions): grpc.Transport => {
      return new AuthenticatedTransport(transportOpts, defaultFactory, md);
    };
  }

  if (!opts || (!opts.credentials && !opts.accessToken)) {
    return defaultFactory;
  }

  return makeAuthenticatedTransportFactory(address, defaultFactory, opts);
};

const makeAuthenticatedTransportFactory = async (
  address: string,
  defaultFactory: grpc.TransportFactory,
  opts: DialOptions
): Promise<grpc.TransportFactory> => {
  let accessToken = '';
  // eslint-disable-next-line sonarjs/cognitive-complexity
  const getExtraMetadata = async (): Promise<grpc.Metadata> => {
    const md = new grpc.Metadata();
    // TODO(GOUT-10): handle expiration
    if (accessToken === '') {
      let thisAccessToken = '';

      let pResolve: (value: grpc.Metadata) => void;
      let pReject: (reason?: unknown) => void;

      if (!opts.accessToken || opts.accessToken === '') {
        const request = new AuthenticateRequest();
        request.setEntity(opts.authEntity ?? address.replace(/^.*:\/\//u, ''));
        if (opts.credentials) {
          const creds = new PBCredentials();
          creds.setType(opts.credentials.type);
          creds.setPayload(opts.credentials.payload);
          request.setCredentials(creds);
        }

        const done = new Promise<grpc.Metadata>((resolve, reject) => {
          pResolve = resolve;
          pReject = reject;
        });

        grpc.invoke(AuthService.Authenticate, {
          request,
          host: opts.externalAuthAddress ?? address,
          transport: defaultFactory,
          onMessage: (message: AuthenticateResponse) => {
            thisAccessToken = message.getAccessToken();
          },
          onEnd: (
            code: grpc.Code,
            msg: string | undefined,
            _trailers: grpc.Metadata
          ) => {
            if (code === grpc.Code.OK) {
              pResolve(md);
            } else {
              pReject(msg);
            }
          },
        });
        await done;
      } else {
        thisAccessToken = opts.accessToken;
      }

      // eslint-disable-next-line require-atomic-updates
      accessToken = thisAccessToken;

      if (opts.externalAuthAddress && opts.externalAuthToEntity) {
        const authMd = new grpc.Metadata();
        authMd.set('authorization', `Bearer ${accessToken}`);

        const done = new Promise<grpc.Metadata>((resolve, reject) => {
          pResolve = resolve;
          pReject = reject;
        });
        thisAccessToken = '';

        const request = new AuthenticateToRequest();
        request.setEntity(opts.externalAuthToEntity);
        grpc.invoke(ExternalAuthService.AuthenticateTo, {
          request,
          host: opts.externalAuthAddress,
          transport: defaultFactory,
          metadata: authMd,
          onMessage: (message: AuthenticateToResponse) => {
            thisAccessToken = message.getAccessToken();
          },
          onEnd: (
            code: grpc.Code,
            msg: string | undefined,
            _trailers: grpc.Metadata
          ) => {
            if (code === grpc.Code.OK) {
              pResolve(authMd);
            } else {
              pReject(msg);
            }
          },
        });
        await done;
        // eslint-disable-next-line require-atomic-updates
        accessToken = thisAccessToken;
      }
    }
    md.set('authorization', `Bearer ${accessToken}`);
    return md;
  };
  const extraMd = await getExtraMetadata();
  return (transportOpts: grpc.TransportOptions): grpc.Transport => {
    return new AuthenticatedTransport(transportOpts, defaultFactory, extraMd);
  };
};

class AuthenticatedTransport implements grpc.Transport {
  protected readonly opts: grpc.TransportOptions;
  protected readonly transport: grpc.Transport;
  protected readonly extraMetadata: grpc.Metadata;

  constructor(
    opts: grpc.TransportOptions,
    defaultFactory: grpc.TransportFactory,
    extraMetadata: grpc.Metadata
  ) {
    this.opts = opts;
    this.extraMetadata = extraMetadata;
    this.transport = defaultFactory(opts);
  }

  public start(metadata: grpc.Metadata) {
    // eslint-disable-next-line unicorn/no-array-for-each
    this.extraMetadata.forEach((key: string, values: string | string[]) => {
      metadata.set(key, values);
    });
    this.transport.start(metadata);
  }

  public sendMessage(msgBytes: Uint8Array) {
    this.transport.sendMessage(msgBytes);
  }

  public finishSend() {
    this.transport.finishSend();
  }

  public cancel() {
    this.transport.cancel();
  }
}

export interface WebRTCConnection {
  transportFactory: grpc.TransportFactory;
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
}

const getOptionalWebRTCConfig = async (
  signalingAddress: string,
  host: string,
  opts?: DialOptions
): Promise<WebRTCConfig> => {
  const optsCopy = { ...opts } as DialOptions;
  const directTransport = await dialDirect(signalingAddress, optsCopy);

  let pResolve: (value: WebRTCConfig) => void;
  let pReject: (reason?: unknown) => void;

  let result: WebRTCConfig | undefined;
  const done = new Promise<WebRTCConfig>((resolve, reject) => {
    pResolve = resolve;
    pReject = reject;
  });

  grpc.unary(SignalingService.OptionalWebRTCConfig, {
    request: new OptionalWebRTCConfigRequest(),
    metadata: {
      'rpc-host': host,
    },
    host: signalingAddress,
    transport: directTransport,
    onEnd: (resp: grpc.UnaryOutput<OptionalWebRTCConfigResponse>) => {
      const { status, statusMessage, message } = resp;
      if (status === grpc.Code.OK && message) {
        result = message.getConfig();
        if (!result) {
          pResolve(new WebRTCConfig());
          return;
        }
        pResolve(result);
        // In some cases the `OptionalWebRTCConfig` method seems to be unimplemented, even
        // when building `viam-server` from latest. Falling back to a default config seems
        // harmless in these cases, and allows connection to continue.
      } else if (status === grpc.Code.Unimplemented) {
        pResolve(new WebRTCConfig());
      } else {
        pReject(statusMessage);
      }
    },
  });

  await done;

  if (!result) {
    throw new Error('no config');
  }
  return result;
};

// dialWebRTC makes a connection to given host by signaling with the address provided. A Promise is returned
// upon successful connection that contains a transport factory to use with gRPC client as well as the WebRTC
// PeerConnection itself. Care should be taken with the PeerConnection and is currently returned for experimental
// use.
// TODO(GOUT-7): figure out decent way to handle reconnect on connection termination
export const dialWebRTC = async (
  signalingAddress: string,
  host: string,
  opts?: DialOptions
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<WebRTCConnection> => {
  const usableSignalingAddress = signalingAddress.replace(/\/$/u, '');
  validateDialOptions(opts);

  // TODO(RSDK-2836): In general, this logic should be in parity with the golang implementation.
  // https://github.com/viamrobotics/goutils/blob/main/rpc/wrtc_client.go#L160-L175
  const config = await getOptionalWebRTCConfig(
    usableSignalingAddress,
    host,
    opts
  );
  const additionalIceServers: RTCIceServer[] = config
    .toObject()
    .additionalIceServersList.map((ice) => {
      return {
        urls: ice.urlsList,
        credential: ice.credential,
        username: ice.username,
      };
    });

  const usableOpts = opts ?? {};

  let webrtcOpts: DialWebRTCOptions;
  if (usableOpts.webrtcOptions) {
    // RSDK-8715: We deep copy here to avoid mutating the input config's `rtcConfig.iceServers`
    // list.
    webrtcOpts = JSON.parse(
      JSON.stringify(usableOpts.webrtcOptions)
    ) as DialWebRTCOptions;
    if (webrtcOpts.rtcConfig) {
      webrtcOpts.rtcConfig.iceServers = [
        ...(webrtcOpts.rtcConfig.iceServers ?? []),
        ...additionalIceServers,
      ];
    } else {
      webrtcOpts.rtcConfig = { iceServers: additionalIceServers };
    }
  } else {
    // use additional webrtc config as default
    webrtcOpts = {
      disableTrickleICE: config.getDisableTrickle(),
      rtcConfig: {
        iceServers: additionalIceServers,
      },
    };
  }

  const { pc, dc } = await newPeerConnectionForClient(
    webrtcOpts.disableTrickleICE,
    webrtcOpts.rtcConfig,
    webrtcOpts.additionalSdpFields
  );
  let successful = false;

  try {
    // replace auth entity and creds
    let optsCopy = usableOpts;
    optsCopy = { ...usableOpts } as DialOptions;

    if (!usableOpts.accessToken) {
      optsCopy.authEntity = usableOpts.webrtcOptions?.signalingAuthEntity;
      if (!optsCopy.authEntity) {
        optsCopy.authEntity = optsCopy.externalAuthAddress
          ? usableOpts.externalAuthAddress?.replace(/^.*:\/\//u, '')
          : usableSignalingAddress.replace(/^.*:\/\//u, '');
      }
      optsCopy.credentials = usableOpts.webrtcOptions?.signalingCredentials;
      optsCopy.accessToken = usableOpts.webrtcOptions?.signalingAccessToken;
    }

    optsCopy.externalAuthAddress =
      usableOpts.webrtcOptions?.signalingExternalAuthAddress;
    optsCopy.externalAuthToEntity =
      usableOpts.webrtcOptions?.signalingExternalAuthToEntity;

    const directTransport = await dialDirect(usableSignalingAddress, optsCopy);
    const client = grpc.client(SignalingService.Call, {
      host: usableSignalingAddress,
      transport: directTransport,
    });

    let uuid = '';
    // only send once since exchange may end or ICE may end
    let sentDoneOrErrorOnce = false;
    const sendError = (err: string) => {
      if (sentDoneOrErrorOnce) {
        return;
      }
      sentDoneOrErrorOnce = true;
      const callRequestUpdate = new CallUpdateRequest();
      callRequestUpdate.setUuid(uuid);
      const status = new Status();
      status.setCode(Code.UNKNOWN);
      status.setMessage(err);
      callRequestUpdate.setError(status);
      grpc.unary(SignalingService.CallUpdate, {
        request: callRequestUpdate,
        metadata: {
          'rpc-host': host,
        },
        host: usableSignalingAddress,
        transport: directTransport,
        onEnd: (output: grpc.UnaryOutput<CallUpdateResponse>) => {
          const { status: grpcStatus, statusMessage, message } = output;
          if (grpcStatus === grpc.Code.OK && message) {
            return;
          }
          console.error(statusMessage);
        },
      });
    };
    const sendDone = () => {
      if (sentDoneOrErrorOnce) {
        return;
      }
      sentDoneOrErrorOnce = true;
      const callRequestUpdate = new CallUpdateRequest();
      callRequestUpdate.setUuid(uuid);
      callRequestUpdate.setDone(true);
      grpc.unary(SignalingService.CallUpdate, {
        request: callRequestUpdate,
        metadata: {
          'rpc-host': host,
        },
        host: usableSignalingAddress,
        transport: directTransport,
        onEnd: (output: grpc.UnaryOutput<CallUpdateResponse>) => {
          const { status, statusMessage, message } = output;
          if (status === grpc.Code.OK && message) {
            return;
          }
          console.error(statusMessage);
        },
      });
    };

    let pResolve: (value: unknown) => void;
    const remoteDescSet = new Promise<unknown>((resolve) => {
      pResolve = resolve;
    });
    let exchangeDone = false;
    if (!webrtcOpts.disableTrickleICE) {
      // set up offer
      const offerDesc = await pc.createOffer({});

      let iceComplete = false;
      let numCallUpdates = 0;
      let maxCallUpdateDuration = 0;
      let totalCallUpdateDuration = 0;

      pc.addEventListener('iceconnectionstatechange', () => {
        if (pc.iceConnectionState !== 'completed' || numCallUpdates === 0) {
          return;
        }
        const averageCallUpdateDuration =
          totalCallUpdateDuration / numCallUpdates;
        console.groupCollapsed('Caller update statistics');
        console.table({
          num_updates: numCallUpdates,
          average_duration: `${averageCallUpdateDuration}ms`,
          max_duration: `${maxCallUpdateDuration}ms`,
        });
        console.groupEnd();
      });
      pc.addEventListener(
        'icecandidate',
        async (event: { candidate: RTCIceCandidateInit | null }) => {
          await remoteDescSet;
          if (exchangeDone) {
            return;
          }

          if (event.candidate === null) {
            iceComplete = true;
            sendDone();
            return;
          }

          if (event.candidate.candidate !== undefined) {
            console.debug(`gathered local ICE ${event.candidate.candidate}`);
          }
          const iProto = iceCandidateToProto(event.candidate);
          const callRequestUpdate = new CallUpdateRequest();
          callRequestUpdate.setUuid(uuid);
          callRequestUpdate.setCandidate(iProto);
          const callUpdateStart = new Date();
          grpc.unary(SignalingService.CallUpdate, {
            request: callRequestUpdate,
            metadata: {
              'rpc-host': host,
            },
            host: usableSignalingAddress,
            transport: directTransport,
            onEnd: (output: grpc.UnaryOutput<CallUpdateResponse>) => {
              const { status, statusMessage, message } = output;
              if (status === grpc.Code.OK && message) {
                numCallUpdates += 1;
                const callUpdateEnd = new Date();
                const callUpdateDuration =
                  callUpdateEnd.getTime() - callUpdateStart.getTime();
                if (callUpdateDuration > maxCallUpdateDuration) {
                  maxCallUpdateDuration = callUpdateDuration;
                }
                totalCallUpdateDuration += callUpdateDuration;
                return;
              }
              if (exchangeDone || iceComplete) {
                return;
              }
              console.error('error sending candidate', statusMessage);
            },
          });
        }
      );

      await pc.setLocalDescription(offerDesc);
    }

    // initialize cc here so we can use it in the callbacks
    const cc = new ClientChannel(pc, dc);

    // set timeout for dial attempt if a timeout is specified
    if (usableOpts.dialTimeout) {
      setTimeout(() => {
        if (!successful) {
          cc.close();
        }
      }, usableOpts.dialTimeout);
    }

    let haveInit = false;
    // TS says that CallResponse isn't a valid type here. More investigation required.
    client.onMessage(async (message: ProtobufMessage) => {
      const response = message as CallResponse;

      if (response.hasInit()) {
        if (haveInit) {
          sendError('got init stage more than once');
          return;
        }
        const init = response.getInit();
        if (init === undefined) {
          sendError('no init in response');
          return;
        }
        haveInit = true;
        uuid = response.getUuid();

        const remoteSDP = new RTCSessionDescription(
          JSON.parse(atob(init.getSdp()))
        );
        if (cc.isClosed()) {
          sendError('client channel is closed');
          return;
        }
        await pc.setRemoteDescription(remoteSDP);

        pResolve(true);

        if (webrtcOpts.disableTrickleICE) {
          exchangeDone = true;
          sendDone();
        }
      } else if (response.hasUpdate()) {
        if (!haveInit) {
          sendError('got update stage before init stage');
          return;
        }
        if (response.getUuid() !== uuid) {
          sendError(`uuid mismatch; have=${response.getUuid()} want=${uuid}`);
          return;
        }
        const update = response.getUpdate();
        if (update === undefined) {
          sendError('no update in response');
          return;
        }
        const cand = update.getCandidate();
        if (cand === undefined) {
          return;
        }
        const iceCand = iceCandidateFromProto(cand);
        if (iceCand.candidate !== undefined) {
          console.debug(`received remote ICE ${iceCand.candidate}`);
        }
        try {
          await pc.addIceCandidate(iceCand);
        } catch (error) {
          sendError(JSON.stringify(error));
        }
      } else {
        sendError('unknown CallResponse stage');
      }
    });

    let clientEndResolve: () => void;
    let clientEndReject: (reason?: unknown) => void;
    const clientEnd = new Promise<void>((resolve, reject) => {
      clientEndResolve = resolve;
      clientEndReject = reject;
    });
    client.onEnd(
      (status: grpc.Code, statusMessage: string, _trailers: grpc.Metadata) => {
        if (status === grpc.Code.OK) {
          clientEndResolve();
          return;
        }
        if (statusMessage === 'Response closed without headers') {
          clientEndReject(new ConnectionClosedError('failed to dial'));
          return;
        }
        if (cc.isClosed()) {
          clientEndReject(
            new ConnectionClosedError('client channel is closed')
          );
          return;
        }
        console.error(statusMessage);
        clientEndReject(statusMessage);
      }
    );
    client.start({ 'rpc-host': host });

    const callRequest = new CallRequest();
    const description = addSdpFields(
      pc.localDescription,
      usableOpts.webrtcOptions?.additionalSdpFields
    );
    const encodedSDP = btoa(JSON.stringify(description));
    callRequest.setSdp(encodedSDP);
    if (webrtcOpts.disableTrickleICE) {
      callRequest.setDisableTrickle(webrtcOpts.disableTrickleICE);
    }
    client.send(callRequest);

    cc.ready
      .then(() => clientEndResolve())
      .catch((error) => clientEndReject(error));
    await clientEnd;
    await cc.ready;
    exchangeDone = true;
    sendDone();

    successful = true;
    return {
      transportFactory: cc.transportFactory(),
      peerConnection: pc,
      dataChannel: dc,
    };
  } finally {
    if (!successful) {
      pc.close();
    }
  }
};

const iceCandidateFromProto = (i: ICECandidate): RTCIceCandidateInit => {
  const candidate: RTCIceCandidateInit = {
    candidate: i.getCandidate(),
  };
  if (i.hasSdpMid()) {
    candidate.sdpMid = i.getSdpMid();
  }
  if (i.hasSdpmLineIndex()) {
    candidate.sdpMLineIndex = i.getSdpmLineIndex();
  }
  if (i.hasUsernameFragment()) {
    candidate.usernameFragment = i.getUsernameFragment();
  }
  return candidate;
};

const iceCandidateToProto = (i: RTCIceCandidateInit): ICECandidate => {
  const candidate = new ICECandidate();
  if (i.candidate) {
    candidate.setCandidate(i.candidate);
  }
  if (i.sdpMid) {
    candidate.setSdpMid(i.sdpMid);
  }
  if (i.sdpMLineIndex) {
    candidate.setSdpmLineIndex(i.sdpMLineIndex);
  }
  if (i.usernameFragment) {
    candidate.setUsernameFragment(i.usernameFragment);
  }
  return candidate;
};

// eslint-disable-next-line sonarjs/cognitive-complexity
const validateDialOptions = (opts?: DialOptions) => {
  if (!opts) {
    return;
  }

  if (opts.accessToken && opts.accessToken.length > 0) {
    if (opts.authEntity) {
      throw new Error('cannot set authEntity with accessToken');
    }

    if (opts.credentials) {
      throw new Error('cannot set credentials with accessToken');
    }

    if (opts.webrtcOptions) {
      if (opts.webrtcOptions.signalingAccessToken) {
        throw new Error(
          'cannot set webrtcOptions.signalingAccessToken with accessToken'
        );
      }
      if (opts.webrtcOptions.signalingAuthEntity) {
        throw new Error(
          'cannot set webrtcOptions.signalingAuthEntity with accessToken'
        );
      }
      if (opts.webrtcOptions.signalingCredentials) {
        throw new Error(
          'cannot set webrtcOptions.signalingCredentials with accessToken'
        );
      }
    }
  }

  if (
    opts.webrtcOptions?.signalingAccessToken &&
    opts.webrtcOptions.signalingAccessToken.length > 0
  ) {
    if (opts.webrtcOptions.signalingAuthEntity) {
      throw new Error(
        'cannot set webrtcOptions.signalingAuthEntity with webrtcOptions.signalingAccessToken'
      );
    }
    if (opts.webrtcOptions.signalingCredentials) {
      throw new Error(
        'cannot set webrtcOptions.signalingCredentials with webrtcOptions.signalingAccessToken'
      );
    }
  }
};
