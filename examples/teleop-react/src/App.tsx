import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import './App.css';

import { Client, BaseClient, MovementSensorClient, SensorClient } from '@viamrobotics/sdk';

async function connectWebRTC() {
  const secret = import.meta.env.VITE_SECRET;
  const creds = {
    payload: secret,
    type: 'robot-location-secret',
  };

  const host = import.meta.env.VITE_WEBRTC_HOST;
  const impliedURL = host;
  const signalingAddress = import.meta.env.VITE_WEBRTC_SIGNALING_ADDRESS;
  const iceServers = JSON.parse(import.meta.env.VITE_WEBRTC_ICE_SERVERS);

  const rtcConfig = { iceServers };
  const conf = {
    enabled: true,
    host,
    signalingAddress,
    rtcConfig,
  };

  const client = new Client(impliedURL, conf);

  try {
    await client.connect(impliedURL, creds);
  } catch (err) {
    console.error('failed to connect');
    console.error(err);
    throw err;
  }

  return client;
}

function App() {
  const [ base, setBase ] = useState<BaseClient>();
  const [ wifi, setWifi ] = useState<SensorClient>();
  const [ accel, setAccel ] = useState<MovementSensorClient>();

  const [ count, setCount ] = useState(0);

  // connect to client
  useEffect(() => { 
    const connect = async () => {
      const client: Client = await connectWebRTC();

      setBase(new BaseClient(client, "viam_base"));
      setWifi(new SensorClient(client, "wifi"));
      setAccel(new MovementSensorClient(client, "accelerometer"));
    }

    connect().catch((err) => console.error(err.message));
  }, [])

  // connect to client
  useEffect(() => {
    if (!base) return;
    if (!wifi) return;
    if (!accel) return;

    console.log("Components are ready!");

  }, [base, wifi, accel])

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default App;
