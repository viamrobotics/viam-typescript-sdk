import type { CloudConfig, NetworkInfo, SmartMachineStatus } from './types';

export interface Provisioning {
  /** Get the status of the Smart Machine */
  getSmartMachineStatus: () => Promise<SmartMachineStatus>;

  /**
   * Set the network credentials of the Smart Machine, so it can connect to the
   * internet.
   *
   * @param type - The type of network.
   * @param ssid - The SSID of the network.
   * @param psk - The network's passkey.
   */
  setNetworkCredentials: (
    type: string,
    ssid: string,
    psk: string
  ) => Promise<void>;

  /**
   * Set the Viam credentials of the smart machine credentials, so it connect to
   * the Cloud.
   *
   * @param cloud - The configuration of the Cloud.
   */
  setSmartMachineCredentials: (cloud?: CloudConfig) => Promise<void>;

  /** Get the networks that are visible to the Smart Machine. */
  getNetworkList: () => Promise<NetworkInfo[]>;
}
