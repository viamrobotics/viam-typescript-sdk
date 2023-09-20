import { type DialOptions } from '@viamrobotics/rpc/src/dial';
import * as VIAM from '@viamrobotics/sdk';

async function connect(): Promise<VIAM.ViamClient> {
  // You can remove this block entirely if your robot is not authenticated.
  // Otherwise, replace with an actual secret.
  const credential = {
    payload: '<API-KEY>',
    type: 'api-key',
  };

  const dialOpts: DialOptions = {
    authEntity: '<API-KEY-ID>',
    credentials: credential,
  };

  const client = new VIAM.ViamClient(dialOpts);
  await client.connect();

  return client;
}

const button  = <HTMLButtonElement>document.getElementById('main-button');

async function run(client: VIAM.ViamClient) {
  // A filter is an optional tool to filter out which data comes back.
  const opts: VIAM.FilterOptions = { componentType: 'camera' };
  const filter = client.dataClient.createFilter(opts);

  try {
    button.disabled = true;
    const textElement = <HTMLParagraphElement>document.getElementById('text');
    textElement.innerHTML = 'waiting for data...';

    const dataList = await client.dataClient.tabularDataByFilter(filter);
    let dataString: string = '';

    for (const data in dataList) {
      dataString = dataString + data + '<br />';
      for (const property in dataList[data]) {
        if (property === 'data') {
          dataString = dataString + property + ': <br />';
          const fieldsMap = dataList[data].data.fieldsMap;
          for (const entry in fieldsMap) {
            dataString = dataString + fieldsMap[entry][0] + ': [ ';
            for (const innerEntry in fieldsMap[entry][1]) {
              const dataPoint =
                dataList[data][property].fieldsMap[entry][1][innerEntry];
              dataString = dataString + innerEntry + ': ' + dataPoint + ', ';
            }
            dataString = dataString + ']<br />';
          }
        } else {
          dataString =
            dataString + property + ': ' + dataList[data][property] + '<br />';
        }
      }
    }
    textElement.innerHTML = dataString;
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
