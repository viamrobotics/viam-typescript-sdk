import * as VIAM from '@viamrobotics/sdk';

const API_KEY_ID = import.meta.env.VITE_API_KEY_ID;
const API_KEY_SECRET = import.meta.env.VITE_API_KEY_SECRET;

async function connect(): Promise<VIAM.ViamClient> {
  const opts: VIAM.ViamClientOptions = {
    credential: {
      type: 'api-key',
      authEntity: API_KEY_ID,
      payload: API_KEY_SECRET,
    },
  };

  const client = await VIAM.createViamClient(opts);

  return client;
}

const button = <HTMLButtonElement>document.getElementById('main-button');

async function run(client: VIAM.ViamClient) {
  // A filter is an optional tool to filter out which data comes back.
  // const opts: VIAM.FilterOptions = { componentType: 'camera' };
  const opts: VIAM.FilterOptions = { componentType: 'camera' };
  const filter = client.dataClient.createFilter(opts);

  try {
    button.disabled = true;
    const textElement = <HTMLParagraphElement>document.getElementById('text');
    textElement.innerHTML = 'waiting for data...';

    const dataList = await client.dataClient.tabularDataByFilter(filter);
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
