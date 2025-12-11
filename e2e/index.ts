import {
  RobotClient,
  ArmClient,
  CameraClient,
  VisionClient,
  type DialConf,
  MachineConnectionEvent,
} from '../src/main';
import { defaultConfig, invalidConfig } from './fixtures/configs/dial-configs';
import type { ResolvedReturnType } from './helpers/api-types';

const client = new RobotClient();
const armClient = new ArmClient(client, 'fake_arm');
const cameraClient = new CameraClient(client, 'fake_camera');
const visionClient = new VisionClient(client, 'fake_vision');

const getElement = <T extends HTMLElement>(id: string) =>
  document.querySelector<T>(`[data-testid="${id}"]`);

const getElements = <T extends HTMLElement>(selector: string) =>
  document.querySelectorAll<T>(selector);

const getButton = (id: string) => getElement<HTMLButtonElement>(id);

const connectionStatusEl = getElement<HTMLDivElement>('connection-status');
const dialingStatusEl = getElement<HTMLDivElement>('dialing-status');
const connectBtn = getButton('connect-btn');
const disconnectBtn = getButton('disconnect-btn');
const connectInvalidBtn = getButton('connect-invalid-btn');

const robotAPIButtons = getElements<HTMLButtonElement>('[data-robot-api]');
const armAPIButtons = getElements<HTMLButtonElement>('[data-arm-api]');
const cameraAPIButtons = getElements<HTMLButtonElement>('[data-camera-api]');
const visionAPIButtons = getElements<HTMLButtonElement>('[data-vision-api]');

const outputEl = getElement<HTMLPreElement>('output');

const setConnectionStatus = (status: string) => {
  if (!connectionStatusEl) {
    return;
  }

  connectionStatusEl.textContent = status;
  connectionStatusEl.dataset.status = status;
};

const setDialingStatus = (status: string) => {
  if (!dialingStatusEl) {
    return;
  }

  dialingStatusEl.textContent = status;
};

const setButtonsDisabled = (disabled: boolean) => {
  if (connectBtn) {
    connectBtn.disabled = !disabled;
  }
  if (disconnectBtn) {
    disconnectBtn.disabled = disabled;
  }
  for (const button of robotAPIButtons) {
    button.disabled = disabled;
  }
  for (const button of armAPIButtons) {
    button.disabled = disabled;
  }
  for (const button of cameraAPIButtons) {
    button.disabled = disabled;
  }
  for (const button of visionAPIButtons) {
    button.disabled = disabled;
  }
};

const setOutput = (data: unknown) => {
  if (!outputEl) {
    return;
  }

  outputEl.textContent = JSON.stringify(data, null, 2);
  outputEl.dataset.hasOutput = 'true';
};

const clearOutput = () => {
  if (!outputEl) {
    return;
  }

  outputEl.textContent = 'No output yet';
  outputEl.dataset.hasOutput = 'false';
};

const setError = (error: Error) => {
  setOutput({ error: error.message, stack: error.stack });
};

client.on(MachineConnectionEvent.CONNECTED, () => {
  setConnectionStatus('Connected');
  setButtonsDisabled(false);
});

client.on(MachineConnectionEvent.DISCONNECTED, () => {
  setConnectionStatus('Disconnected');
  setButtonsDisabled(true);
});

client.on(MachineConnectionEvent.DIALING, (args: unknown) => {
  const { method, attempt } = args as { method: string; attempt: number };
  setDialingStatus(`Dialing ${method} (attempt ${attempt + 1})`);
});

client.on(MachineConnectionEvent.CONNECTING, () => {
  setConnectionStatus('Connecting');
});

client.on(MachineConnectionEvent.DISCONNECTING, () => {
  setConnectionStatus('Disconnecting');
});

const connect = async (config: DialConf = defaultConfig) => {
  try {
    await client.dial(config);
    setDialingStatus('');
  } catch (error) {
    setError(error as Error);
  }
};

const disconnect = async () => {
  try {
    await client.disconnect();
    setDialingStatus('');
  } catch (error) {
    setError(error as Error);
  }
};

// Attach Event Handlers
connectBtn?.addEventListener('click', () => {
  void connect();
});

connectInvalidBtn?.addEventListener('click', () => {
  void connect(invalidConfig);
});

disconnectBtn?.addEventListener('click', () => {
  void disconnect();
});

const callAPI = async <T, K extends keyof T>(apiClient: T, api: K) => {
  const clientFunc = apiClient[api] as () => Promise<ResolvedReturnType<T[K]>>;

  if (typeof clientFunc !== 'function') {
    throw new TypeError(
      `${String(api)} is not a method on the resource client.`
    );
  }

  try {
    const result = await clientFunc.apply(apiClient);
    setOutput(result);
  } catch (error) {
    setError(error as Error);
  }
};

for (const button of robotAPIButtons) {
  button.addEventListener('click', () => {
    clearOutput();
    const api = button.dataset.robotApi as keyof RobotClient;
    void callAPI(client, api);
  });
}

for (const button of armAPIButtons) {
  button.addEventListener('click', () => {
    clearOutput();
    const api = button.dataset.armApi as keyof ArmClient;
    void callAPI(armClient, api);
  });
}

for (const button of cameraAPIButtons) {
  button.addEventListener('click', () => {
    clearOutput();
    const api = button.dataset.cameraApi as keyof CameraClient;
    void callAPI(cameraClient, api);
  });
}

for (const button of visionAPIButtons) {
  button.addEventListener('click', () => {
    clearOutput();
    const api = button.dataset.visionApi as keyof VisionClient;
    void callAPI(visionClient, api);
  });
}

document.body.dataset.ready = 'true';
