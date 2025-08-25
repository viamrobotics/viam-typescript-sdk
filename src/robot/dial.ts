import { RobotClient, type DialConf } from './client';

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
  const client = await new RobotClient().dial(conf);

  if (client.isConnected()) {
    return client;
  }

  throw new Error('Failed to connect to robot');
};
