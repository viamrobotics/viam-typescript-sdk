import {
  BaseClient,
  StreamClient,
  createRobotClient,
  type RobotClient,
} from '@viamrobotics/sdk';

export interface RobotCredentials {
  hostname: string;
  apiKeyId: string;
  apiKey: string;
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
  const { hostname, apiKey, apiKeyId } = credentials;

  return createRobotClient({
    host: hostname,
    credentials: {
      authEntity: apiKeyId,
      type: 'api-key',
      payload: apiKey,
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
