import { action, atom, computed } from 'nanostores';
import type { RobotClient } from '@viamrobotics/sdk';
import { getRobotClient, type RobotCredentials } from './client.js';

export interface ClientStateDisconnected {
  status: 'disconnected' | 'error';
  error?: string;
}

export interface ClientStateTransitioning {
  status: 'connecting' | 'disconnecting';
}

export interface ClientStateConnected {
  status: 'connected';
  client: RobotClient;
}

export type ClientState =
  | ClientStateDisconnected
  | ClientStateTransitioning
  | ClientStateConnected;

const $state = atom<ClientState>({ status: 'disconnected' });

export const useStream = computed($state, (state, camera: string) => {
  return 42;
});

export const connect = action(
  $state,
  'connect',
  (store, credentials: RobotCredentials): void => {
    const status = store.get().status;

    if (status === 'disconnected' || status === 'error') {
      store.set({ status: 'connecting' });

      getRobotClient(credentials)
        .then((client) => {
          store.set({ client, status: 'connected' });
        })
        .catch((error: Error) => {
          store.set({ error: error.message, status: 'error' });
        });
    }
  }
);

export const disconnect = action($state, 'disconnect', (store): void => {
  const state = store.get();

  if (state.status === 'connected') {
    const { client } = state;

    store.set({ status: 'disconnecting' });

    client
      .disconnect()
      .then(() => {
        store.set({ status: 'disconnected' });
      })
      .catch((error: Error) => {
        store.set({ error: error.message, status: 'error' });
      });
  }
});
