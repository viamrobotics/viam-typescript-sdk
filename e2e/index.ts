import type { ArgumentsType } from 'vitest';
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
  document.querySelector<T>(`[data-${id}]`);

const getElements = <T extends HTMLElement>(id: string) =>
  document.querySelectorAll<T>(`[data-${id}]`);

const connectionStatusEl = getElement<HTMLDivElement>('connection-status');
const dialingStatusEl = getElement<HTMLDivElement>('dialing-status');
const connectBtn = getElement<HTMLButtonElement>('connect');
const disconnectBtn = getElement<HTMLButtonElement>('disconnect');
const connectInvalidBtn = getElement<HTMLButtonElement>('connect-invalid');

const robotAPIButtons = getElements<HTMLButtonElement>('robot-api');
const armAPIButtons = getElements<HTMLButtonElement>('arm-api');
const cameraAPIButtons = getElements<HTMLButtonElement>('camera-api');
const visionAPIButtons = getElements<HTMLButtonElement>('vision-api');

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
  for (const button of [
    ...robotAPIButtons,
    ...armAPIButtons,
    ...cameraAPIButtons,
    ...visionAPIButtons,
  ]) {
    button.disabled = disabled;
  }
};

const setOutput = (data: unknown) => {
  if (!outputEl) {
    return;
  }

  outputEl.textContent = JSON.stringify(data, null, 2);
};

const clearOutput = () => {
  if (!outputEl) {
    return;
  }

  outputEl.textContent = 'No output yet';
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
  const { attempt } = args as { attempt: number };
  setDialingStatus(`Dial attempt ${attempt + 1}`);
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

connectBtn?.addEventListener('click', () => {
  void connect();
});

connectInvalidBtn?.addEventListener('click', () => {
  void connect(invalidConfig);
});

disconnectBtn?.addEventListener('click', () => {
  void disconnect();
});

const callAPI = async <T, K extends keyof T>(
  apiClient: T,
  api: K,
  args: ArgumentsType<T[K]>
) => {
  const clientFunc = apiClient[api] as (
    ...args: ArgumentsType<T[K]>
  ) => Promise<ResolvedReturnType<T[K]>>;

  if (typeof clientFunc !== 'function') {
    throw new TypeError(
      `${String(api)} is not a method on the resource client.`
    );
  }

  try {
    const result = await clientFunc.apply(apiClient, args);
    // For void-returning methods, output success indicator
    setOutput(result ?? { success: true });
  } catch (error) {
    setError(error as Error);
  }
};

for (const button of robotAPIButtons) {
  button.addEventListener('click', () => {
    clearOutput();
    const api = button.dataset.robotApi as keyof RobotClient;
    void callAPI(client, api, []);
  });
}

for (const button of armAPIButtons) {
  button.addEventListener('click', () => {
    clearOutput();
    const api = button.dataset.armApi as keyof ArmClient;
    const args = JSON.parse(button.dataset.armApiArgs ?? '[]') as ArgumentsType<
      ArmClient[typeof api]
    >;
    void callAPI(armClient, api, args);
  });
}

for (const button of cameraAPIButtons) {
  button.addEventListener('click', () => {
    clearOutput();
    const api = button.dataset.cameraApi as keyof CameraClient;
    void callAPI(cameraClient, api, []);
  });
}

for (const button of visionAPIButtons) {
  button.addEventListener('click', () => {
    clearOutput();
    const api = button.dataset.visionApi as keyof VisionClient;
    const args = JSON.parse(
      button.dataset.visionApiArgs ?? '[]'
    ) as ArgumentsType<VisionClient[typeof api]>;
    void callAPI(visionClient, api, args);
  });
}

document.body.dataset.ready = 'true';
