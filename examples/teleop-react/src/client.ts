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

/**
 * Get a stream by name from a StreamClient.
 *
 * @param streamClient - The connected StreamClient.
 * @param name - The name of the camera.
 * @returns A MediaStream object that can be used in a <video>.
 */
export const getStream = async (
  streamClient: StreamClient,
  name: string
): Promise<MediaStream> => {
  const streamPromise = new Promise<MediaStream>((resolve, reject) => {
    const handleTrack = (event: RTCTrackEvent) => {
      const stream = event.streams[0];

      if (!stream) {
        streamClient.off('track', handleTrack as (args: unknown) => void);
        reject(new Error('Recieved track event with no streams'));
      } else if (stream.id === name) {
        streamClient.off('track', handleTrack as (args: unknown) => void);
        resolve(stream);
      }
    };

    streamClient.on('track', handleTrack as (args: unknown) => void);
  });

  await streamClient.add(name);

  return streamPromise;
};
