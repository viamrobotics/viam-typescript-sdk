import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import './App.css';

import {
  Client,
  BaseClient,
  MovementSensorClient,
  SensorClient,
  StreamClient
} from '@viamrobotics/sdk';

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

  const rtcConfig = { "iceServers":[] };
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

const READINGS_INTERVAL = 1000;

function App() {
  const [ base, setBase ] = useState<BaseClient>();
  const [ wifi, setWifi ] = useState<SensorClient>();
  const [ wifiReadings, setWifiReadings ] = useState<Record<string, unknown>>();
  const [ accel, setAccel ] = useState<MovementSensorClient>();
  const [ accelReadings, setAccelReadings ] = useState<{x: number, y: number, z: number}>();
  const [ stream, setStream ] = useState<StreamClient>();

  const [ count, setCount ] = useState(0);

  const ready = () => {
    if (!base) return false;
    if (!wifi) return false;
    if (!accel) return false;
    if (!stream) return false;

    return true;
  }

  // connect to client
  useEffect(() => { 
    const connect = async () => {
      const client: Client = await connectWebRTC();

      setBase(new BaseClient(client, "viam_base"));
      setWifi(new SensorClient(client, "wifi"));
      setAccel(new MovementSensorClient(client, "accelerometer"));
      setStream(new StreamClient(client, "cam"));
    }

    connect().catch((err) => console.error(err.message));
  }, [])


  useEffect(() => {
    if (!wifi) return;

    const interval = setInterval(() => {
      wifi
        .getReadings()
        .then((readings) => setWifiReadings(readings))
        .catch((err) => console.warn(`error getting wifi signal: ${err}`));
    }, READINGS_INTERVAL);
    return () => clearInterval(interval);
  }, [wifi, setWifiReadings])

  useEffect(() => {
    if (!accel) return;

    const interval = setInterval(() => {
      accel
        .getLinearAcceleration()
        .then((readings) => setAccelReadings(readings))
        .catch((err) => console.warn(`error getting acceleration: ${err}`));
    }, READINGS_INTERVAL);
    return () => clearInterval(interval);
  }, [accel, setAccelReadings])

  if (!ready()) {
    return "Loading...";
  }

  return (
    <div className="App">
      <div>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Viam</h1>
      <div className="card">
        <div>
          <p>Wifi Signal</p>
          {JSON.stringify(wifiReadings)}
        </div>
        <div>
          <p>Acceleration</p>
          {JSON.stringify(accelReadings)}
        </div>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;
