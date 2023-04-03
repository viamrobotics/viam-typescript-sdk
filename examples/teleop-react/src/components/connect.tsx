import { setCredentials } from './client.js';
import { ConnectForm } from './connect-form.js';

export const Connect = (): JSX.Element => {
  return <ConnectForm onSubmit={setCredentials} />;
};
