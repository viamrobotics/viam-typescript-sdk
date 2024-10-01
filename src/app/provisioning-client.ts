import {
  createPromiseClient,
  type PromiseClient,
  type Transport,
} from '@connectrpc/connect';
import { ProvisioningService } from '../gen/provisioning/v1/provisioning_connect';
import type { CloudConfig } from '../gen/provisioning/v1/provisioning_pb';

export class ProvisioningClient {
  private client: PromiseClient<typeof ProvisioningService>;

  constructor(transport: Transport) {
    this.client = createPromiseClient(ProvisioningService, transport);
  }

  /**
   * Get the status of the Smart Machine.
   *
   * @returns The Smart Machine status
   */
  async getSmartMachineStatus() {
    return this.client.getSmartMachineStatus({});
  }

  /**
   * Set the network credentials of the Smart Machine, so it can connect to the
   * internet.
   *
   * @param type - The type of network
   * @param ssid - The SSID of the network
   * @param psk - The network's passkey
   */
  async setNetworkCredentials(type: string, ssid: string, psk: string) {
    await this.client.setNetworkCredentials({
      type,
      ssid,
      psk,
    });
  }

  /**
   * Set the Viam credentials of the smart machine credentials, so it connect to
   * the Cloud.
   *
   * @param cloud - The configuration of the Cloud
   */
  async setSmartMachineCredentials(cloud?: CloudConfig) {
    await this.client.setSmartMachineCredentials({ cloud });
  }

  /**
   * Get the networks that are visible to the Smart Machine.
   *
   * @returns A list of networks
   */
  async getNetworkList() {
    const resp = await this.client.getNetworkList({});
    return resp.networks;
  }
}

export { CloudConfig } from '../gen/provisioning/v1/provisioning_pb';
