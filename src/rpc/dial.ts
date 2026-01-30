import { Message } from '@bufbuild/protobuf';

import type {
  AnyMessage,
  MethodInfo,
  PartialMessage,
  ServiceType,
} from '@bufbuild/protobuf';

import type {
  CallOptions,
  ContextValues,
  StreamResponse,
  Transport,
  UnaryResponse,
} from '@connectrpc/connect';
import { Code, ConnectError, createClient } from '@connectrpc/connect';
import {
  AuthService,
  ExternalAuthService,
} from '../gen/proto/rpc/v1/auth_connect';
import {
  AuthenticateRequest,
  Credentials as PBCredentials,
} from '../gen/proto/rpc/v1/auth_pb';
import { SignalingService } from '../gen/proto/rpc/webrtc/v1/signaling_connect';
import { WebRTCConfig } from '../gen/proto/rpc/webrtc/v1/signaling_pb';
import { newPeerConnectionForClient } from './peer';

import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { isCredential, type Credentials } from '../app/viam-transport';
import { SignalingExchange } from './signaling-exchange';
import { randomUUID } from 'node:crypto';

export interface DialOptions {
  credentials?: Credentials | undefined;
  webrtcOptions?: DialWebRTCOptions;
  externalAuthAddress?: string | undefined;
  externalAuthToEntity?: string | undefined;

  /**
   * `accessToken` allows a pre-authenticated client to dial with an
   * authorization header. Direct dial will have the access token appended to
   * the "Authorization: Bearer" header. WebRTC dial will appened it to the
   * signaling server communication
   *
   * If enabled, other auth options have no affect. Eg. authEntity, credentials,
   * externalAuthAddress, externalAuthToEntity,
   * webrtcOptions.signalingAccessToken
   */
  accessToken?: string | undefined;

  // set timeout in milliseconds for dialing.
  dialTimeout?: number | undefined;

  extraHeaders?: Headers;
}

export interface DialWebRTCOptions {
  disableTrickleICE: boolean;
  rtcConfig?: RTCConfiguration;

  /**
   * SignalingExternalAuthAddress is the address to perform external auth yet.
   * This is unlikely to be needed since the signaler is typically in the same
   * place where authentication happens.
   */
  signalingExternalAuthAddress?: string;

  /**
   * SignalingExternalAuthToEntity is the entity to authenticate for after
   * externally authenticating. This is unlikely to be needed since the signaler
   * is typically in the same place where authentication happens.
   */
  signalingExternalAuthToEntity?: string;

  // signalingCredentials are used to authenticate the request to the signaling server.
  signalingCredentials?: Credentials;

  /**
   * `signalingAccessToken` allows a pre-authenticated client to dial with an
   * authorization header to the signaling server. This skips the Authenticate()
   * request to the singaling server or external auth but does not skip the
   * AuthenticateTo() request to retrieve the credentials at the external auth
   * endpoint.
   *
   * If enabled, other auth options have no affect. Eg. authEntity, credentials,
   * signalingAuthEntity, signalingCredentials.
   */
  signalingAccessToken?: string;

  // `additionalSDPValues` is a collection of additional SDP values that we want to pass into the connection's call request.
  additionalSdpFields?: Record<string, string | number>;
}

export type TransportFactory = (
  // platform specific
  init: TransportInitOptions
) => Transport;

interface TransportInitOptions {
  baseUrl: string;
}

