import type { CallOptions, Client } from '@connectrpc/connect';
import { Code, ConnectError } from '@connectrpc/connect';
import { Status } from '../gen/google/rpc/status_pb';
import { SignalingService } from '../gen/proto/rpc/webrtc/v1/signaling_connect';
import {
  CallRequest,
  CallResponse,
  CallResponseInitStage,
  CallResponseUpdateStage,
  CallUpdateRequest,
  ICECandidate,
} from '../gen/proto/rpc/webrtc/v1/signaling_pb';
import { ClientChannel } from './client-channel';
import { ConnectionClosedError } from './connection-closed-error';
import type { DialWebRTCOptions } from './dial';
import { addSdpFields } from './peer';
import { atob, btoa } from './polyfills';

const callUUIDUnset = 'invariant: call uuid unset';

export class SignalingExchange {
  private readonly clientChannel: ClientChannel;
  private callUuid?: string;
  // only send once since exchange may end or ICE may end
  private sentDoneOrErrorOnce = false;
  private exchangeDone = false;
  private iceComplete = false;
  private haveInitResponse = false;
  private awaitingRemoteDescription?: {
    success: (value: unknown) => void;
    failure: (reason?: unknown) => void;
  };

  private remoteDescriptionSet?: Promise<unknown>;

  // stats
  private numCallUpdates = 0;
  private maxCallUpdateDuration = 0;
  private totalCallUpdateDuration = 0;

  constructor(
    private readonly signalingClient: Client<typeof SignalingService>,
    private readonly callOpts: CallOptions,
    private readonly pc: RTCPeerConnection,
    private readonly dc: RTCDataChannel,
    private readonly dialOpts?: DialWebRTCOptions
  ) {
    this.clientChannel = new ClientChannel(this.pc, this.dc);
  }

  public async doExchange(): Promise<ClientChannel> {
    // Setup our handlers before starting the signaling call.
    await this.setup();

    const description = addSdpFields(
      this.pc.localDescription,
      this.dialOpts?.additionalSdpFields
    );
    const encodedSDP = btoa(JSON.stringify(description));
    const callRequest = new CallRequest({
      sdp: encodedSDP,
    });
    if (this.dialOpts && this.dialOpts.disableTrickleICE) {
      callRequest.disableTrickle = this.dialOpts.disableTrickleICE;
    }

    /**
     * As long as we establish a connection (i.e. we are ready), then we will
     * make it clear across the exchange that we are done and no more work
     * should be done nor should any errors be emitted.
     */
    this.clientChannel.ready
      .then(async () => {
        this.exchangeDone = true;
        await this.sendDone();
      })
      .catch(console.error); // eslint-disable-line no-console

    // Initiate now the call now that all of our handlers are setup.
    const callResponses = this.signalingClient.call(callRequest, this.callOpts);

    // Start processing the responses asynchronously.
    const responsesProcessed = this.processCallResponses(callResponses);

    await Promise.all([this.clientChannel.ready, responsesProcessed]);
    return this.clientChannel;
  }

  private async setup() {
    this.remoteDescriptionSet = new Promise<unknown>((resolve, reject) => {
      this.awaitingRemoteDescription = {
        success: resolve,
        failure: reject,
      };
    });
    if (!this.dialOpts?.disableTrickleICE) {
      // set up offer
      const offerDesc = await this.pc.createOffer({});

      this.pc.addEventListener('iceconnectionstatechange', () => {
        if (
          this.pc.iceConnectionState !== 'completed' ||
          this.numCallUpdates === 0
        ) {
          return;
        }
        const averageCallUpdateDuration =
          this.totalCallUpdateDuration / this.numCallUpdates;
        console.groupCollapsed('Caller update statistics'); // eslint-disable-line no-console
        // eslint-disable-next-line no-console
        console.table({
          num_updates: this.numCallUpdates,
          average_duration: `${averageCallUpdateDuration}ms`,
          max_duration: `${this.maxCallUpdateDuration}ms`,
        });
        console.groupEnd(); // eslint-disable-line no-console
      });
      this.pc.addEventListener(
        'icecandidate',
        (event: { candidate: RTCIceCandidateInit | null }) => {
          this.onLocalICECandidate(event).catch((error) => {
            console.error(`error processing local ICE candidate ${error}`); // eslint-disable-line no-console
          });
        }
      );

      await this.pc.setLocalDescription(offerDesc);
    }
  }

