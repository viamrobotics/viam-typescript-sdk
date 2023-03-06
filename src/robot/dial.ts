import { RobotClient } from './Client';

interface DialDirectConf {
  authEntity?: string;
  host: string;
  locationSecret?: string;
}

/** Check if a url corresponds to a local connection via heuristic */
const isLocalConnection = (url: string) => url.includes('.local');

const dialDirect = async (conf: DialDirectConf): Promise<RobotClient> => {
  // eslint-disable-next-line no-console
  console.info('dialing via gRPC...');

  if (!isLocalConnection(conf.host)) {
    throw new Error(
      `cannot dial "${conf.host}" directly, please use a local url instead.`
    );
  }

  const client = new RobotClient(conf.host);

  let creds;
  if (conf.locationSecret) {
    creds = {
      payload: conf.locationSecret,
      type: 'robot-location-secret',
    };
  }
  await client.connect(conf.authEntity, creds);

  // eslint-disable-next-line no-console
  console.info('connected via gRPC');

  return client;
};

interface ICEServer {
  urls: string;
  username: string;
  credential: string;
}

interface DialWebRTCConf {
  authEntity?: string;
  host: string;
  locationSecret?: string;
  // WebRTC
  signalingAddress: string;
  iceServers: ICEServer[];
}

const dialWebRTC = async (conf: DialWebRTCConf): Promise<RobotClient> => {
  // eslint-disable-next-line no-console
  console.info('dialing via WebRTC...');

  const impliedURL = conf.host;
  const signalingAddress = conf.signalingAddress;
  const iceServers = conf.iceServers;

  const rtcConfig = { iceServers };
  const clientConf = {
    enabled: true,
    host: conf.host,
    signalingAddress,
    rtcConfig,
  };
  const client = new RobotClient(impliedURL, clientConf);

  let creds;
  if (conf.locationSecret) {
    creds = {
      payload: conf.locationSecret,
      type: 'robot-location-secret',
    };
  }
  await client.connect(impliedURL, creds);

  // eslint-disable-next-line no-console
  console.info('connected via WebRTC');

  return client;
};

type Conf = DialDirectConf | DialWebRTCConf;

const isDialWebRTCConf = (value: Conf): value is DialWebRTCConf => {
  const conf = value as DialWebRTCConf;

  if (typeof conf.signalingAddress !== 'string') return false;
  if (!(conf.iceServers instanceof Array)) return false;

  return true;
};

export const createRobotClient = async (conf: Conf): Promise<RobotClient> => {
  let client;

  // Try to dial via WebRTC first.
  if (isDialWebRTCConf(conf)) {
    try {
      client = await dialWebRTC(conf);
    } catch (err) {
      console.warn('failed to connect via WebRTC...');
    }
  }

  if (!client) {
    try {
      client = await dialDirect(conf);
    } catch (err) {
      console.warn('failed to connect via gRPC...');
    }
  }

  if (!client) {
    throw new Error('failed to connect to robot');
  }

  return client;
};