const enableGRPCTraceLogging = <T extends Transport>(
  transport: T,
  address: string
): T => {
  if (globalThis.VIAM?.GRPC_TRACE_LOGGING === true) {
    const patchedUnary: typeof transport.unary = async <
      I extends Message<I> = AnyMessage,
      O extends Message<O> = AnyMessage,
    >(
      service: ServiceType,
      method: MethodInfo<I, O>,
      signal: AbortSignal | undefined,
      timeoutMs: number | undefined,
      header: HeadersInit | undefined,
      message: PartialMessage<I>,
      contextValues?: ContextValues
    ): Promise<UnaryResponse<I, O>> => {
      const id = randomUUID();
      // eslint-disable-next-line no-console
      console.trace(
        `Unary request ${id} : ${address}/${service.typeName}.${method.name}`
      );
      const resp = await transport.unary(
        service,
        method,
        signal,
        timeoutMs,
        header,
        message,
        contextValues
      );
      // eslint-disable-next-line no-console
      console.trace(`Unary response ${id} : ${JSON.stringify(resp)}`);
      return resp;
    };

    const patchedStream: typeof transport.stream = async <
      I extends Message<I> = AnyMessage,
      O extends Message<O> = AnyMessage,
    >(
      service: ServiceType,
      method: MethodInfo<I, O>,
      signal: AbortSignal | undefined,
      timeoutMs: number | undefined,
      header: HeadersInit | undefined,
      input: AsyncIterable<PartialMessage<I>>,
      contextValues?: ContextValues
    ): Promise<StreamResponse<I, O>> => {
      const id = randomUUID();
      // eslint-disable-next-line no-console
      console.trace(
        `Stream request ${id} : ${address}/${service.typeName}.${method.name}`
      );
      const resp = await transport.stream(
        service,
        method,
        signal,
        timeoutMs,
        header,
        input,
        contextValues
      );

      // eslint-disable-next-line no-console
      console.trace(`Stream response ${id} : ${JSON.stringify(resp.message)}`);
      return resp;
    };

    return { ...transport, unary: patchedUnary, stream: patchedStream };
  }

  return transport;
};

export const dialDirect = async (
  address: string,
  opts?: DialOptions,
  transportCredentialsInclude = false
): Promise<Transport> => {
  validateDialOptions(opts);
  const createTransport =
    globalThis.VIAM?.GRPC_TRANSPORT_FACTORY ?? createGrpcWebTransport;

  const transportOpts = {
    baseUrl: address,
    // Default is "same-origin", which does not include localhost:*.
    credentials: 'same-origin' as RequestCredentials,
  };

  // Client already has access token with no external auth, skip Authenticate process.
  if (
    opts?.accessToken !== undefined &&
    opts.accessToken !== '' &&
    !(
      opts.externalAuthAddress !== undefined &&
      opts.externalAuthAddress !== '' &&
      opts.externalAuthToEntity !== undefined &&
      opts.externalAuthToEntity !== ''
    )
  ) {
    const headers = new Headers(opts.extraHeaders);
    headers.set('authorization', `Bearer ${opts.accessToken}`);
    const transport = new AuthenticatedTransport(
      transportOpts,
      createTransport,
      headers
    );
    return enableGRPCTraceLogging(transport, address);
  }

  if (
    opts === undefined ||
    (opts.credentials === undefined && opts.accessToken === undefined)
  ) {
    // With same-origin, services running on other ports that expect cookies from App would otherwise not receive them.
    if (transportCredentialsInclude) {
      transportOpts.credentials = 'include';
    }
    const transport = createTransport(transportOpts);
    return enableGRPCTraceLogging(transport, address);
  }

  const transport = await makeAuthenticatedTransport(
    address,
    createTransport,
    opts,
    transportOpts
  );
  return enableGRPCTraceLogging(transport, address);
};

const addressCleanupRegex = /^.*:\/\//u;

