import * as VIAM from '@viamrobotics/sdk';

const HOST = '';
const API_KEY_ID = '';
const API_KEY = '';
const SIGNALING = 'https://app.viam.com:443';
// TURN_URI should be the URI of a TURN server returned by the signaling server.
// Example: 'turn:turn.viam.com:443'
const TURN_URI = '';

const CREDS: VIAM.Credential = {
  type: 'api-key',
  authEntity: API_KEY_ID,
  payload: API_KEY,
};

const log = (msg: string) => {
  const el = document.getElementById('output')!;
  el.textContent += msg + '\n';
  console.log(msg);
};

async function activeCandidateType(
  pc: RTCPeerConnection
): Promise<string | undefined> {
  const stats = await pc.getStats();
  let activePairId: string | undefined;
  for (const report of stats.values()) {
    if (report.type === 'transport' && report.selectedCandidatePairId) {
      activePairId = report.selectedCandidatePairId;
      break;
    }
  }
  if (!activePairId) return undefined;
  const pair = stats.get(activePairId);
  if (!pair) return undefined;
  const local = stats.get(pair.localCandidateId);
  return local?.candidateType;
}

async function dial(
  testName: string,
  extra: Partial<VIAM.DialWebRTCConf> = {}
) {
  log(`\n=== ${testName} ===`);
  try {
    const client = await VIAM.createRobotClient({
      host: HOST,
      credentials: CREDS,
      signalingAddress: SIGNALING,
      dialTimeoutMs: 30_000,
      noReconnect: true,
      ...extra,
    });
    const candidateType = client.peerConnection
      ? await activeCandidateType(client.peerConnection)
      : undefined;
    await client.disconnect();
    log(`OK: connected (local candidate type: ${candidateType ?? 'unknown'})`);
  } catch (e: any) {
    log(`FAIL: ${e?.message ?? e}`);
  }
}

async function main() {
  // 1. Baseline
  await dial('baseline (no flags)');

  // 2. ForceRelay
  await dial('ForceRelay', { forceRelay: true });

  // 3. ForceRelay + TurnUri matching a valid TURN server
  await dial('ForceRelay + TurnUri', { forceRelay: true, turnUri: TURN_URI });

  // 4. ForceP2P
  await dial('ForceP2P', { forceP2P: true });

  // 5. TurnUri alone — filters TURN options but ICE still picks host/srflx
  await dial('TurnUri (no ForceRelay)', { turnUri: TURN_URI });

  // 6. ForceRelay + non-matching TurnUri — expect failure
  await dial('ForceRelay + TurnUri=notexist (expect: fail)', {
    forceRelay: true,
    turnUri: 'turn:notexist.example.com:3478',
  });

  // 7. ForceRelay + turns/tcp/443 — TLS relay for UDP-blocked firewalls
  await dial('ForceRelay + turns/tcp/443', {
    forceRelay: true,
    turnUri: TURN_URI,
    turnScheme: 'turns',
    turnTransport: 'tcp',
    turnPort: 443,
  });

  log('\nDone.');
}

main();
