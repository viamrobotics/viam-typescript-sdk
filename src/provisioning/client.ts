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

  private get ProvisioningService() {
    return this.client;
  }

  async getSmartMachineStatus() {
    const provisioningService = this.ProvisioningService;
    const request = new pb.GetSmartMachineStatusRequest();
    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetSmartMachineStatusRequest,
      pb.GetSmartMachineStatusResponse
    >(
      provisioningService.getSmartMachineStatus.bind(provisioningService),
      request
    );
    return response.toObject();
  }

  async setNetworkCredentials(type: string, ssid: string, psk: string) {
    const provisioningService = this.ProvisioningService;
    const request = new pb.SetNetworkCredentialsRequest();
    request.setType(type);
    request.setSsid(ssid);
    request.setPsk(psk);

    this.options.requestLogger?.(request);

    await promisify<
      pb.SetNetworkCredentialsRequest,
      pb.SetNetworkCredentialsResponse
    >(
      provisioningService.setNetworkCredentials.bind(provisioningService),
      request
    );
  }

  async setSmartMachineCredentials(cloud?: CloudConfig) {
    const provisioningService = this.ProvisioningService;
    const request = new pb.SetSmartMachineCredentialsRequest();
    if (cloud) {
      request.setCloud(encodeCloudConfig(cloud));
    }

    this.options.requestLogger?.(request);

    await promisify<
      pb.SetSmartMachineCredentialsRequest,
      pb.SetSmartMachineCredentialsResponse
    >(
      provisioningService.setSmartMachineCredentials.bind(provisioningService),
      request
    );
  }

  async getNetworkList() {
    const provisioningService = this.ProvisioningService;
    const request = new pb.GetNetworkListRequest();

    this.options.requestLogger?.(request);

    const response = await promisify<
      pb.GetNetworkListRequest,
      pb.GetNetworkListResponse
    >(provisioningService.getNetworkList.bind(provisioningService), request);
    return response.toObject().networksList;
  }
}