const makeAuthenticatedTransport = async (
  address: string,
  defaultFactory: TransportFactory,
  opts: DialOptions,
  transportOpts: TransportInitOptions
): Promise<Transport> => {
  const authHeaders = new Headers(opts.extraHeaders);

  let accessToken;
  if (opts.accessToken === undefined || opts.accessToken === '') {
    const request = new AuthenticateRequest({
      entity:
        isCredential(opts.credentials) && opts.credentials.authEntity
          ? opts.credentials.authEntity
          : address.replace(addressCleanupRegex, ''),
    });
    if (opts.credentials) {
      request.credentials = new PBCredentials({
        type: opts.credentials.type,
        payload: opts.credentials.payload,
      });
    }

    const resolvedAddress = opts.externalAuthAddress ?? address;
    const transport = defaultFactory({ baseUrl: resolvedAddress });
    const authClient = createClient(AuthService, transport);
    const resp = await authClient.authenticate(request);
    accessToken = resp.accessToken;
  } else {
    accessToken = opts.accessToken;
  }

  if (
    opts.externalAuthAddress !== undefined &&
    opts.externalAuthAddress !== '' &&
    opts.externalAuthToEntity !== undefined &&
    opts.externalAuthToEntity !== ''
  ) {
    const extAuthHeaders = new Headers();
    extAuthHeaders.set('authorization', `Bearer ${accessToken}`);

    accessToken = '';

    const request = new AuthenticateRequest({
      entity: opts.externalAuthToEntity,
    });
    const transport = defaultFactory({
      baseUrl: opts.externalAuthAddress,
    });
    const externalAuthClient = createClient(ExternalAuthService, transport);
    const resp = await externalAuthClient.authenticateTo(request, {
      headers: extAuthHeaders,
    });
    accessToken = resp.accessToken;
  }
  authHeaders.set('authorization', `Bearer ${accessToken}`);
  return new AuthenticatedTransport(transportOpts, defaultFactory, authHeaders);
};

export class AuthenticatedTransport implements Transport {
  protected readonly transport: Transport;
  protected readonly extraHeaders: Headers;

  constructor(
    opts: TransportInitOptions,
    defaultFactory: TransportFactory,
    extraHeaders: Headers
  ) {
    this.extraHeaders = extraHeaders;
    this.transport = defaultFactory(opts);
  }

  public unary = async <
    I extends Message<I> = AnyMessage,
    O extends Message<O> = AnyMessage,
  >(
    service: ServiceType,
    method: MethodInfo<I, O>,
    signal: AbortSignal | undefined,
    timeoutMs: number | undefined,
    header: HeadersInit | undefined,
    message: PartialMessage<I>,
    contextValues?: ContextValues
  ): Promise<UnaryResponse<I, O>> => {
    const newHeaders = cloneHeaders(header);
    for (const [key, value] of this.extraHeaders) {
      newHeaders.set(key, value);
    }
    return this.transport.unary(
      service,
      method,
      signal,
      timeoutMs,
      newHeaders,
      message,
      contextValues
    );
  };

  public stream = async <
    I extends Message<I> = AnyMessage,
    O extends Message<O> = AnyMessage,
  >(
    service: ServiceType,
    method: MethodInfo<I, O>,
    signal: AbortSignal | undefined,
    timeoutMs: number | undefined,
    header: HeadersInit | undefined,
    input: AsyncIterable<PartialMessage<I>>,
    contextValues?: ContextValues
  ): Promise<StreamResponse<I, O>> => {
    const newHeaders = cloneHeaders(header);
    for (const [key, value] of this.extraHeaders) {
      newHeaders.set(key, value);
    }
    return this.transport.stream(
      service,
      method,
      signal,
      timeoutMs,
      newHeaders,
      input,
      contextValues
    );
  };
}

export const cloneHeaders = (headers: HeadersInit | undefined): Headers => {
  const cloned = new Headers();
  if (headers !== undefined) {
    if (Array.isArray(headers)) {
      for (const [key, value] of headers) {
        cloned.append(key, value);
      }
    } else if ('forEach' in headers) {
      if (typeof headers.forEach === 'function') {
        // eslint-disable-next-line unicorn/no-array-for-each
        headers.forEach((value, key) => {
          cloned.append(key, value);
        });
      }
    } else {
      for (const [key, value] of Object.entries<string>(headers)) {
        cloned.append(key, value);
      }
    }
  }
  return cloned;
};

export interface WebRTCConnection {
  transport: Transport;
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
}

