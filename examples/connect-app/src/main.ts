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
    authEntity: host,
    credentials: credential,
  };
  return new VIAM.ViamClient(serviceHost, dialOpts);
}

async function main() {
  let client: VIAM.ViamClient;
  try {
    console.log('app is connecting...');
    client = await connect();
    await client.connect();
    console.log('app is connected!');

    // A filter is an optional tool to filter out which data comes back.
    const filter = new VIAM.dataApi.Filter();
    // Replace the method and parameter with the desired filter.
    filter.setComponentType('camera');

    console.log('waiting for data...');
    const data = await client.dataClient.tabularDataByFilter(filter);
    console.log(data);
  } catch (error) {
    console.log(error);
    return;
  }
}

main();
