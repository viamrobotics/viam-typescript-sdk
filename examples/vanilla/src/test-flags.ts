import * as VIAM from '@viamrobotics/sdk';

const HOST = 'machine-main.ozy75nuoux.viam.cloud';
const API_KEY_ID = '4f04c6ca-b9df-440d-82db-6d383b0c92a1';
const API_KEY = 'ymw99jc6h6ki2m9rlhzekp8r2tpj9zjy';
const SIGNALING = 'https://app.viam.com:443';

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

  // 3. ForceP2P
  await dial('ForceP2P', { forceP2P: true });

  log('\nDone.');
}

main();