const getSignalingClient = async (
  signalingAddress: string,
  signalingExchangeOpts: DialOptions | undefined,
  transportCredentialsInclude = false
) => {
  const transport = await dialDirect(
    signalingAddress,
    signalingExchangeOpts,
    transportCredentialsInclude
  );

  return createClient(SignalingService, transport);
};

const getOptionalWebRTCConfig = async (
  callOpts: CallOptions,
  signalingClient: ReturnType<typeof createClient<typeof SignalingService>>
): Promise<WebRTCConfig> => {
  try {
    const resp = await signalingClient.optionalWebRTCConfig({}, callOpts);
    return resp.config ?? new WebRTCConfig();
  } catch (error) {
    if (error instanceof ConnectError && error.code === Code.Unimplemented) {
      return new WebRTCConfig();
    }
    throw error;
  }
};

/**
 * DialWebRTC makes a connection to given host by signaling with the address
 * provided. A Promise is returned upon successful connection that contains a
 * transport factory to use with gRPC client as well as the WebRTC
 * PeerConnection itself. Care should be taken with the PeerConnection and is
 * currently returned for experimental use. TODO(GOUT-7): figure out decent way
 * to handle reconnect on connection termination
 */
export const dialWebRTC = async (
  signalingAddress: string,
  host: string,
  dialOpts?: DialOptions,
  transportCredentialsInclude = false
): Promise<WebRTCConnection> => {
  const usableSignalingAddress = signalingAddress.replace(/\/$/u, '');
  validateDialOptions(dialOpts);

  /**
   * TODO(RSDK-2836): In general, this logic should be in parity with the golang
   * implementation.
   * https://github.com/viamrobotics/goutils/blob/main/rpc/wrtc_client.go#L160-L175
   */
  const callOpts = {
    headers: {
      'rpc-host': host,
    },
  };

  /**
   * First, derive options specifically for signaling against our target. Then
   * complete our WebRTC options, gathering any extra information like TURN
   * servers from a cloud server. This also creates the transport and signaling
   * client that we'll reuse to avoid resource leaks.
   */
  const exchangeOpts = processSignalingExchangeOpts(
    usableSignalingAddress,
    dialOpts
  );

  const signalingClient = await getSignalingClient(
    usableSignalingAddress,
    exchangeOpts,
    transportCredentialsInclude
  );

  const webrtcOpts = await processWebRTCOpts(
    signalingClient,
    callOpts,
    dialOpts
  );

  const { pc, dc } = await newPeerConnectionForClient(
    webrtcOpts.disableTrickleICE,
    webrtcOpts.rtcConfig,
    webrtcOpts.additionalSdpFields
  );
  let successful = false;

  const exchange = new SignalingExchange(
    signalingClient,
    callOpts,
    pc,
    dc,
    webrtcOpts
  );

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (dialOpts?.dialTimeout !== undefined && dialOpts.dialTimeout > 0) {
    timeoutId = setTimeout(() => {
      if (!successful) {
        exchange.terminate(new Error('timed out'));
      }
    }, dialOpts.dialTimeout);
  }

  try {
    const cc = await exchange.doExchange();

    if (
      dialOpts?.externalAuthAddress !== undefined &&
      dialOpts.externalAuthAddress !== ''
    ) {
      // TODO(GOUT-11): prepare AuthenticateTo here  for client channel.
      // eslint-disable-next-line sonarjs/no-duplicated-branches
    } else if (dialOpts?.credentials?.type !== undefined) {
      // TODO(GOUT-11): prepare Authenticate here for client channel
    }

    successful = true;
    return {
      transport: enableGRPCTraceLogging(cc, host),
      peerConnection: pc,
      dataChannel: dc,
    };
  } catch (error) {
    console.error('error dialing', error); // eslint-disable-line no-console
    throw error;
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    if (!successful) {
      pc.close();
      dc.close();
    }
  }
};