  public terminate(err: Error) {
    this.clientChannel.closeWithReason(err);
  }

  private async processCallResponses(
    callResponses: AsyncIterable<CallResponse>
  ) {
    try {
      for await (const response of callResponses) {
        switch (response.stage.case) {
          case 'init': {
            if (
              !(await this.handleInitResponse(
                response.uuid,
                response.stage.value
              ))
            ) {
              return;
            }
            break;
          }
          case 'update': {
            if (
              !(await this.handleUpdateResponse(
                response.uuid,
                response.stage.value
              ))
            ) {
              return;
            }
            break;
          }
          default: {
            await this.sendError('unknown CallResponse stage');
            return;
          }
        }
      }
    } catch (error) {
      this.handleInitError(error);
    }
  }

  private handleInitError(error: unknown) {
    if (this.exchangeDone || this.pc.iceConnectionState === 'connected') {
      // There's nothing to do with these errors, our connection is established.
      return;
    }
    if (error instanceof ConnectError && error.code === Code.Unimplemented) {
      if (error.message === 'Response closed without headers') {
        throw new ConnectionClosedError('failed to dial');
      }
      if (this.clientChannel.isClosed()) {
        throw new ConnectionClosedError('client channel is closed');
      }
      console.error(error.message); // eslint-disable-line no-console
    }
    throw error;
  }

  private async handleInitResponse(
    uuid: string,
    response: CallResponseInitStage
  ): Promise<boolean> {
    if (this.haveInitResponse) {
      await this.sendError('got init stage more than once');
      return false;
    }
    this.haveInitResponse = true;

    this.callUuid = uuid;

    const remoteSDP = new RTCSessionDescription(
      JSON.parse(atob(response.sdp)) as RTCSessionDescriptionInit
    );
    if (this.clientChannel.isClosed()) {
      await this.sendError('client channel is closed');
      return false;
    }
    await this.pc.setRemoteDescription(remoteSDP);
    this.awaitingRemoteDescription?.success(true);

    if (this.dialOpts?.disableTrickleICE) {
      this.exchangeDone = true;
      await this.sendDone();
      return false;
    }

    return true;
  }

  private async handleUpdateResponse(
    uuid: string,
    response: CallResponseUpdateStage
  ): Promise<boolean> {
    if (!this.haveInitResponse) {
      await this.sendError('got update stage before init stage');
      return false;
    }

    if (uuid !== this.callUuid) {
      await this.sendError(`uuid mismatch; have=${uuid} want=${this.callUuid}`);
      return false;
    }
    if (response.candidate === undefined) {
      await this.sendError(`no candidate`);
      return false;
    }
    const cand = iceCandidateFromProto(response.candidate);
    if (cand.candidate !== undefined) {
      console.debug(`received remote ICE ${cand.candidate}`); // eslint-disable-line no-console
    }
    try {
      await this.pc.addIceCandidate(cand);
    } catch (error) {
      console.log('error adding ice candidate', error); // eslint-disable-line no-console
      await this.sendError(JSON.stringify(error));
      throw error;
    }

    return true;
  }

