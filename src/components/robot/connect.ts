import Client from '../../Client';
import { RobotClient } from './Client';

// Connect

interface ConnectDirectConf {
  authEntity?: string;
  host: string;
  secret: string;
}

const connectDirect = async (conf: ConnectDirectConf): Promise<Client> => {
  const creds = {
    payload: conf.secret,
    type: 'robot-location-secret',
  };

  const client = new Client(conf.host);

  await client.connect(conf.authEntity, creds);

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
  secret: string;
  // WebRTC
  signalingAddress: string;
  iceServers: ICEServer[];
}

const connectWebRTC = async (conf: ConnectWebRTCConf): Promise<Client> => {
  const creds = {
    payload: conf.secret,
    type: 'robot-location-secret',
  };

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
  const client = new Client(impliedURL, clientConf);

  await client.connect(impliedURL, creds);

  // eslint-disable-next-line no-console
  console.info('connected via WebRTC');

  return client;
};

type Conf = ConnectDirectConf & ConnectWebRTCConf;

export const createRobotClient = async (conf: Conf): Promise<RobotClient> => {
  let client;

  // Try to connect via WebRTC first.
  try {
    client = await connectWebRTC(conf);
  } catch (err) {
    // Try another way of connecting.
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

  return new RobotClient(client);
};
