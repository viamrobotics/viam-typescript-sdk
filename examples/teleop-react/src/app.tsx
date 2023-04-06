import { VideoStream } from './components/video-stream.js';
import { ConnectForm } from './components/connect-form.js';

import { useStore, useStream } from './state.js';

export const App = (): JSX.Element => {
  const { status, connectOrDisconnect, streamClient } = useStore();
  const stream = useStream(streamClient, 'cam');

  return (
    <>
      <ConnectForm status={status} onSubmit={connectOrDisconnect} />
      <VideoStream stream={stream} />
    </>
  );
};
