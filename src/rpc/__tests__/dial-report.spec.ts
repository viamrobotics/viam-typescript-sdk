// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { Code, ConnectError, type Client } from '@connectrpc/connect';

import type { SignalingService } from '../../gen/proto/rpc/webrtc/v1/signaling_connect';
import {
  ConnectionSignalingPath,
  DialStage,
  ICECandidateType,
  type ReportConnectionMetadataRequest,
  SDKType,
} from '../../gen/proto/rpc/webrtc/v1/signaling_pb';
import {
  classifyCandidate,
  classifyConnection,
  classifySignalingPath,
  DialStageTracker,
  failureCodeOf,
  reportDialOutcome,
} from '../dial-report';
import { createMockPeerConnection } from '../../__tests__/mocks/webrtc';

const statsReport = (entries: Record<string, unknown>): RTCStatsReport =>
  new Map(Object.entries(entries));

const mockSignalingClient = (reportFn = vi.fn().mockResolvedValue({})) =>
  ({ reportConnectionMetadata: reportFn }) as unknown as Client<typeof SignalingService>;

describe('DialStageTracker', () => {
  it('only advances forward', () => {
    const tracker = new DialStageTracker();
    expect(tracker.reached).toBe(DialStage.UNSPECIFIED);
    tracker.advance(DialStage.CONFIG_FETCHED);
    expect(tracker.reached).toBe(DialStage.CONFIG_FETCHED);
    tracker.advance(DialStage.SIGNALING_CONNECTED);
    expect(tracker.reached).toBe(DialStage.CONFIG_FETCHED);
    tracker.advance(DialStage.READY);
    expect(tracker.reached).toBe(DialStage.READY);
  });
});

describe('classifySignalingPath', () => {
  it.each([
    ['app.viam.com:443', ConnectionSignalingPath.CLOUD_SIGNALED],
    ['app.viam.dev', ConnectionSignalingPath.CLOUD_SIGNALED],
    ['https://app.viam.com:443', ConnectionSignalingPath.CLOUD_SIGNALED],
    ['APP.VIAM.COM:443', ConnectionSignalingPath.CLOUD_SIGNALED],
    ['localhost:8080', ConnectionSignalingPath.LOCAL],
    ['http://127.0.0.1:9000', ConnectionSignalingPath.LOCAL],
    ['10.1.2.3:443', ConnectionSignalingPath.LOCAL],
    ['my-robot.abc123.viam.cloud:443', ConnectionSignalingPath.LOCAL],
  ])('classifies %s', (address, expected) => {
    expect(classifySignalingPath(address)).toBe(expected);
  });
});

describe('failureCodeOf', () => {
  it('extracts the code from a ConnectError', () => {
    expect(failureCodeOf(new ConnectError('robot offline', Code.NotFound))).toBe(Code.NotFound);
  });

  it('maps non-gRPC failures to Unknown', () => {
    expect(failureCodeOf(new Error('timed out'))).toBe(Code.Unknown);
  });
});

describe('classifyCandidate', () => {
  it.each([
    ['host', ICECandidateType.ICE_CANDIDATE_TYPE_HOST, ''],
    ['srflx', ICECandidateType.ICE_CANDIDATE_TYPE_STUN, ''],
    ['prflx', ICECandidateType.ICE_CANDIDATE_TYPE_STUN, ''],
    ['relay', ICECandidateType.ICE_CANDIDATE_TYPE_RELAY, '34.0.0.1'],
  ])('classifies %s candidates', (candidateType, expectedType, expectedAddress) => {
    const stats = statsReport({
      c1: { candidateType, address: '34.0.0.1' },
    });
    const got = classifyCandidate(stats, 'c1');
    expect(got.type).toBe(expectedType);
    expect(got.relayAddress).toBe(expectedAddress);
  });

  it('falls back to ip when a relay candidate has no address', () => {
    const stats = statsReport({
      c1: { candidateType: 'relay', ip: '34.0.0.2' },
    });
    expect(classifyCandidate(stats, 'c1').relayAddress).toBe('34.0.0.2');
  });

  it('classifies a missing candidate as unspecified', () => {
    const stats = statsReport({
      c1: { candidateType: 'host' },
    });
    expect(classifyCandidate(stats, 'nope').type).toBe(
      ICECandidateType.ICE_CANDIDATE_TYPE_UNSPECIFIED,
    );
    expect(classifyCandidate(stats, undefined).type).toBe(
      ICECandidateType.ICE_CANDIDATE_TYPE_UNSPECIFIED,
    );
  });
});

