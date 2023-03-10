import { Client, MotorClient, createRobotClient } from '@viamrobotics/sdk';

async function connect() {
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

  return createRobotClient({
    host,
    credential,
    authEntity: host,
    signalingAddress,
    iceServers,
  });
}

function button() {
  return <HTMLButtonElement>document.getElementById('main-button');
}

// This function runs a motor component with a given named on your robot.
// Feel free to replace it whatever logic you want to test out!
async function run(client: Client) {
  // Replace with the name of a motor on your robot.
  const name = '<MOTOR NAME>';
  const mc = new MotorClient(client, name);

  try {
    button().disabled = true;

    console.log(await mc.getPosition());
    await mc.goFor(100, 10);
    console.log(await mc.getPosition());
  } finally {
    button().disabled = false;
  }
}

async function main() {
  // Connect to client
  let client: Client;
  try {
    client = await connect();
    console.log('connected!');
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
