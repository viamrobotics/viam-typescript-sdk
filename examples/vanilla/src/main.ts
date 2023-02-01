import { Client, MotorClient } from "@viamrobotics/sdk";
import type { Credentials } from "@viamrobotics/rpc/src/dial";

async function connect() {
  // You can remove this block entirely if your robot is not authenticated.
  // Otherwise, replace with an actual secret.
  const secret = "<SECRET>"
  const creds: Credentials = {
    payload: secret,
    type: "robot-location-secret",
  };

  // Replace with the host of your actual robot running Viam.
  const host = "<HOST>"
  const client = new Client(host);

  // Omit `creds` if your robot is not authenticated.
  await client.connect(undefined, creds);

  return client;
}

function button() {
  return <HTMLButtonElement>document.getElementById("main-button");
}

// This function runs a motor named "motor1" on your robot.
// Feel free to replace it whatever logic you want to test out!
async function run(client: Client) {
  // Replace with the name of a motor on your robot.
  const name = "<MOTOR NAME>";
  const mc = new MotorClient(client, name);

  try {
    button().disabled = true;

    console.log(await mc.getPosition());
    await mc.goFor(100, 10);
    console.log(await mc.getPosition());
  } finally {
    button().disabled = false;
  }
}

async function main() {
  // Connect to client
  let client: Client;
  try {
    client = await connect();
    console.log("connected!");
  } catch (error) {
    console.log(error);
    return;
  }

  // Make the button in our app do something interesting
  button().onclick = async () => {
    await run(client);
  };
  button().disabled = false;
}

main();
