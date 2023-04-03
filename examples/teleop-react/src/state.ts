import { useState, useEffect } from 'react';
import { Robot } from '../../../dist/robot.js';
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

const useCredentials = () => {
  return useState<RobotCredentials | undefined>(undefined);
};

const useClient = () => {};

export const useConnect = (): ((credentials: RobotCredentials) => void) => {
  const [, setCredentials] = useCredentials();

  return setCredentials;
};

export const useStream = (cameraName: string): MediaStream | undefined => {};
