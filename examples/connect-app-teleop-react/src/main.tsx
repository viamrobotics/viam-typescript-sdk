import { FusionAuthProvider, type FusionAuthProviderConfig } from '@fusionauth/react-sdk';
import { StrictMode, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './app.js';
import { getEnv, type BuildEnvironment } from './env.js';

const root = document.getElementById('root');

if (root === null) {
  throw new Error('#root element not found, application is misconfigured');
}

let env: BuildEnvironment;
try {
  env = getEnv();
} catch (err) {
  ReactDOM.createRoot(root).render(
    <StrictMode>
      <div>{(err as Error).message}</div>
    </StrictMode>
  );
  throw err;
}

if (env.auth.case == "api_key") {
  ReactDOM.createRoot(root).render(
    <StrictMode>
      <App env={env} />
    </StrictMode>
  );
} else {
  const thisHost = `${window.location.protocol}//${window.location.host}`
  const config: FusionAuthProviderConfig = {
    clientId: env.auth.clientId,
    serverUrl: env.baseUri,
    redirectUri: thisHost,
    shouldAutoFetchUserInfo: true,
    shouldAutoRefresh: true,
    onRedirect: () => {
      window.location.href = thisHost;
    } 
  };

  ReactDOM.createRoot(root).render(
    <StrictMode>
      <FusionAuthProvider {...config}>
        <App env={env} />
      </FusionAuthProvider>
    </StrictMode>
  );
}
