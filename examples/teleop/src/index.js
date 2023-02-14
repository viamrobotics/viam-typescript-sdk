import { Elm } from './Main.elm';
import {
  Client,
  BaseClient,
  MotorClient,
  StreamClient,
  commonApi,
} from '@viamrobotics/sdk';

async function connect() {
  // You can remove this block entirely if your robot is not authenticated.
  // Otherwise, replace with an actual secret.
  const secret = import.meta.env.VITE_SECRET;
  const creds = {
    payload: secret,
    type: 'robot-location-secret',
  };

  // Replace with the host of your actual robot running Viam.
  const host = import.meta.env.VITE_HOST;
  const client = new Client(host);

  // Omit `creds` if your robot is not authenticated.
  try {
    await client.connect(undefined, creds);
  } catch (err) {
    console.error('failed to connect');
    console.error(err);
    throw err;
  }

  return client;
}

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

// Connect and setup app

connectWebRTC()
  .then((client) => {
    const base = new BaseClient(client, 'viam_base');
    const m1 = new MotorClient(client, 'left');

    const app = Elm.Main.init({
      node: document.getElementById('main'),
      flags: {},
    });

    // streams
    const streams = new StreamClient(client);
    streams.on('track', (event) => {
      const eventStream = event.streams[0];
      if (!eventStream) {
        throw new Error('expected event stream to exist');
      }
      const kind = 'track';
      const streamName = eventStream.id;
      const streamContainers = document.querySelectorAll(
        `[data-stream="${streamName}"]`
      );

      console.debug('stream preview containers', streamContainers);

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

      const streamPreviewContainers = document.querySelectorAll(
        `[data-stream-preview="${streamName}"]`
      );
      for (const streamContainer of streamPreviewContainers) {
        const mediaElementPreview = document.createElement(kind);
        mediaElementPreview.srcObject = eventStream;
        mediaElementPreview.autoplay = true;
        if (mediaElementPreview instanceof HTMLVideoElement) {
          mediaElementPreview.playsInline = true;
          mediaElementPreview.controls = false;
        } else {
          mediaElementPreview.controls = true;
        }
        const child = streamContainer.querySelector(kind);
        child?.remove();
        streamContainer.append(mediaElementPreview);
      }
    });

    app.ports.sendGetPosition.subscribe(async () => {
      const position = await m1.getPosition();
      app.ports.recvGetPosition.send(position);
    });

    app.ports.sendBaseSetPower.subscribe(async ({ linear, angular }) => {
      console.log('linear', linear);
      console.log('angular', angular);
      const linearVec = new commonApi.Vector3();
      const angularVec = new commonApi.Vector3();
      linearVec.setY(linear);
      angularVec.setZ(angular);

      await base.setPower(linearVec, angularVec);

      const position = await m1.getPosition();
      app.ports.recvGetPosition.send(position);
    });

    app.ports.sendBaseStop.subscribe(async () => {
      console.log('stopping');
      await base.stop();

      const position = await m1.getPosition();
      app.ports.recvGetPosition.send(position);
    });

    streams.add('cam');
  })
  .catch((err) => {
    console.error('something went wrong');
    console.error(err);
  });
