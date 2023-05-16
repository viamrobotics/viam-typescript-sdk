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
  // WebRTC
  signalingAddress: string;
  iceServers?: ICEServer[];
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
    } catch {
      // eslint-disable-next-line no-console
      console.debug('failed to connect via WebRTC...');
    }
  }

  if (!client) {
    try {
      client = await dialDirect(conf);
    } catch {
      // eslint-disable-next-line no-console
      console.debug('failed to connect via gRPC...');
    }
  }

  if (!client) {
    throw new Error('failed to connect to robot');
  }

  return client;
};
