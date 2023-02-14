import { Elm } from './Main.elm';
import { Client, BaseClient, MotorClient, commonApi } from '@viamrobotics/sdk';

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

// Connect and setup app

connect()
  .then((client) => {
    const base = new BaseClient(client, 'viam_base');
    const m1 = new MotorClient(client, 'left');

    const app = Elm.Main.init({
      node: document.getElementById('main'),
      flags: {},
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
  })
  .catch((err) => {
    console.error('something went wrong');
    console.error(err);
  });