  private async onLocalICECandidate(event: {
    candidate: RTCIceCandidateInit | null;
  }) {
    await this.remoteDescriptionSet;

    if (this.exchangeDone || this.pc.iceConnectionState === 'connected') {
      if (event.candidate !== null) {
        // eslint-disable-next-line no-console
        console.info('Dropping ICE candidate - exchange done or already connected', { 
          exchangeDone: this.exchangeDone,
          iceConnectionState: this.pc.iceConnectionState,
          candidate: event.candidate.candidate
        });
      }
      return;
    }

    if (event.candidate === null) {
      // eslint-disable-next-line no-console
      console.info('ICE gathering complete');
      this.iceComplete = true;
      await this.sendDone();
      return;
    }

    if (this.callUuid === undefined || this.callUuid === '') {
      // eslint-disable-next-line no-console
      console.error(callUUIDUnset);
      throw new Error(callUUIDUnset);
    }

    if (event.candidate.candidate !== undefined) {
      // eslint-disable-next-line no-console
      console.info(`gathered local ICE ${event.candidate.candidate}`);
    }

    const iProto = iceCandidateToProto(event.candidate);
    const callRequestUpdate = new CallUpdateRequest({
      uuid: this.callUuid,
      update: {
        case: 'candidate',
        value: iProto,
      },
    });
    
    const callUpdateStart = new Date();
    try {
      await this.signalingClient.callUpdate(callRequestUpdate, this.callOpts);
      this.numCallUpdates += 1;
      const callUpdateEnd = new Date();
      const callUpdateDuration =
        callUpdateEnd.getTime() - callUpdateStart.getTime();
      if (callUpdateDuration > this.maxCallUpdateDuration) {
        this.maxCallUpdateDuration = callUpdateDuration;
      }
      this.totalCallUpdateDuration += callUpdateDuration;
    } catch (error) {
      if (
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        this.exchangeDone ||
        this.iceComplete ||
        // @ts-expect-error tsc is unaware that iceConnectionState can change
        this.pc.iceConnectionState === 'connected'
      ) {
        return;
      }
      console.error(error); // eslint-disable-line no-console
    }
  }

  private async sendError(err: string) {
    if (this.sentDoneOrErrorOnce) {
      return;
    }
    if (this.callUuid === undefined || this.callUuid === '') {
      throw new Error(callUUIDUnset);
    }
    this.sentDoneOrErrorOnce = true;
    const callRequestUpdate = new CallUpdateRequest({
      uuid: this.callUuid,
      update: {
        case: 'error',
        value: new Status({
          code: Code.Unknown,
          message: err,
        }),
      },
    });
    try {
      await this.signalingClient.callUpdate(callRequestUpdate, this.callOpts);
    } catch (error) {
      /**
       * Even though this call update fails, there's a chance another attempt
       * with another ICE candidate(s) will make the connection work. In the
       * future it may be better to figure out if this error is fatal or not.
       */
      console.error('failed to send call update; continuing', error); // eslint-disable-line no-console
    }
  }

  private async sendDone() {
    if (this.sentDoneOrErrorOnce) {
      return;
    }
    if (this.callUuid === undefined || this.callUuid === '') {
      throw new Error(callUUIDUnset);
    }
    this.sentDoneOrErrorOnce = true;
    const callRequestUpdate = new CallUpdateRequest({
      uuid: this.callUuid,
      update: {
        case: 'done',
        value: true,
      },
    });
    try {
      await this.signalingClient.callUpdate(callRequestUpdate, this.callOpts);
    } catch (error) {
      /**
       * Even though this call update fails, there's a chance another attempt
       * with another ICE candidate(s) will make the connection work. In the
       * future it may be better to figure out if this error is fatal or not.
       */
      console.error(error); // eslint-disable-line no-console
    }
  }
}

const iceCandidateFromProto = (i: ICECandidate) => {
  const candidate: RTCIceCandidateInit = {
    candidate: i.candidate,
  };
  if (i.sdpMid !== undefined) {
    candidate.sdpMid = i.sdpMid;
  }
  if (i.sdpmLineIndex !== undefined) {
    candidate.sdpMLineIndex = i.sdpmLineIndex;
  }
  if (i.usernameFragment !== undefined) {
    candidate.usernameFragment = i.usernameFragment;
  }
  return candidate;
};

const iceCandidateToProto = (i: RTCIceCandidateInit) => {
  const candidate = new ICECandidate();
  if (i.candidate !== undefined) {
    candidate.candidate = i.candidate;
  }
  if (i.sdpMid !== undefined && i.sdpMid !== null) {
    candidate.sdpMid = i.sdpMid;
  }
  if (i.sdpMLineIndex !== undefined && i.sdpMLineIndex !== null) {
    candidate.sdpmLineIndex = i.sdpMLineIndex;
  }
  if (i.usernameFragment !== undefined && i.usernameFragment !== null) {
    candidate.usernameFragment = i.usernameFragment;
  }
  return candidate;
};
