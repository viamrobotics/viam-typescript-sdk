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
};

main().catch(console.error); // eslint-disable-line no-console
