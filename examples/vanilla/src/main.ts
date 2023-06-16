import * as VIAM from '@viamrobotics/sdk';

async function connect(): Promise<VIAM.RobotClient> {
  // You can remove this block entirely if your robot is not authenticated.
  // Otherwise, replace with an actual secret.
  const secret = 'a91i8tli4smkyyrqkhn88u4h1ai2uvcgvtv9hgtyvzhd26l0';
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

  return VIAM.createRobotClient({
    host,
    credential,
    authEntity: host,
    signalingAddress,
    iceServers,
    // optional: specify max reconnection attempt tries on disconnect
    reconnectMaxAttempts: 7,
    reconnectMaxWait: 1000,
  });
}

function button() {
  return <HTMLButtonElement>document.getElementById('main-button');
}

// This function runs a motor component with a given name on your robot.
// Feel free to replace it with whatever logic you want to test out!
async function run(client: VIAM.RobotClient) {
  // Replace with the name of a motor on your robot.
  const name = '<MOTOR NAME>';
  const mc = new VIAM.MotorClient(client, name);

  try {
    button().disabled = true;

    console.log(await mc.getPosition());
    await mc.goFor(100, 10);
    console.log(await mc.getPosition());
  } finally {
    button().disabled = false;
  }
}

// This function is called when the robot is disconnected.
// Feel free to replace it with whatever logic you want to test out!
async function disconnected(event) {
  console.log('The robot has been disconnected. Trying reconnect...');
}

// This function is called when the robot is reconnected.
// Feel free to replace it with whatever logic you want to test out!
async function reconnected(event) {
  console.log('The robot has been reconnected. Work can be continued.');
}

async function main() {
  // Connect to client
  let client: VIAM.RobotClient;
  try {
    client = await connect();
    console.log('connected!');
    client.on('disconnected', disconnected);
    client.on('reconnected', reconnected);
  } catch (error) {
    console.log(error);
    return;
  }

  // Make the button in our app do something interesting
  button().onclick = async () => {
    await run(client);
  };
  button().disabled = false;
}

main();
