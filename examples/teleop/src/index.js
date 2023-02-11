import { Elm } from './Main.elm';
import { Client, BaseClient, MotorClient } from '@viamrobotics/sdk';

async function connect() {
  // // You can remove this block entirely if your robot is not authenticated.
  // // Otherwise, replace with an actual secret.
  // const secret = import.meta.env.VITE_SECRET;
  // const creds = {
  //   payload: secret,
  //   type: 'robot-location-secret',
  // };

  // Replace with the host of your actual robot running Viam.
  const host = import.meta.env.VITE_HOST;
  const client = new Client(host);

  // Omit `creds` if your robot is not authenticated.
  // await client.connect(undefined, creds);
  await client.connect();

  return client;
}

const client = await connect();
const base = new BaseClient(client, 'base1');
const m1 = new MotorClient(client, 'motor1');

const app = Elm.Main.init({
  node: document.getElementById('main'),
  flags: {},
});

app.ports.sendGetPosition.subscribe(async () => {
  const position = await m1.getPosition();
  app.ports.recvGetPosition.send(position);
});

app.ports.sendMotorGoFor.subscribe(async ({ rpm, revs }) => {
  await m1.goFor(rpm, revs);
  const position = await m1.getPosition();
  app.ports.recvGetPosition.send(position);
});

app.ports.sendBaseMoveStraight.subscribe(async ({ dist, speed }) => {
  await base.moveStraight(dist, speed);
  const position = await m1.getPosition();
  app.ports.recvGetPosition.send(position);
});
