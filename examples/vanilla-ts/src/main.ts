import { Client } from "@viamrobotics/sdk";
import type { Credentials } from "@viamrobotics/rpc/src/dial";

async function connect() {
  // TODO: update CORS config to allow us to connect to real robot
  const client = new Client("http://localhost:8080");
  await client.connect();
  return client;
}

async function main() {
  let client: Client;
  try {
    let returnVal = await connect();
    client = returnVal;
  } catch (error) {
    console.log(error);
    return;
  }
  console.log(client?.robotService.resourceNames);
  return;
}

main();
