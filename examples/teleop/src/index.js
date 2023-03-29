import { Elm } from './Main.elm';
import {
  // Client,
  BaseClient,
  MotorClient,
  MovementSensorClient,
  SensorClient,
  StreamClient,
  commonApi,
  movementSensorApi,
  createRobotClient,
} from '@viamrobotics/sdk';
import { grpc } from '@improbable-eng/grpc-web';

async function connect() {
  // You can remove this block entirely if your robot is not authenticated.
  // Otherwise, replace with an actual secret.
  const secret = import.meta.env.VITE_SECRET;
  // Replace with the host of your actual robot running Viam.
  const host = import.meta.env.VITE_HOST;
  return createRobotClient({ host, secret });
}

async function connectWebRTC() {
  const secret = import.meta.env.VITE_SECRET;

  const host = import.meta.env.VITE_WEBRTC_HOST;
  const signalingAddress = import.meta.env.VITE_WEBRTC_SIGNALING_ADDRESS;
  const iceServers = JSON.parse(import.meta.env.VITE_WEBRTC_ICE_SERVERS);

  return createRobotClient({
    host,
    secret,
    authEntity: host,
    signalingAddress,
    iceServers,
  });
}

function onTrack(event) {
  const eventStream = event.streams[0];
  if (!eventStream) {
    throw new Error('expected event stream to exist');
  }

  const kind = 'track';
  const streamName = eventStream.id;
  const streamContainers = document.querySelectorAll(
    `[data-stream="${streamName}"]`
  );

  // Most of this logic is a hack that to inject a WebRTC stream into the DOM.
  // Elm does not support media elements so we have to do it here.
  for (const streamContainer of streamContainers) {
    const mediaElement = document.createElement(kind);
    mediaElement.srcObject = eventStream;
    mediaElement.autoplay = true;
    if (mediaElement instanceof HTMLVideoElement) {
      mediaElement.playsInline = true;
      mediaElement.controls = false;
    } else {
      mediaElement.controls = true;
    }

    const child = streamContainer.querySelector(kind);
    child?.remove();
    streamContainer.append(mediaElement);
  }
}

// Connect and setup app

connectWebRTC()
  .then((client) => {
    const base = new BaseClient(client, 'viam_base');
    const wifi = new SensorClient(client, 'wifi');
    const accel = new MovementSensorClient(client, 'accelerometer');

    const app = Elm.Main.init({
      node: document.getElementById('main'),
      flags: {},
    });

    // streams

    const streams = new StreamClient(client);
    streams.on('track', onTrack);

    app.ports.sendBaseSetPower.subscribe(async ({ linear, angular }) => {
      console.log('linear', linear);
      console.log('angular', angular);
      // TODO: stop requiring users to import commonApi, if possible
      const linearVec = new commonApi.Vector3();
      const angularVec = new commonApi.Vector3();
      linearVec.setY(linear);
      angularVec.setZ(angular);

      await base.setPower(linearVec, angularVec);
    });

    app.ports.sendBaseStop.subscribe(async () => {
      console.log('stopping');
      await base.stop();
    });

    app.ports.getWifiReading.subscribe(async () => {
      const readings = await wifi.getReadings();
      console.debug(readings);
      app.ports.recvWifiReading.send(readings);
    });

    app.ports.getAccelReading.subscribe(async () => {
      const readings = await accel.getLinearAcceleration();
      console.debug(readings);
      app.ports.recvAccelReading.send(readings);
    });

    // Add stream from camera
    streams.add('cam1');
    streams.add('cam2');
    streams.add('cam3');
  })
  .catch((err) => {
    console.error('something went wrong');
    console.error(err);
  });
