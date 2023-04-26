import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './app.js';

const root = document.getElementById('root');

if (root === null) {
  throw new Error('#root element not found, application is misconfigured');
}

ReactDOM.createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
