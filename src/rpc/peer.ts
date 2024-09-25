import { atob, btoa } from './polyfills';

interface ReadyPeer {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
}

export const addSdpFields = (
  localDescription?: RTCSessionDescription | null,
  sdpFields?: Record<string, string | number>
) => {
  const description = {
    sdp: localDescription?.sdp,
    type: localDescription?.type,
  };
  if (sdpFields) {
    for (const key of Object.keys(sdpFields)) {
      description.sdp = [
        description.sdp,
        `a=${key}:${sdpFields[key]}\r\n`,
      ].join('');
    }
  }
  return description;
};

export const newPeerConnectionForClient = async (
  disableTrickle: boolean,
  rtcConfig?: RTCConfiguration,
  additionalSdpFields?: Record<string, string | number>
): Promise<ReadyPeer> => {
  const usableRTCConfig = rtcConfig ?? {
    iceServers: [
      {
        urls: 'stun:global.stun.twilio.com:3478',
      },
    ],
  };
  const peerConnection = new RTCPeerConnection(usableRTCConfig);

  let pResolve: (value: ReadyPeer) => void;
  const result = new Promise<ReadyPeer>((resolve) => {
    pResolve = resolve;
  });
  const dataChannel = peerConnection.createDataChannel('data', {
    id: 0,
    negotiated: true,
    ordered: true,
  });
  dataChannel.binaryType = 'arraybuffer';

  const negotiationChannel = peerConnection.createDataChannel('negotiation', {
    id: 1,
    negotiated: true,
    ordered: true,
  });
  negotiationChannel.binaryType = 'arraybuffer';

  let negOpen = false;
  negotiationChannel.addEventListener('open', () => {
    negOpen = true;
  });
  negotiationChannel.addEventListener(
    'message',
    async (event: MessageEvent) => {
      try {
        const description = new RTCSessionDescription(
          JSON.parse(atob(event.data)) as RTCSessionDescriptionInit
        );

        // we are always polite and will never ignore an offer

        await peerConnection.setRemoteDescription(description);

        if (description.type === 'offer') {
          await peerConnection.setLocalDescription();
          const newDescription = addSdpFields(
            peerConnection.localDescription,
            additionalSdpFields
          );
          negotiationChannel.send(btoa(JSON.stringify(newDescription)));
        }
      } catch (error) {
        console.error(error);
      }
    }
  );

  peerConnection.addEventListener('negotiationneeded', async () => {
    if (!negOpen) {
      return;
    }
    try {
      await peerConnection.setLocalDescription();
      const newDescription = addSdpFields(
        peerConnection.localDescription,
        additionalSdpFields
      );
      negotiationChannel.send(btoa(JSON.stringify(newDescription)));
    } catch (error) {
      console.error(error);
    }
  });

  if (!disableTrickle) {
    return { pc: peerConnection, dc: dataChannel };
  }
  // set up offer
  const offerDesc = await peerConnection.createOffer({});
  await peerConnection.setLocalDescription(offerDesc);

  peerConnection.addEventListener('icecandidate', (event) => {
    if (event.candidate !== null) {
      return;
    }
    pResolve({ pc: peerConnection, dc: dataChannel });
  });

  return result;
};
