import * as VIAM from '@viamrobotics/sdk';

const HOST = '<machine-fqdn>';
const API_KEY_ID = '<api-key-id>';
const API_KEY = '<api-key>';
const SIGNALING = 'https://app.viam.com:443';
// RELAY_HOST should be a substring matching at least one TURN server URL returned
// by the signaling server (e.g. 'turn.viam.com' for prod coturn).
const RELAY_HOST = '<relay-host-substring>';

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

  // 3. ForceRelay + RelayHostFilter matching a valid TURN server
  await dial('ForceRelay + RelayHostFilter', { forceRelay: true, relayHostFilter: RELAY_HOST });

  // 4. ForceP2P
  await dial('ForceP2P', { forceP2P: true });

  // 5. RelayHostFilter alone — filter limits TURN options but ICE still picks host/srflx
  await dial('RelayHostFilter (no ForceRelay)', { relayHostFilter: RELAY_HOST });

  // 6. ForceRelay + non-matching RelayHostFilter — expect failure
  await dial('ForceRelay + RelayHostFilter=notexist (expect: fail)', {
    forceRelay: true,
    relayHostFilter: 'notexist.example.com',
  });

  log('\nDone.');
}

main();
