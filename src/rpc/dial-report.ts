/**
 * Best-effort reporting of WebRTC dial outcomes to the signaling server, mirroring the Go SDK's
 * connection-metadata telemetry (goutils rpc/wrtc_client_report.go). After a WebRTC dial finishes —
 * success or failure — the dialing client reports how far the dial got, how it was signaled, how
 * long it took, and (on success) which ICE candidate pair was selected.
 */

import { Code, ConnectError, type CallOptions, type Client } from '@connectrpc/connect';
import type { SignalingService } from '../gen/proto/rpc/webrtc/v1/signaling_connect';
import {
  ConnectionSignalingPath,
  DialStage,
  ICECandidateType,
  ReportConnectionMetadataRequest,
  SDKType,
} from '../gen/proto/rpc/webrtc/v1/signaling_pb';

/** How long a best-effort report send may take before being abandoned. */
const REPORT_TIMEOUT_MS = 5000;

/**
 * Tracks the furthest checkpoint a WebRTC dial reached, so a failed dial can report where it
 * stopped. Advance only ever moves it forward.
 */
export class DialStageTracker {
  private stage = DialStage.UNSPECIFIED;

  public advance(stage: DialStage): void {
    if (stage > this.stage) {
      this.stage = stage;
    }
  }

  public get reached(): DialStage {
    return this.stage;
  }
}

/** The Viam app signaling server hosts. */
const VIAM_CLOUD_SIGNALING_HOSTS = ['app.viam.com', 'app.viam.dev'];

/**
 * Derives how a connection was signaled from the signaling server address: a Viam app signaling
 * host is CLOUD_SIGNALED; everything else (localhost, private/LAN addresses, a machine's own
 * signaling server, etc.) is LOCAL. This SDK has no mDNS discovery, so MDNS_LOCAL is never
 * reported.
 */
export const classifySignalingPath = (signalingAddress: string): ConnectionSignalingPath => {
  let host = signalingAddress;
  const schemeIndex = host.indexOf('://');
  if (schemeIndex >= 0) {
    host = host.slice(schemeIndex + 3);
  }
  [host = ''] = host.split('/');
  host = host.replace(/:\d+$/u, '').toLowerCase();
  return VIAM_CLOUD_SIGNALING_HOSTS.includes(host)
    ? ConnectionSignalingPath.CLOUD_SIGNALED
    : ConnectionSignalingPath.LOCAL;
};

export interface CandidateClassification {
  type: ICECandidateType;
  relayAddress: string;
}

const UNSPECIFIED_CANDIDATE: CandidateClassification = {
  type: ICECandidateType.ICE_CANDIDATE_TYPE_UNSPECIFIED,
  relayAddress: '',
};

/**
 * Maps a single ICE candidate stat to a candidate classification; a missing or unrecognized
 * candidate yields type UNSPECIFIED. Relay candidates carry the relay server address so the
 * signaling server can classify the relay provider.
 */
export const classifyCandidate = (
  stats: RTCStatsReport,
  candidateId: string | undefined,
): CandidateClassification => {
  if (candidateId === undefined || candidateId === '') {
    return UNSPECIFIED_CANDIDATE;
  }
  const candidate = stats.get(candidateId) as
    | { candidateType?: string; address?: string | null; ip?: string | null }
    | undefined;
  switch (candidate?.candidateType) {
    case 'host': {
      return { type: ICECandidateType.ICE_CANDIDATE_TYPE_HOST, relayAddress: '' };
    }
    case 'srflx':
    case 'prflx': {
      return { type: ICECandidateType.ICE_CANDIDATE_TYPE_STUN, relayAddress: '' };
    }
    case 'relay': {
      return {
        type: ICECandidateType.ICE_CANDIDATE_TYPE_RELAY,
        relayAddress: candidate.address ?? candidate.ip ?? '',
      };
    }
    default: {
      return UNSPECIFIED_CANDIDATE;
    }
  }
};

/**
 * Inspects the selected ICE candidate pair and classifies each side: local is this SDK's candidate,
 * remote is the peer's. It prefers the transport's authoritative selectedCandidatePairId, falling
 * back to a nominated+succeeded scan where transport stats are unavailable. Both sides are
 * UNSPECIFIED when no selected pair exists (a failed dial).
 */
export const classifyConnection = async (
  pc: RTCPeerConnection,
): Promise<{
  local: CandidateClassification;
  remote: CandidateClassification;
}> => {
  const stats = await pc.getStats();

  let selectedPairId = '';
  stats.forEach((stat: RTCStats) => {
    if (stat.type === 'transport') {
      const transport = stat as RTCTransportStats;
      if (
        transport.selectedCandidatePairId !== undefined &&
        transport.selectedCandidatePairId !== ''
      ) {
        selectedPairId = transport.selectedCandidatePairId;
      }
    }
  });

  let pair =
    selectedPairId === ''
      ? undefined
      : (stats.get(selectedPairId) as RTCIceCandidatePairStats | undefined);
  if (!pair) {
    stats.forEach((stat: RTCStats) => {
      if (stat.type === 'candidate-pair') {
        const candidatePair = stat as RTCIceCandidatePairStats;
        if (candidatePair.nominated === true && candidatePair.state === 'succeeded') {
          pair ??= candidatePair;
        }
      }
    });
  }

  return {
    local: classifyCandidate(stats, pair?.localCandidateId),
    remote: classifyCandidate(stats, pair?.remoteCandidateId),
  };
};

/**
 * Extracts the gRPC status code of a failed dial; non-gRPC failures map to Unknown, matching the Go
 * SDK's status.Code behavior.
 */
export const failureCodeOf = (failure: unknown): Code => ConnectError.from(failure).code;

/**
 * Reports the outcome of one WebRTC dial to the signaling server it dialed through, best-effort and
 * fire-and-forget: errors are logged, never surfaced, and the dial's caller is never delayed. An
 * Unimplemented failure means the remote has no WebRTC signaler — a fallback control flow, not a
 * WebRTC failure — so it is never reported. There is exactly one report per dial: this SDK dials a
 * single signaling path (no mDNS/cloud racing like the Go SDK), so per-attempt collection is
 * unnecessary.
 */
export const reportDialOutcome = (
  signalingClient: Client<typeof SignalingService>,
  callOpts: CallOptions,
  pc: RTCPeerConnection | undefined,
  stage: DialStageTracker,
  dialStartMs: number,
  signalingPath: ConnectionSignalingPath,
  failure?: unknown,
): void => {
  let failureCode = 0;
  if (failure !== undefined) {
    const code = failureCodeOf(failure);
    if (code === Code.Unimplemented) {
      return;
    }
    failureCode = code;
  }
  const durationMs = Math.max(Math.round(Date.now() - dialStartMs), 0);

  const classified = pc
    ? classifyConnection(pc)
    : Promise.resolve({
        local: UNSPECIFIED_CANDIDATE,
        remote: UNSPECIFIED_CANDIDATE,
      });
  classified
    .then(async ({ local, remote }) =>
      signalingClient.reportConnectionMetadata(
        new ReportConnectionMetadataRequest({
          local,
          remote,
          sdkType: SDKType.SDK_TYPE_TYPESCRIPT,
          reachedStage: stage.reached,
          durationMs,
          signalingPath,
          failureCode,
          sdkVersion: __VERSION__,
        }),
        { ...callOpts, timeoutMs: REPORT_TIMEOUT_MS },
      ),
    )
    .catch((error: unknown) => {
      console.debug('failed to report connection metadata', error); // eslint-disable-line no-console
    });
};
