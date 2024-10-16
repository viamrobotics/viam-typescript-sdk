const VIAM = require('@viamrobotics/sdk');
const wrtc = require('node-datachannel/polyfill');
const connectNode = require('@connectrpc/connect-node');

// @ts-expect-error
globalThis.VIAM = {
  GRPC_TRANSPORT_FACTORY: (opts: any) =>
    connectNode.createGrpcTransport({ httpVersion: '2', ...opts }),
};
for (const key in wrtc) {
  (global as any)[key] = (wrtc as any)[key];
}

async function connect() {
  const host = process.env.HOST;
  const apiKeyId = process.env.API_KEY_ID;
  const apiKeySecret = process.env.API_KEY;
  if (!host) {
    throw new Error('must set HOST env var');
  }
  if (!apiKeyId) {
    throw new Error('must set API_KEY_ID env var');
  }
  if (!apiKeySecret) {
    throw new Error('must set API_KEY_SECRET env var');
  }

  const client = await VIAM.createRobotClient({
    host,
    credentials: {
      type: 'api-key',
      authEntity: apiKeyId,
      payload: apiKeySecret,
    },
    signalingAddress: 'https://app.viam.com:443',
    iceServers: [{ urls: 'stun:global.stun.twilio.com:3478' }],
  });

  console.log(await client.resourceNames());
}

connect().catch((e) => {
  console.error('error connecting to machine', e);
});
