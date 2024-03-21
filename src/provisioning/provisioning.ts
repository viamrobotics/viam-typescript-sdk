import type { CloudConfig, NetworkInfo, SmartMachineStatus } from './types';

export interface Provisioning {
  getSmartMachineStatus: () => Promise<SmartMachineStatus>;
  setNetworkCredentials: (
    type: string,
    ssid: string,
    psk: string
  ) => Promise<void>;
  setSmartMachineCredentials: (cloud?: CloudConfig) => Promise<void>;
  getNetworkList: () => Promise<NetworkInfo[]>;
}
