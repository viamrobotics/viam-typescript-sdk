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

  const dialOpts: DialOptions = {
    authEntity: host,
    credentials: credential,
  };

  const client = new VIAM.ViamClient(dialOpts);
  await client.connect();

  return client;
}

function button() {
  return <HTMLButtonElement>document.getElementById('main-button');
}

async function run(client: VIAM.ViamClient) {
  // A filter is an optional tool to filter out which data comes back.
  const opts: VIAM.FilterOptions = { componentType: 'camera' };
  const filter = client.dataClient.createFilter(opts);

  try {
    button().disabled = true;
    const textElement = <HTMLButtonElement>document.getElementById('text');
    textElement.innerHTML = 'waiting for data...';

    const dataList = await client.dataClient.tabularDataByFilter(filter);
    // for(data=0;data<=dataList.length();data++)
    textElement.innerHTML = dataList;
    console.log(dataList);
  } finally {
    button().disabled = false;
  }
}

async function main() {
  let client: VIAM.ViamClient;
  try {
    console.log('app is connecting...');
    client = await connect();
    console.log('app is connected!');
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
