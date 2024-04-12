import { type RpcOptions } from '@improbable-eng/grpc-web/dist/typings/client.d';
import { BillingServiceClient } from '../gen/app/v1/billing_pb_service';
import pb from '../gen/app/v1/billing_pb';
import { promisify } from '../utils';

type ValueOf<T> = T[keyof T];
export const { PaymentMethodType } = pb;
export type PaymentMethodType = ValueOf<typeof pb.PaymentMethodType>;

export type GetCurrentMonthUsageResponse =
  Partial<pb.GetCurrentMonthUsageResponse.AsObject> & {
    startDate?: Date;
    endDate?: Date;
  };

const decodeMonthUsage = (
  proto: pb.GetCurrentMonthUsageResponse
): GetCurrentMonthUsageResponse => {
  const result: GetCurrentMonthUsageResponse = {
    cloudStorageUsageCost: proto.getCloudStorageUsageCost(),
    dataUploadUsageCost: proto.getDataUploadUsageCost(),
    dataEgresUsageCost: proto.getDataEgresUsageCost(),
    remoteControlUsageCost: proto.getRemoteControlUsageCost(),
    standardComputeUsageCost: proto.getStandardComputeUsageCost(),
    discountAmount: proto.getDiscountAmount(),
    totalUsageWithDiscount: proto.getTotalUsageWithDiscount(),
    totalUsageWithoutDiscount: proto.getTotalUsageWithoutDiscount(),
  };
  if (proto.hasStartDate()) {
    result.startDate = proto.getStartDate()?.toDate();
  }
  if (proto.hasEndDate()) {
    result.endDate = proto.getEndDate()?.toDate();
  }
  return result;
};

export class BillingClient {
  private service: BillingServiceClient;

  constructor(serviceHost: string, grpcOptions: RpcOptions) {
    this.service = new BillingServiceClient(serviceHost, grpcOptions);
  }

  async getCurrentMonthUsage(orgId: string) {
    const { service } = this;

    const req = new pb.GetCurrentMonthUsageRequest();
    req.setOrgId(orgId);

    const response = await promisify<
      pb.GetCurrentMonthUsageRequest,
      pb.GetCurrentMonthUsageResponse
    >(service.getCurrentMonthUsage.bind(service), req);
    return decodeMonthUsage(response);
  }

  async getOrgBillingInformation(orgId: string) {
    const { service } = this;

    const req = new pb.GetOrgBillingInformationRequest();
    req.setOrgId(orgId);

    const response = await promisify<
      pb.GetOrgBillingInformationRequest,
      pb.GetOrgBillingInformationResponse
    >(service.getOrgBillingInformation.bind(service), req);
    return response.toObject();
  }

  async getInvoicesSummary(orgId: string) {
    const { service } = this;

    const req = new pb.GetInvoicesSummaryRequest();
    req.setOrgId(orgId);

    const response = await promisify<
      pb.GetInvoicesSummaryRequest,
      pb.GetInvoicesSummaryResponse
    >(service.getInvoicesSummary.bind(service), req);
    return response.toObject();
  }

  async getInvoicePdf(id: string, orgId: string) {
    const { service } = this;

    const req = new pb.GetInvoicePdfRequest();
    req.setId(id);
    req.setOrgId(orgId);

    const response = await promisify<
      pb.GetInvoicePdfRequest,
      pb.GetInvoicePdfResponse
    >(service.getInvoicePdf.bind(service), req);
    return response.getChunk();
  }
}
