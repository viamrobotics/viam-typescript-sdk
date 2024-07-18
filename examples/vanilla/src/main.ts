import * as VIAM from '@viamrobotics/sdk';

const HOST = import.meta.env.VITE_HOST;
const API_KEY_ID = import.meta.env.VITE_API_KEY_ID;
const API_KEY = import.meta.env.VITE_API_KEY;

const connectionStatusEl = <HTMLElement>(
  document.getElementById('connection-status')
);
const connectEl = <HTMLButtonElement>document.getElementById('connect');
const disconnectEl = <HTMLButtonElement>document.getElementById('disconnect');
const resourcesEl = <HTMLButtonElement>document.getElementById('resources');

// let client: VIAM.ViamClient | undefined = undefined;
let machine: VIAM.RobotClient | undefined = undefined;

const handleConnectionStateChange = (event: unknown) => {
  updateConnectionStatus(
    (event as { eventType: VIAM.MachineConnectionEvent }).eventType
  );
};

const updateConnectionStatus = (eventType: VIAM.MachineConnectionEvent) => {
  switch (eventType) {
    case VIAM.MachineConnectionEvent.CONNECTING:
      connectionStatusEl.textContent = 'Connecting...';
      break;
    case VIAM.MachineConnectionEvent.CONNECTED:
      connectionStatusEl.textContent = 'Connected';
      break;
    case VIAM.MachineConnectionEvent.DISCONNECTING:
      connectionStatusEl.textContent = 'Disconnecting...';
      break;
    case VIAM.MachineConnectionEvent.DISCONNECTED:
      connectionStatusEl.textContent = 'Disconnected';
      break;
  }
};

const connect = async () => {
  if (machine) {
    await machine.connect();
    return;
  }

  updateConnectionStatus(VIAM.MachineConnectionEvent.CONNECTING);

  try {
    machine = await VIAM.createRobotClient({
      host: HOST,
      credential: {
        type: 'api-key',
        payload: API_KEY,
      },
      authEntity: API_KEY_ID,
      signalingAddress: 'https://app.viam.com:443',
    });
    updateConnectionStatus(VIAM.MachineConnectionEvent.CONNECTED);
    machine.on('connectionstatechange', handleConnectionStateChange);
  } catch {
    updateConnectionStatus(VIAM.MachineConnectionEvent.DISCONNECTED);
  }
};

const disconnect = async () => {
  if (!machine) {
    return;
  }

  await machine.disconnect();
};

const logResources = async () => {
  console.log(
    machine?.isConnected() ? await machine.resourceNames() : 'Not connected'
  );
};

async function main() {
  updateConnectionStatus(VIAM.MachineConnectionEvent.DISCONNECTED);

  connectEl.addEventListener('click', async () => {
    await connect();
  });
  disconnectEl.addEventListener('click', async () => {
    await disconnect();
  });
  resourcesEl.addEventListener('click', async () => {
    await logResources();
  });
}

main();
