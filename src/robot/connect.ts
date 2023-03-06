import { RobotClient } from './Client';

interface ConnectDirectConf {
  authEntity?: string;
  host: string;
  secret?: string;
}

const connectDirect = async (conf: ConnectDirectConf): Promise<RobotClient> => {
  // eslint-disable-next-line no-console
  console.info('attempting to connect via gRPC...');

  const client = new RobotClient(conf.host);

  let creds;
  if (conf.secret) {
    creds = {
      payload: conf.secret,
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

interface ConnectWebRTCConf {
  authEntity?: string;
  host: string;
  secret?: string;
  // WebRTC
  signalingAddress: string;
  iceServers: ICEServer[];
}

const connectWebRTC = async (conf: ConnectWebRTCConf): Promise<RobotClient> => {
  // eslint-disable-next-line no-console
  console.info('attempting to connect via WebRTC...');

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
  if (conf.secret) {
    creds = {
      payload: conf.secret,
      type: 'robot-location-secret',
    };
  }
  await client.connect(impliedURL, creds);

  // eslint-disable-next-line no-console
  console.info('connected via WebRTC');

  return client;
};

type Conf = ConnectDirectConf | ConnectWebRTCConf;

const isConnectWebRTCConf = (value: Conf): value is ConnectWebRTCConf => {
  const conf = value as ConnectWebRTCConf;

  if (typeof conf.signalingAddress !== 'string') return false;
  if (!(conf.iceServers instanceof Array)) return false;
  return true;
};

export const createRobotClient = async (conf: Conf): Promise<RobotClient> => {
  let client;

  // Try to connect via WebRTC first.
  if (isConnectWebRTCConf(conf)) {
    try {
      client = await connectWebRTC(conf);
    } catch (err) {
      // Try another way of connecting.
    }
  }

  if (!client) {
    try {
      client = await connectDirect(conf);
    } catch (err) {
      // Try another way of connecting.
    }
  }

  if (!client) {
    throw new Error('failed to connect to robot');
  }

  return client;
};
