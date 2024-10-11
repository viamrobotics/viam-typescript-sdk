import { createRobotClient } from '../../src/main';

const main = async () => {
  const machine = await createRobotClient({
    host: 'e2e-ts-sdk',
    signalingAddress: 'http://localhost:9090',
    iceServers: [{ urls: 'stun:global.stun.twilio.com:3478' }],
  });
  const resourceNames = await machine.resourceNames();

  const resNamesDiv = document.createElement('div');
  resNamesDiv.dataset.testid = 'resource-names';
  for (const resourceName of resourceNames) {
    const resNameDiv = document.createElement('div');
    resNameDiv.textContent = resourceName.name;
    resNameDiv.dataset.testid = 'resource-name';
    resNamesDiv.append(resNameDiv);
  }
  document.body.append(resNamesDiv);

  const stream = machine.streamStatus(resourceNames);
  const statusesDiv = document.createElement('div');
  statusesDiv.dataset.testid = 'statuses';

  let i = 0;
  for await (const statuses of stream) {
    for await (const status of statuses) {
      const statusDiv = document.createElement('div');
      statusDiv.textContent = status.toJsonString();
      statusDiv.dataset.testid = 'status';
      statusesDiv.append(statusDiv);
    }

    i += 1;
    if (i >= 3) {
      break;
    }
  }
  document.body.append(statusesDiv);
};

main().catch(console.error); // eslint-disable-line no-console
