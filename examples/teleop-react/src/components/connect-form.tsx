import { ChangeEventHandler, useState } from 'react';
import type { Credentials } from './client';

export interface ConnectFormProps {
  onSubmit: (credentials: Credentials) => unknown;
}

export const ConnectForm = (props: ConnectFormProps): JSX.Element => {
  const { onSubmit } = props;
  const [hostname, setHostname] = useState('');
  const [secret, setSecret] = useState('');

  const handleHost: ChangeEventHandler<HTMLInputElement> = (event) => {
    setHostname(event.target.value);
  };
  const handleSecret: ChangeEventHandler<HTMLInputElement> = (event) => {
    setSecret(event.target.value);
  };
  const handleSubmit = () => {
    onSubmit({ hostname, secret });
  };

  return (
    <form className="flex flex-col p-4" onSubmit={handleSubmit}>
      <label className="flex flex-col mb-2">
        Remote Address
        <input
          type="text"
          className="w-64 border-solid border-2 border-black"
          onChange={handleHost}
        />
      </label>
      <label className="flex flex-col mb-6">
        Location Secret
        <input
          type="password"
          className="w-64 border-solid border-2 border-black"
          onChange={handleSecret}
        />
      </label>
      <button type="submit" className="border-solid border-2 border-black w-32">
        Connect
      </button>
    </form>
  );
};
