import { RobotClient } from './client';

interface Credential {
  type: string;
  payload: string;
}

/** Options required to dial a robot via gRPC. */
export interface DialDirectConf {
  authEntity?: string;
  host: string;
  credential?: Credential;
  disableSessions?: boolean;
}

/** Check if a url corresponds to a local connection via heuristic */
const isLocalConnection = (url: string) => url.includes('.local');

const dialDirect = async (conf: DialDirectConf): Promise<RobotClient> => {
  // eslint-disable-next-line no-console
  console.debug('dialing via gRPC...');

  if (!isLocalConnection(conf.host)) {
    throw new Error(
      `cannot dial "${conf.host}" directly, please use a local url instead.`
    );
  }

  let sessOpts;
  if (conf.disableSessions) {
    sessOpts = { disabled: true };
  }
  const client = new RobotClient(conf.host, undefined, sessOpts);

  let creds;
  if (conf.credential) {
    creds = conf.credential;
  }
  await client.connect(conf.authEntity, creds);

  // eslint-disable-next-line no-console
  console.debug('connected via gRPC');

  return client;
};

interface ICEServer {
  urls: string;
  username?: string;
  credential?: string;
}

/** Options required to dial a robot via WebRTC. */
export interface DialWebRTCConf {
  authEntity?: string;
  host: string;
  credential?: Credential;
  disableSessions?: boolean;
  reconnectMaxWait?: number;
  reconnectMaxAttempts?: number;
  // WebRTC
  signalingAddress: string;
  iceServers?: ICEServer[];
  noReconnect?: boolean;
}

const isPosInt = (x: number): boolean => {
  return Boolean(x > 0 && Number.isInteger(x));
};

const dialWebRTC = async (conf: DialWebRTCConf): Promise<RobotClient> => {
  // eslint-disable-next-line no-console
  console.debug('dialing via WebRTC...');

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

  let creds;
  if (conf.credential) {
    creds = conf.credential;
  }
  await client.connect(impliedURL, creds);

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
 * If connecting via WebRTC fails, then this function will automatically
 * re-attempt to connect via gRPC directly.
 *
 * @privateRemarks
 * We should add an example that is not viam-specific.
 */
export const createRobotClient = async (
  conf: DialConf
): Promise<RobotClient> => {
  let client;

  // Try to dial via WebRTC first.
  if (isDialWebRTCConf(conf)) {
    try {
      client = await dialWebRTC(conf);
    } catch (error: any) {
      console.log(error);
      // eslint-disable-next-line no-console
      console.debug('failed to connect via WebRTC...');
    }
  }

  if (!client) {
    try {
      client = await dialDirect(conf);
    } catch (error: any) {
      console.log(error);
      // eslint-disable-next-line no-console
      console.debug('failed to connect via gRPC...');
    }
  }

  if (!client) {
    throw new Error('failed to connect to robot');
  }

  return client;
};
