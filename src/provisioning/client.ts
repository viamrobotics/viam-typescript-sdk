import { type Options } from '../types';
import pb from '../gen/provisioning/v1/provisioning_pb';
import { ProvisioningServiceClient } from '../gen/provisioning/v1/provisioning_pb_service';
import { RobotClient } from '../robot';
import type { Provisioning } from './provisioning';
import { promisify } from '../utils';
import { type CloudConfig, encodeCloudConfig } from './types';

export class ProvisioningClient implements Provisioning {
  private client: ProvisioningServiceClient;
  private readonly options: Options;

  constructor(client: RobotClient, options: Options = {}) {
    this.client = client.createServiceClient(ProvisioningServiceClient);
    this.options = options;
  }

  private get service() {
    return this.client;
  }

  async getSmartMachineStatus() {
    const { service } = this;
    const request = new pb.GetSmartMachineStatusRequest();
    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetSmartMachineStatusRequest,
      pb.GetSmartMachineStatusResponse
    >(service.getSmartMachineStatus.bind(service), request);
    return response.toObject();
  }

  async setNetworkCredentials(type: string, ssid: string, psk: string) {
    const { service } = this;
    const request = new pb.SetNetworkCredentialsRequest();
    request.setType(type);
    request.setSsid(ssid);
    request.setPsk(psk);

    this.options.requestLogger?.(request);

    await promisify<
      pb.SetNetworkCredentialsRequest,
      pb.SetNetworkCredentialsResponse
    >(service.setNetworkCredentials.bind(service), request);
  }

  async setSmartMachineCredentials(cloud?: CloudConfig) {
    const { service } = this;
    const request = new pb.SetSmartMachineCredentialsRequest();
    if (cloud) {
      request.setCloud(encodeCloudConfig(cloud));
    }

    this.options.requestLogger?.(request);

    await promisify<
      pb.SetSmartMachineCredentialsRequest,
      pb.SetSmartMachineCredentialsResponse
    >(service.setSmartMachineCredentials.bind(service), request);
  }

  async getNetworkList() {
    const { service } = this;
    const request = new pb.GetNetworkListRequest();

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetNetworkListRequest,
      pb.GetNetworkListResponse
    >(service.getNetworkList.bind(service), request);
    return response.toObject().networksList;
  }
}
