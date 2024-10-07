import { createRequire as _createRequire } from 'module';
const __require = _createRequire(import.meta.url);
const VIAM = __require('@viamrobotics/sdk');
const wrtc = __require('node-datachannel/polyfill');
const connectNode = __require('@connectrpc/connect-node');
globalThis.VIAM = {
  // @ts-ignore
  GRPC_TRANSPORT_FACTORY: (opts) =>
    connectNode.createGrpcTransport({ httpVersion: '2', ...opts }),
};
for (const key in wrtc) {
  global[key] = wrtc[key];
}
async function connect() {
  const host = process.env.HOST;
  const apiKeyId = process.env.API_KEY_ID;
  const apiKeySecret = process.env.API_KEY_SECRET;
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
