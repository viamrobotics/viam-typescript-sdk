import { Client, MotorClient } from "@viamrobotics/sdk";
import type { Credentials } from "@viamrobotics/rpc/src/dial";

async function connect_insecure() {
  const client = new Client("http://localhost:8080");
  await client.connect();
  return client;
}

async function connect() {
  let creds: Credentials = {
    payload: "<SECRET>",
    type: "robot-location-secret",
  };

  const client = new Client("<HOST>");
  await client.connect("authEntity", creds);

  await client.connect();
  return client;
}

async function main() {
  let client: Client;
  try {
    let returnVal = await connect();
    client = returnVal;
    console.log("connected!");
  } catch (error) {
    console.log(error);
    return;
  }

  const mc = new MotorClient(client, "motor1");
  console.log(await mc.getPosition());

  await mc.goFor(100, 10);

  console.log(await mc.getPosition());

  return;
}

main();
