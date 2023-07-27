import {
  createRobotClient,
  StreamClient,
  BaseClient,
  type RobotClient,
} from '@viamrobotics/sdk';

export interface RobotCredentials {
  hostname: string;
  secret: string;
}

/**
 * Given a set of credentials, get a robot client.
 *
 * @param credentials Robot URL and location secret
 * @returns A connected client
 */
export const getRobotClient = async (
  credentials: RobotCredentials
): Promise<RobotClient> => {
  const { hostname, secret } = credentials;

  return createRobotClient({
    authEntity: hostname,
    host: hostname,
    credential: {
      type: 'robot-location-secret',
      payload: secret,
    },
    signalingAddress: 'https://app.viam.com:443',
    iceServers: [{ urls: 'stun:global.stun.twilio.com:3478' }],
  });
};

/**
 * StreamClient factory
 *
 * @param client A connected RobotClient
 * @returns A connected stream client
 */
export const getStreamClient = (client: RobotClient): StreamClient => {
  return new StreamClient(client);
};

/**
 * BaseClient factory
 *
 * @param client A connected RobotClient
 * @returns A connected base client
 */
export const getBaseClient = (client: RobotClient): BaseClient => {
  return new BaseClient(client, 'viam_base');
};
