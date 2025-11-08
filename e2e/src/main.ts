/**
 * E2E Test Harness
 *
 * This page loads the Viam SDK in a browser environment for end-to-end testing.
 * It attaches behavior to the buttons in index.html to trigger SDK operations.
 */

import {
  RobotClient,
  type DialConf,
  MachineConnectionEvent,
} from '../../src/main';
import { defaultConfig, invalidConfig } from '../fixtures/configs/dial-configs';
import type { ArgumentsType, ResolvedReturnType } from '../helpers/api-types';

const client = new RobotClient();

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

const callRobotAPI = async <T extends RobotClient, K extends keyof T>(
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
    setOutput(result);
  } catch (error) {
    setError(error as Error);
  }
};

const makeRobotAPICall = <T extends RobotClient, K extends keyof T>(
  apiClient: T,
  api: K,
  args: ArgumentsType<T[K]>
) => {
  clearOutput();
  void callRobotAPI(apiClient, api, args);
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

for (const button of robotAPIButtons) {
  button.addEventListener('click', () => {
    makeRobotAPICall(client, button.dataset.robotApi as keyof RobotClient, []);
  });
}

document.body.dataset.ready = 'true';
