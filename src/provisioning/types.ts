import pb from '../gen/provisioning/v1/provisioning_pb';

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
