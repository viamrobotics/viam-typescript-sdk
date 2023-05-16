import { Elm } from './Main.elm';
import * as VIAM from '@viamrobotics/sdk';

async function connectWebRTC() {
  const locationSecret = import.meta.env.VITE_SECRET;
  const host = import.meta.env.VITE_WEBRTC_HOST;
  const signalingAddress = import.meta.env.VITE_WEBRTC_SIGNALING_ADDRESS;

  return VIAM.createRobotClient({
    host,
    credential: {
      type: 'robot-location-secret',
      payload: locationSecret,
    },
    authEntity: host,
    signalingAddress,
  });
}

function onTrack(event) {
  const eventStream = event.streams[0];
  if (!eventStream) {
    throw new Error('expected event stream to exist');
  }

  const streamName = eventStream.id;
  const streamContainers = document.querySelectorAll(
    `[data-stream="${streamName}"]`
  );

  // Most of this logic is a hack that to inject a WebRTC stream into the DOM.
  // Elm does not support media elements so we have to do it here.
  for (const streamContainer of streamContainers) {
    const mediaElement = document.createElement('video');
    mediaElement.srcObject = eventStream;
    mediaElement.autoplay = true;
    if (mediaElement instanceof HTMLVideoElement) {
      mediaElement.playsInline = true;
      mediaElement.controls = false;
      mediaElement.muted = true;
    } else {
      mediaElement.controls = true;
    }

    streamContainer.querySelector('video')?.remove();
    streamContainer.append(mediaElement);
  }
}

// Connect and setup app

connectWebRTC()
  .then((client) => {
    const base = new VIAM.BaseClient(client, 'viam_base');
    const wifi = new VIAM.SensorClient(client, 'wifi');
    const accel = new VIAM.MovementSensorClient(client, 'accelerometer');

    const app = Elm.Main.init({
      node: document.getElementById('main'),
      flags: {},
    });

    // streams

    const streams = new VIAM.StreamClient(client);
    streams.on('track', onTrack);

    app.ports.sendBaseSetPower.subscribe(async ({ linear, angular }) => {
      const linearVec = { x: 0, y: linear, z: 0 };
      const angularVec = { x: 0, y: 0, z: angular };

      await base.setPower(linearVec, angularVec);
    });

    app.ports.sendBaseStop.subscribe(async () => {
      await base.stop();
    });

    app.ports.getWifiReading.subscribe(async () => {
      const readings = await wifi.getReadings();
      app.ports.recvWifiReading.send(readings);
    });

    app.ports.getAccelReading.subscribe(async () => {
      const readings = await accel.getLinearAcceleration();
      app.ports.recvAccelReading.send(readings);
    });

    // Add stream from camera
    streams.add('cam');
  })
  .catch((err) => {
    console.error('something went wrong');
    console.error(err);
  });
