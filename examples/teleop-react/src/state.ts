import { useEffect, useRef, useState } from 'react';
import type { RobotClient, StreamClient, BaseClient } from '@viamrobotics/sdk';
import {
  getRobotClient,
  getBaseClient,
  getStreamClient,
  getStream,
  type RobotCredentials,
} from './client.js';

export const DISCONNECTED = 'disconnected';
export const CONNECTING = 'connecting';
export const DISCONNECTING = 'disconnecting';
export const CONNECTED = 'connected';

interface ClientStateDisconnected {
  status: typeof DISCONNECTED;
  error?: unknown;
}

interface ClientStateTransitioning {
  status: typeof CONNECTING | typeof DISCONNECTING;
}

interface ClientStateConnected {
  status: typeof CONNECTED;
  client: RobotClient;
  baseClient: BaseClient;
  streamClient: StreamClient;
}

type ClientState =
  | ClientStateDisconnected
  | ClientStateTransitioning
  | ClientStateConnected;

export type ClientStatus = ClientState['status'];

export interface Store {
  status: ClientStatus;
  client?: RobotClient;
  streamClient?: StreamClient;
  baseClient?: BaseClient;
  connectOrDisconnect: (credentials: RobotCredentials) => unknown;
}

export const useStore = (): Store => {
  const [state, setState] = useState<ClientState>({ status: DISCONNECTED });

  if (state.status === DISCONNECTED && state.error) {
    console.warn('Connection error', state.error);
  }

  const connectOrDisconnect = (credentials: RobotCredentials): void => {
    if (state.status === DISCONNECTED) {
      setState({ status: CONNECTING });

      getRobotClient(credentials)
        .then((client) => {
          const streamClient = getStreamClient(client);
          const baseClient = getBaseClient(client);
          setState({ status: CONNECTED, client, baseClient, streamClient });
        })
        .catch((error: unknown) => setState({ status: DISCONNECTED, error }));
    } else if (state.status === CONNECTED) {
      setState({ status: DISCONNECTING });

      state.client
        .disconnect()
        .then(() => setState({ status: DISCONNECTED }))
        .catch((error: unknown) => setState({ status: DISCONNECTED, error }));
    }
  };

  return {
    connectOrDisconnect,
    status: state.status,
    client: state.status === CONNECTED ? state.client : undefined,
    baseClient: state.status === CONNECTED ? state.baseClient : undefined,
    streamClient: state.status === CONNECTED ? state.streamClient : undefined,
  };
};

export const useStream = (
  streamClient: StreamClient | undefined,
  cameraName: string
): MediaStream | undefined => {
  const okToConnectRef = useRef(true);
  const [stream, setStream] = useState<MediaStream | undefined>();

  useEffect(() => {
    if (streamClient && okToConnectRef.current) {
      okToConnectRef.current = false;

      streamClient
        .getStream(cameraName)
        .then((mediaStream) => setStream(mediaStream))
        .catch((error: unknown) => {
          console.warn(`Unable to connect to camera ${cameraName}`, error);
        });

      return () => {
        okToConnectRef.current = true;

        streamClient.remove(cameraName).catch((error: unknown) => {
          console.warn(`Unable to disconnect to camera ${cameraName}`, error);
        });
      };
    }

    return undefined;
  }, [streamClient, cameraName]);

  return stream;
};
