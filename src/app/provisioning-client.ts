import { type RpcOptions } from '@improbable-eng/grpc-web/dist/typings/client.d';
import pb from '../gen/provisioning/v1/provisioning_pb';
import { ProvisioningServiceClient } from '../gen/provisioning/v1/provisioning_pb_service';
import { promisify } from '../utils';

export type SmartMachineStatus = pb.GetSmartMachineStatusResponse.AsObject;
export type NetworkInfo = pb.NetworkInfo.AsObject;
export type CloudConfig = pb.CloudConfig.AsObject;

export const encodeCloudConfig = (
  obj: pb.CloudConfig.AsObject
): pb.CloudConfig => {
  const result = new pb.CloudConfig();
  result.setId(obj.id);
  result.setSecret(obj.secret);
  result.setAppAddress(obj.appAddress);
  return result;
};

export class ProvisioningClient {
  private service: ProvisioningServiceClient;

  constructor(serviceHost: string, grpcOptions: RpcOptions = {}) {
    this.service = new ProvisioningServiceClient(serviceHost, grpcOptions);
  }

  /**
   * Get the status of the Smart Machine.
   *
   * @returns The Smart Machine status
   */
  async getSmartMachineStatus() {
    const { service } = this;
    const request = new pb.GetSmartMachineStatusRequest();

    const response = await promisify<
      pb.GetSmartMachineStatusRequest,
      pb.GetSmartMachineStatusResponse
    >(service.getSmartMachineStatus.bind(service), request);
    return response.toObject();
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
    const { service } = this;
    const request = new pb.SetNetworkCredentialsRequest();
    request.setType(type);
    request.setSsid(ssid);
    request.setPsk(psk);

    await promisify<
      pb.SetNetworkCredentialsRequest,
      pb.SetNetworkCredentialsResponse
    >(service.setNetworkCredentials.bind(service), request);
  }

  /**
   * Set the Viam credentials of the smart machine credentials, so it connect to
   * the Cloud.
   *
   * @param cloud - The configuration of the Cloud
   */
  async setSmartMachineCredentials(cloud?: CloudConfig) {
    const { service } = this;
    const request = new pb.SetSmartMachineCredentialsRequest();
    if (cloud) {
      request.setCloud(encodeCloudConfig(cloud));
    }

    await promisify<
      pb.SetSmartMachineCredentialsRequest,
      pb.SetSmartMachineCredentialsResponse
    >(service.setSmartMachineCredentials.bind(service), request);
  }

  /**
   * Get the networks that are visible to the Smart Machine.
   *
   * @returns A list of networks
   */
  async getNetworkList() {
    const { service } = this;
    const request = new pb.GetNetworkListRequest();

    const response = await promisify<
      pb.GetNetworkListRequest,
      pb.GetNetworkListResponse
    >(service.getNetworkList.bind(service), request);
    return response.toObject().networksList;
  }
}
