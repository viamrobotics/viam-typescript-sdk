import { type DialOptions } from '@viamrobotics/rpc/src/dial';
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

  const serviceHost = 'https://app.viam.com:443';

  const dialOpts: DialOptions = {
    authEntity: serviceHost,
    credentials: credential,
  };
  return new VIAM.ViamClient(serviceHost, dialOpts);
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
