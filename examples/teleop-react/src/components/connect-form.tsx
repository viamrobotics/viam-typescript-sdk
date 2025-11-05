import {
  useState,
  type ChangeEventHandler,
  type FormEventHandler,
} from 'react';

import {
  CONNECTED,
  CONNECTING,
  DISCONNECTED,
  DISCONNECTING,
  type ClientStatus,
} from '../state.js';

import type { RobotCredentials } from '../client.js';

export interface ConnectFormProps {
  status: ClientStatus;
  onSubmit: (credentials: RobotCredentials) => unknown;
}

const DISABLED_BY_STATUS = {
  [DISCONNECTED]: false,
  [CONNECTING]: true,
  [DISCONNECTING]: true,
  [CONNECTED]: false,
};

const BUTTON_TEXT_BY_STATUS = {
  [DISCONNECTED]: 'Connect',
  [CONNECTING]: 'Connecting...',
  [DISCONNECTING]: 'Disconnecting...',
  [CONNECTED]: 'Disconnect',
};

const INITIAL_HOSTNAME = import.meta.env.VITE_HOST ?? '';
const INITIAL_API_KEY_ID = import.meta.env.VITE_API_KEY_ID ?? '';
const INITIAL_API_KEY = import.meta.env.VITE_API_KEY ?? '';

export const ConnectForm = (props: ConnectFormProps): JSX.Element => {
  const { status, onSubmit } = props;
  const [hostname, setHostname] = useState(INITIAL_HOSTNAME);
  const [apiKeyId, setApiKeyId] = useState(INITIAL_API_KEY_ID);
  const [apiKey, setApiKey] = useState(INITIAL_API_KEY);
  const disabled = DISABLED_BY_STATUS[status];
  const buttonText = BUTTON_TEXT_BY_STATUS[status];

  const handleHost: ChangeEventHandler<HTMLInputElement> = (event) => {
    setHostname(event.target.value);
  };
  const handleApiKeyId: ChangeEventHandler<HTMLInputElement> = (event) => {
    setApiKeyId(event.target.value);
  };
  const handleApiKey: ChangeEventHandler<HTMLInputElement> = (event) => {
    setApiKey(event.target.value);
  };
  const handleSubmit: FormEventHandler = (event) => {
    onSubmit({ hostname, apiKeyId, apiKey });
    event.preventDefault();
  };

  return (
    <form className="flex flex-col p-4 w-96" onSubmit={handleSubmit}>
      <label className="flex flex-col mb-1">
        Remote Address
        <input
          type="text"
          className="px-1 border-solid border-2 border-black"
          value={hostname}
          onChange={handleHost}
          disabled={disabled}
        />
      </label>
      <label className="flex flex-col mb-6">
        API Key ID
        <input
          type="text"
          className="px-1 border-solid border-2 border-black"
          value={apiKeyId}
          onChange={handleApiKeyId}
          disabled={disabled}
        />
      </label>
      <label className="flex flex-col mb-6">
        API Key
        <input
          type="password"
          className="px-1 border-solid border-2 border-black"
          value={apiKey}
          onChange={handleApiKey}
          disabled={disabled}
        />
      </label>
      <button
        type="submit"
        disabled={disabled}
        className=" w-32 border-solid border-2 border-black"
      >
        {buttonText}
      </button>
    </form>
  );
};