const processWebRTCOpts = async (
  signalingClient: ReturnType<typeof createClient<typeof SignalingService>>,
  callOpts: CallOptions,
  dialOpts: DialOptions | undefined
): Promise<DialWebRTCOptions> => {
  const config = await getOptionalWebRTCConfig(callOpts, signalingClient);
  const additionalIceServers: RTCIceServer[] = config.additionalIceServers.map(
    (ice) => {
      const iceUrls = [];
      // always extend the list with tcp variants in order to facilitate cases
      // where udp might be blocked
      for (const iUrl of ice.urls) {
        if (iUrl.endsWith('udp')) {
          iceUrls.push(`${iUrl.slice(0, -3)}tcp`);
        }
        iceUrls.push(iUrl);
      }
      return {
        urls: iceUrls,
        credential: ice.credential,
        username: ice.username,
      };
    }
  );

  const usableDialOpts = dialOpts ?? {};

  let webrtcOpts: DialWebRTCOptions;
  if (usableDialOpts.webrtcOptions === undefined) {
    // use additional webrtc config as default
    webrtcOpts = {
      disableTrickleICE: config.disableTrickle,
      rtcConfig: {
        iceServers: additionalIceServers,
      },
    };
  } else {
    // RSDK-8715: We deep copy here to avoid mutating the input config's `rtcConfig.iceServers` list.
    webrtcOpts = JSON.parse(
      JSON.stringify(usableDialOpts.webrtcOptions)
    ) as DialWebRTCOptions;
    if (webrtcOpts.rtcConfig === undefined) {
      webrtcOpts.rtcConfig = { iceServers: additionalIceServers };
    } else {
      webrtcOpts.rtcConfig.iceServers = [
        ...(webrtcOpts.rtcConfig.iceServers ?? []),
        ...additionalIceServers,
      ];
    }
  }

  return webrtcOpts;
};

const processSignalingExchangeOpts = (
  signalingAddress: string,
  dialOpts?: DialOptions
) => {
  // replace auth entity and creds
  let optsCopy = dialOpts;
  if (dialOpts) {
    optsCopy = { ...dialOpts } as DialOptions;

    if (dialOpts.accessToken === undefined) {
      if (
        isCredential(optsCopy.credentials) &&
        !optsCopy.credentials.authEntity
      ) {
        optsCopy.credentials.authEntity =
          optsCopy.externalAuthAddress !== undefined &&
          optsCopy.externalAuthAddress !== ''
            ? optsCopy.externalAuthAddress.replace(addressCleanupRegex, '')
            : signalingAddress.replace(addressCleanupRegex, '');
      }
      optsCopy.credentials = dialOpts.webrtcOptions?.signalingCredentials;
      optsCopy.accessToken = dialOpts.webrtcOptions?.signalingAccessToken;
    }

    optsCopy.externalAuthAddress =
      dialOpts.webrtcOptions?.signalingExternalAuthAddress;
    optsCopy.externalAuthToEntity =
      dialOpts.webrtcOptions?.signalingExternalAuthToEntity;
  }
  return optsCopy;
};

export const validateDialOptions = (opts?: DialOptions) => {
  if (!opts) {
    return;
  }

  if (opts.accessToken !== undefined && opts.accessToken.length > 0) {
    if (opts.credentials) {
      throw new Error('cannot set credentials with accessToken');
    }

    if (opts.webrtcOptions?.signalingAccessToken !== undefined) {
      throw new Error(
        'cannot set webrtcOptions.signalingAccessToken with accessToken'
      );
    }

    if (opts.webrtcOptions?.signalingCredentials !== undefined) {
      throw new Error(
        'cannot set webrtcOptions.signalingCredentials with accessToken'
      );
    }
  }

  if (
    opts.webrtcOptions?.signalingAccessToken !== undefined &&
    opts.webrtcOptions.signalingAccessToken.length > 0 &&
    opts.webrtcOptions.signalingCredentials !== undefined
  ) {
    throw new Error(
      'cannot set webrtcOptions.signalingCredentials with webrtcOptions.signalingAccessToken'
    );
  }
};
