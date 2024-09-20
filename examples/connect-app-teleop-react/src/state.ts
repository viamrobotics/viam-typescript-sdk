import type {
  AccessToken,
  AppClient,
  BaseClient,
  Credential,
  RobotClient,
  StreamClient,
  appApi,
} from '@viamrobotics/sdk';
import { useEffect, useRef, useState } from 'react';
import {
  getBaseClient,
  getRobotClient,
  getStreamClient,
  getViamClient,
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

export interface RobotClientStore {
  status: ClientStatus;
  client?: RobotClient;
  streamClient?: StreamClient;
  baseClient?: BaseClient;
  connectOrDisconnect: (
    hostname: string,
    credentials: Credential | AccessToken
  ) => unknown;
}

export const useRobotClientStore = (): RobotClientStore => {
  const [state, setState] = useState<ClientState>({ status: DISCONNECTED });

  if (state.status === DISCONNECTED && state.error) {
    console.warn('Connection error', state.error);
  }

  const connectOrDisconnect = (
    hostname: string,
    credentials: Credential | AccessToken
  ): void => {
    if (state.status === DISCONNECTED) {
      setState({ status: CONNECTING });

      getRobotClient(hostname, credentials)
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

export enum BrowserStateKey {
  Loading,
  Organizations,
  Locations,
  Machines,
  MachineParts,
  ControlMachinePart,
}

interface BrowserStateLoading {
  key: BrowserStateKey.Loading;
}

interface BrowserStateOrganizations {
  key: BrowserStateKey.Organizations;
  appClient: AppClient;
}

interface BrowserStateLocations {
  key: BrowserStateKey.Locations;
  appClient: AppClient;
  organization: appApi.Organization.AsObject;
}

interface BrowserStateMachines {
  key: BrowserStateKey.Machines;
  appClient: AppClient;
  organization: appApi.Organization.AsObject;
  location: appApi.Location.AsObject;
}

interface BrowserStateMachineParts {
  key: BrowserStateKey.MachineParts;
  appClient: AppClient;
  location: appApi.Location.AsObject;
  organization: appApi.Organization.AsObject;
  machine: appApi.Robot.AsObject;
}

interface BrowserStateControlMachinePart {
  key: BrowserStateKey.ControlMachinePart;
  appClient: AppClient;
  organization: appApi.Organization.AsObject;
  location: appApi.Location.AsObject;
  machine: appApi.Robot.AsObject;
  machinePart: appApi.RobotPart.AsObject;
}

export type BrowserState =
  | BrowserStateLoading
  | BrowserStateOrganizations
  | BrowserStateLocations
  | BrowserStateMachines
  | BrowserStateMachineParts
  | BrowserStateControlMachinePart;

export interface Breadcrumb {
  name: string;
  onClick?: () => void;
}

export class BrowserStateStore {
  constructor(
    public readonly state: BrowserState,
    private readonly onNewState: (newState: BrowserState) => void
  ) {}

  public breadcrumbs(): Breadcrumb[] {
    const currentState = this.state;
    switch (currentState.key) {
      case BrowserStateKey.Loading: {
        return [];
      }
      case BrowserStateKey.Organizations: {
        return [{ name: 'Organizations' }];
      }
      case BrowserStateKey.Locations: {
        return [
          {
            name: 'Organizations',
            onClick: this.onBrowseOrganizations(currentState),
          },
          { name: currentState.organization.name },
          { name: 'Locations' },
        ];
      }
      case BrowserStateKey.Machines: {
        return [
          {
            name: 'Organizations',
            onClick: this.onBrowseOrganizations(currentState),
          },
          {
            name: currentState.organization.name,
            onClick: () =>
              this.onOrganizationSelected(currentState)(
                currentState.organization
              ),
          },
          { name: currentState.location.name },
          { name: 'Machines' },
        ];
      }
      case BrowserStateKey.MachineParts: {
        return [
          {
            name: 'Organizations',
            onClick: this.onBrowseOrganizations(currentState),
          },
          {
            name: currentState.organization.name,
            onClick: () =>
              this.onOrganizationSelected(currentState)(
                currentState.organization
              ),
          },
          {
            name: currentState.location.name,
            onClick: () =>
              this.onLocationSelected(currentState)(currentState.location),
          },
          { name: currentState.machine.name },
        ];
      }
      case BrowserStateKey.ControlMachinePart: {
        return [
          {
            name: 'Organizations',
            onClick: this.onBrowseOrganizations(currentState),
          },
          {
            name: currentState.organization.name,
            onClick: () =>
              this.onOrganizationSelected(currentState)(
                currentState.organization
              ),
          },
          {
            name: currentState.location.name,
            onClick: () =>
              this.onLocationSelected(currentState)(currentState.location),
          },
          {
            name: currentState.machine.name,
            onClick: () =>
              this.onMachineSelected(currentState)(currentState.machine),
          },
          { name: currentState.machinePart.name },
        ];
      }
    }
  }

  private validateState(currentState: BrowserState) {
    if (this.state !== currentState) {
      throw new Error('wrong state');
    }
  }

  public onBrowseOrganizations(
    currentState:
      | BrowserStateLocations
      | BrowserStateMachines
      | BrowserStateMachineParts
      | BrowserStateControlMachinePart
  ): () => void {
    this.validateState(currentState);
    return () => {
      this.onNewState({
        key: BrowserStateKey.Organizations,
        appClient: currentState.appClient,
      });
    };
  }

  public onOrganizationSelected(
    currentState:
      | BrowserStateOrganizations
      | BrowserStateLocations
      | BrowserStateMachines
      | BrowserStateMachineParts
      | BrowserStateControlMachinePart
  ): (organization: appApi.Organization.AsObject) => void {
    this.validateState(currentState);
    return (organization: appApi.Organization.AsObject) => {
      this.onNewState({
        key: BrowserStateKey.Locations,
        appClient: currentState.appClient,
        organization: organization,
      });
    };
  }

  public onLocationSelected(
    currentState:
      | BrowserStateLocations
      | BrowserStateMachines
      | BrowserStateMachineParts
      | BrowserStateControlMachinePart
  ): (location: appApi.Location.AsObject) => void {
    this.validateState(currentState);
    return (location: appApi.Location.AsObject) => {
      this.onNewState({
        key: BrowserStateKey.Machines,
        appClient: currentState.appClient,
        organization: currentState.organization,
        location,
      });
    };
  }

  public onMachineSelected(
    currentState:
      | BrowserStateMachines
      | BrowserStateMachineParts
      | BrowserStateControlMachinePart
  ): (machine: appApi.Robot.AsObject) => void {
    this.validateState(currentState);
    return (machine: appApi.Robot.AsObject) => {
      this.onNewState({
        key: BrowserStateKey.MachineParts,
        appClient: currentState.appClient,
        organization: currentState.organization,
        location: currentState.location,
        machine,
      });
    };
  }

  public onMachinePartSelected(
    currentState: BrowserStateMachineParts | BrowserStateControlMachinePart
  ): (part: appApi.RobotPart.AsObject) => void {
    this.validateState(currentState);
    return (part: appApi.RobotPart.AsObject) => {
      this.onNewState({
        key: BrowserStateKey.ControlMachinePart,
        appClient: currentState.appClient,
        location: currentState.location,
        organization: currentState.organization,
        machine: currentState.machine,
        machinePart: part,
      });
    };
  }
}

export const useBrowserStateStore = (
  creds: Credential | AccessToken | undefined
): BrowserStateStore => {
  const [browserState, setBrowserState] = useState<BrowserState>({
    key: BrowserStateKey.Loading,
  });

  useEffect(() => {
    const connectViamClient = async () => {
      if (!creds) {
        return;
      }
      const client = await getViamClient(creds);
      if (!client.appClient) {
        throw new Error('expected appClient');
      }
      setBrowserState({
        key: BrowserStateKey.Organizations,
        appClient: client.appClient,
      });
    };

    connectViamClient().catch(console.error);
  }, [creds]);

  return new BrowserStateStore(browserState, (newState: BrowserState) => {
    setBrowserState(newState);
  });
};