describe('classifyConnection', () => {
  it("uses the transport's selected candidate pair", async () => {
    const stats = statsReport({
      transport: { type: 'transport', selectedCandidatePairId: 'pair-selected' },
      'pair-selected': {
        type: 'candidate-pair',
        localCandidateId: 'local-relay',
        remoteCandidateId: 'remote-host',
      },
      'local-relay': { candidateType: 'relay', address: '34.0.0.1' },
      'remote-host': { candidateType: 'host', address: '192.168.1.2' },
    });
    const pc = createMockPeerConnection(
      vi.fn(),
      vi.fn(),
      vi.fn(),
      'connected',
      vi.fn().mockResolvedValue(stats),
    );

    const { local, remote } = await classifyConnection(pc);
    expect(local.type).toBe(ICECandidateType.ICE_CANDIDATE_TYPE_RELAY);
    expect(local.relayAddress).toBe('34.0.0.1');
    expect(remote.type).toBe(ICECandidateType.ICE_CANDIDATE_TYPE_HOST);
    expect(remote.relayAddress).toBe('');
  });

  it('falls back to a nominated succeeded pair without transport stats', async () => {
    const stats = statsReport({
      'pair-failed': { type: 'candidate-pair', state: 'failed', nominated: false },
      'pair-selected': {
        type: 'candidate-pair',
        state: 'succeeded',
        nominated: true,
        localCandidateId: 'local-host',
        remoteCandidateId: 'remote-host',
      },
      'local-host': { candidateType: 'host' },
      'remote-host': { candidateType: 'host' },
    });
    const pc = createMockPeerConnection(
      vi.fn(),
      vi.fn(),
      vi.fn(),
      'connected',
      vi.fn().mockResolvedValue(stats),
    );

    const { local, remote } = await classifyConnection(pc);
    expect(local.type).toBe(ICECandidateType.ICE_CANDIDATE_TYPE_HOST);
    expect(remote.type).toBe(ICECandidateType.ICE_CANDIDATE_TYPE_HOST);
  });

  it('classifies both sides as unspecified without a selected pair', async () => {
    const pc = createMockPeerConnection();
    const { local, remote } = await classifyConnection(pc);
    expect(local.type).toBe(ICECandidateType.ICE_CANDIDATE_TYPE_UNSPECIFIED);
    expect(remote.type).toBe(ICECandidateType.ICE_CANDIDATE_TYPE_UNSPECIFIED);
  });
});

describe('reportDialOutcome', () => {
  it('reports a successful dial with the selected candidate pair', async () => {
    const reportFn = vi.fn().mockResolvedValue({});
    const stats = statsReport({
      transport: { type: 'transport', selectedCandidatePairId: 'pair' },
      pair: { type: 'candidate-pair', localCandidateId: 'l', remoteCandidateId: 'r' },
      l: { candidateType: 'host' },
      r: { candidateType: 'host' },
    });
    const pc = createMockPeerConnection(
      vi.fn(),
      vi.fn(),
      vi.fn(),
      'connected',
      vi.fn().mockResolvedValue(stats),
    );
    const stage = new DialStageTracker();
    stage.advance(DialStage.READY);

    reportDialOutcome(
      mockSignalingClient(reportFn),
      { headers: { 'rpc-host': 'my-host' } },
      pc,
      stage,
      Date.now() - 25,
      ConnectionSignalingPath.CLOUD_SIGNALED,
    );

    await vi.waitFor(() => {
      expect(reportFn).toHaveBeenCalledOnce();
    });
    const [request, opts] = reportFn.mock.calls[0] as [
      ReportConnectionMetadataRequest,
      { timeoutMs: number },
    ];
    expect(request.reachedStage).toBe(DialStage.READY);
    expect(request.sdkType).toBe(SDKType.SDK_TYPE_TYPESCRIPT);
    expect(request.sdkVersion).toBe(__VERSION__);
    expect(request.signalingPath).toBe(ConnectionSignalingPath.CLOUD_SIGNALED);
    expect(request.failureCode).toBe(0);
    expect(request.durationMs).toBeGreaterThanOrEqual(25);
    expect(request.local?.type).toBe(ICECandidateType.ICE_CANDIDATE_TYPE_HOST);
    expect(request.remote?.type).toBe(ICECandidateType.ICE_CANDIDATE_TYPE_HOST);
    expect(opts.timeoutMs).toBe(5000);
  });

  it('reports a failed dial with the furthest stage and failure code', async () => {
    const reportFn = vi.fn().mockResolvedValue({});
    const stage = new DialStageTracker();
    stage.advance(DialStage.OFFER_SENT);

    reportDialOutcome(
      mockSignalingClient(reportFn),
      {},
      undefined,
      stage,
      Date.now(),
      ConnectionSignalingPath.LOCAL,
      new ConnectError('robot offline', Code.NotFound),
    );

    await vi.waitFor(() => {
      expect(reportFn).toHaveBeenCalledOnce();
    });
    const [request] = reportFn.mock.calls[0] as [ReportConnectionMetadataRequest];
    expect(request.reachedStage).toBe(DialStage.OFFER_SENT);
    expect(request.failureCode).toBe(Code.NotFound);
    expect(request.signalingPath).toBe(ConnectionSignalingPath.LOCAL);
    expect(request.local?.type).toBe(ICECandidateType.ICE_CANDIDATE_TYPE_UNSPECIFIED);
    expect(request.remote?.type).toBe(ICECandidateType.ICE_CANDIDATE_TYPE_UNSPECIFIED);
  });

  it('never reports an unimplemented failure (no WebRTC signaler)', async () => {
    const reportFn = vi.fn().mockResolvedValue({});

    reportDialOutcome(
      mockSignalingClient(reportFn),
      {},
      undefined,
      new DialStageTracker(),
      Date.now(),
      ConnectionSignalingPath.LOCAL,
      new ConnectError('not implemented', Code.Unimplemented),
    );

    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
    expect(reportFn).not.toHaveBeenCalled();
  });

  it('swallows report failures', async () => {
    const reportFn = vi.fn().mockRejectedValue(new Error('send failed'));
    const stage = new DialStageTracker();
    stage.advance(DialStage.READY);

    expect(() => {
      reportDialOutcome(
        mockSignalingClient(reportFn),
        {},
        undefined,
        stage,
        Date.now(),
        ConnectionSignalingPath.LOCAL,
      );
    }).not.toThrow();

    await vi.waitFor(() => {
      expect(reportFn).toHaveBeenCalledOnce();
    });
  });
});
