import { type DialOptions } from '@viamrobotics/rpc/src/dial';
import * as VIAM from '@viamrobotics/sdk';

async function connect(): Promise<VIAM.ViamClient> {
  const credential = {
    payload: '2gi0e4bndmuxep6eto0rsrx1hv76peo7',
    type: 'api-key',
  };

  const dialOpts: DialOptions = {
    authEntity: '7424310b-6b42-466e-b4ad-2c709eaeea42',
    credentials: credential,
  };

  const client = new VIAM.ViamClient(dialOpts);
  await client.connect();

  return client;
}

const button = <HTMLButtonElement>document.getElementById('main-button');

async function run(client: VIAM.ViamClient) {
  // A filter is an optional tool to filter out which data comes back.
  const opts: VIAM.FilterOptions = {
    locationIdsList: ['b3g79ptyug'],
    mimeTypeList: ['image/jpeg'],
  };
  const filter = client.dataClient.createFilter(opts);

  try {
    button.disabled = true;
    const textElement = <HTMLParagraphElement>document.getElementById('text');
    textElement.innerHTML = 'waiting for data...';

    const binaryId: VIAM.BinaryID = {
      fileId:
        'KSuK20sVumkpMqVZx7gAj99Qqt9nRsHrbrYeQYgnrEQ1QpugXhu9G1ORgs0Y0DLo',
      organizationId: 'e76d1b3b-0468-4efd-bb7f-fb1d2b352fcb',
      locationId: 'b3g79ptyug',
    };

    const dataList = await client.dataClient.binaryDataByIds([binaryId]);
    const dataList2 = await client.dataClient.binaryDataByFilter(filter);
    // const text = JSON.stringify(dataList, null, 2) + JSON.stringify(dataList2, null, 2);
    console.log(dataList);
    console.log(dataList2);
    textElement.innerHTML = JSON.stringify(dataList, null, 2);
  } finally {
    button.disabled = false;
  }
}

async function main() {
  let client: VIAM.ViamClient;
  try {
    button.textContent = 'Connecting...';
    client = await connect();
    button.textContent = 'Click for data';
  } catch (error) {
    button.textContent = 'Unable to connect';
    console.error(error);
    return;
  }

  // Make the button in our app do something interesting
  button.addEventListener('click', async () => {
    await run(client);
  });
  button.disabled = false;
}

main();
