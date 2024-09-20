import { backOff, type IBackOffOptions } from 'exponential-backoff';
import { DIAL_TIMEOUT } from '../constants';
import type { AccessToken, Credential } from '../main';
import { RobotClient } from './client';

/** Options required to dial a robot via gRPC. */
export interface DialDirectConf {
  authEntity?: string;
  host: string;
  credential?: Credential | AccessToken;
  disableSessions?: boolean;
  noReconnect?: boolean;
  reconnectMaxAttempts?: number;
  reconnectMaxWait?: number;
  reconnectAbortSignal?: { abort: boolean };
  // set timeout in milliseconds for dialing. Default is defined by DIAL_TIMEOUT,
  // and a value of 0 would disable the timeout.
  dialTimeout?: number;
}

/** Check if a given number is a positive integer */
const isPosInt = (x: number): boolean => {
  return Boolean(x > 0 && Number.isInteger(x));
};

/** Check if a url corresponds to a local connection via heuristic */
const isLocalConnection = (url: string) => url.includes('local');

const dialDirect = async (conf: DialDirectConf): Promise<RobotClient> => {
  // eslint-disable-next-line no-console
  console.debug('dialing via gRPC...');

  if (!isLocalConnection(conf.host)) {
    throw new Error(
      `cannot dial "${conf.host}" directly, please use a local url instead.`
    );
  }

  const clientConf = {
    noReconnect: conf.noReconnect,
    reconnectMaxWait: conf.reconnectMaxWait,
    reconnectMaxAttempts: conf.reconnectMaxAttempts,
  };

  let sessOpts;
  if (conf.disableSessions) {
    sessOpts = { disabled: true };
  }
  const client = new RobotClient(conf.host, undefined, sessOpts, clientConf);

  let creds;
  if (conf.credential) {
    creds = conf.credential;
  }
  await client.connect({
    authEntity: conf.authEntity,
    creds,
    dialTimeout: conf.dialTimeout ?? DIAL_TIMEOUT,
  });

  // eslint-disable-next-line no-console
  console.debug('connected via gRPC');

  return client;
};

interface ICEServer {
  urls: string;
  username?: string;
  credential?: string;
}

/**
 * Options required to dial a robot via WebRTC.
 *
 * - `reconnectMaxAttempts` value should be a positive int; default is 10.
 * - `reconnectMaxWait` value should be a positive int; default is positive
 *   infinity.
 */
export interface DialWebRTCConf {
  authEntity?: string;
  host: string;
  credential?: Credential | AccessToken;
  disableSessions?: boolean;
  noReconnect?: boolean;
  reconnectMaxAttempts?: number;
  reconnectMaxWait?: number;
  reconnectAbortSignal?: { abort: boolean };
  // WebRTC
  signalingAddress: string;
  iceServers?: ICEServer[];
  priority?: number;

  // set timeout in milliseconds for dialing. Default is defined by DIAL_TIMEOUT,
  // and a value of 0 would disable the timeout.
  dialTimeout?: number;
}

const dialWebRTC = async (conf: DialWebRTCConf): Promise<RobotClient> => {
  // eslint-disable-next-line no-console
  console.debug('dialing via WebRTC...');

  const impliedURL = conf.host;
  const { signalingAddress } = conf;
  const iceServers = conf.iceServers ?? [];

  const rtcConfig = { iceServers };
  const clientConf = {
    enabled: true,
    host: conf.host,
    signalingAddress,
    rtcConfig,
    noReconnect: conf.noReconnect,
    reconnectMaxWait: conf.reconnectMaxWait,
    reconnectMaxAttempts: conf.reconnectMaxAttempts,
  };
  let sessOpts;
  if (conf.disableSessions) {
    sessOpts = { disabled: true };
  }
  const client = new RobotClient(impliedURL, clientConf, sessOpts);

  await client.connect({
    authEntity: conf.authEntity ?? impliedURL,
    priority: conf.priority,
    dialTimeout: conf.dialTimeout ?? DIAL_TIMEOUT,
    creds: conf.credential,
  });

  // eslint-disable-next-line no-console
  console.debug('connected via WebRTC');

  return client;
};

/** Options required to dial a robot. */
export type DialConf = DialDirectConf | DialWebRTCConf;

const isDialWebRTCConf = (value: DialConf): value is DialWebRTCConf => {
  const conf = value as DialWebRTCConf;

  if (typeof conf.signalingAddress !== 'string') {
    return false;
  }

  return !conf.iceServers || Array.isArray(conf.iceServers);
};

/**
 * Connect to a robot via WebRTC or gRPC and return a RobotClient after
 * connecting successfully.
 *
 * The initial connection method is determined by whether a
 * {@link DialWebRTCConf} or {@link DialDirectConf} is passed in as the first
 * argument.
 *
 * Reconnect is enabled by default and disabled with `noReconnect`. When
 * enabled, this function will re-attempt to reconnect if initial connection is
 * unsuccessful using backoff.
 *
 * If `noReconnect` is specified and connecting via WebRTC fails, then this
 * function will automatically re-attempt to connect via gRPC directly.
 */
export const createRobotClient = async (
  conf: DialConf
): Promise<RobotClient> => {
  validateDialConf(conf);

  const backOffOpts: Partial<IBackOffOptions> = {
    maxDelay: conf.reconnectMaxWait,
    numOfAttempts: conf.reconnectMaxAttempts,
    retry: (_error, attemptNumber) => {
      // eslint-disable-next-line no-console
      console.debug(`Failed to connect, attempt ${attemptNumber} with backoff`);

      // Abort reconnects if the the caller specifies, otherwise retry
      return !conf.reconnectAbortSignal?.abort;
    },
  };

  // Try to dial via WebRTC first.
  if (isDialWebRTCConf(conf) && !conf.reconnectAbortSignal?.abort) {
    try {
      return conf.noReconnect
        ? await dialWebRTC(conf)
        : await backOff(async () => dialWebRTC(conf), backOffOpts);
    } catch {
      // eslint-disable-next-line no-console
      console.debug('Failed to connect via WebRTC');
    }
  }

  if (!conf.reconnectAbortSignal?.abort) {
    try {
      return conf.noReconnect
        ? await dialDirect(conf)
        : await backOff(async () => dialDirect(conf), backOffOpts);
    } catch {
      // eslint-disable-next-line no-console
      console.debug('Failed to connect via gRPC');
    }
  }

  throw new Error('Failed to connect to robot');
};

/**
 * Validates a DialConf passed to createRobotClient. Throws an error for invalid
 * configs.
 */
const validateDialConf = (conf: DialConf) => {
  if (conf.authEntity) {
    try {
      conf.authEntity = new URL(conf.authEntity).host;
    } catch (error) {
      if (!(error instanceof TypeError)) {
        throw error;
      }
    }
  }

  if (conf.reconnectMaxAttempts && !isPosInt(conf.reconnectMaxAttempts)) {
    throw new Error(
      `Value of max reconnect attempts (${conf.reconnectMaxAttempts}) should be a positive integer`
    );
  }
  if (conf.reconnectMaxWait && !isPosInt(conf.reconnectMaxWait)) {
    throw new Error(
      `Value of max reconnect wait (${conf.reconnectMaxWait}) should be a positive integer`
    );
  }
};
