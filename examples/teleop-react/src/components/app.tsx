import { VideoStream } from './video-stream.js';
import { ConnectForm } from './connect-form.js';

import { setCredentials, useStream } from './state.js';

export const App = (): JSX.Element => {
  const stream = useStream('cam');

  return (
    <>
      <ConnectForm setCredentials={setCredentials} />
      <VideoStream stream={stream} />
    </>
  );
};
