import { DialOptions } from '@viamrobotics/rpc/src/dial';
import * as VIAM from '@viamrobotics/sdk';

async function connect(): Promise<VIAM.ViamClient> {
  // You can remove this block entirely if your robot is not authenticated.
  // Otherwise, replace with an actual secret.
  const secret = '<SECRET>';
  const credential = {
    payload: secret,
    type: 'robot-location-secret',
  };

  // Replace with the host of your actual robot running Viam.
  const host = '<HOST>';

  // Replace with the signaling address. If you are running your robot on Viam,
  // it is most likely https://app.viam.com:443.
  const signalingAddress = '<SIGNALING ADDRESS>';

  // You can replace this with a different ICE server, append additional ICE
  // servers, or omit entirely. This option is not strictly required but can
  // make it easier to connect via WebRTC.
  const iceServers = [{ urls: 'stun:global.stun.twilio.com:3478' }];

  const robotClient = await VIAM.createRobotClient({
    host,
    credential,
    authEntity: host,
    signalingAddress,
    iceServers,
    // optional: configure reconnection options
    reconnectMaxAttempts: 7,
    reconnectMaxWait: 1000,
  });

  const dialOpts: DialOptions = { authEntity: host, credentials: credential };
  return new VIAM.ViamClient(robotClient, dialOpts);
}

async function main() {
  let client: VIAM.ViamClient;
  try {
    client = await connect();
    await client.connect();
    console.log('app is connected!');
  } catch (error) {
    console.log(error);
    return;
  }
}

main();
