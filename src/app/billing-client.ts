import { type RpcOptions } from '@improbable-eng/grpc-web/dist/typings/client.d';
import { BillingServiceClient } from '../gen/app/v1/billing_pb_service';
import pb from '../gen/app/v1/billing_pb';
import { promisify } from '../utils';

type ValueOf<T> = T[keyof T];
export const { PaymentMethodType } = pb;
export type PaymentMethodType = ValueOf<typeof pb.PaymentMethodType>;

export type GetCurrentMonthUsageResponse =
  Partial<pb.GetCurrentMonthUsageResponse> & {
    startDate?: Date;
    endDate?: Date;
  };

const decodeMonthUsage = (
  proto: pb.GetCurrentMonthUsageResponse
): GetCurrentMonthUsageResponse => {
  const result: GetCurrentMonthUsageResponse = proto.toObject();
  if (proto.startDate != undefined) {
    result.startDate = proto.getStartDate().toDate();
  }
  if (proto.endDate != undefined) {
    result.endDate = proto.getEndDate().toDate();
  }
  return result;
};

export class BillingClient {
  private service: BillingServiceClient;

  constructor(serviceHost: string, grpcOptions: RpcOptions) {
    this.service = new BillingServiceClient(serviceHost, grpcOptions);
  }

  async getCurrentMonthUsage(org_id: string) {
    const { service } = this;

    const req = new pb.GetCurrentMonthUsageRequest();
    req.setOrgId(org_id);

    const response = await promisify<
      pb.GetCurrentMonthUsageRequest,
      pb.GetCurrentMonthUsageResponse
    >(service.getCurrentMonthUsage.bind(service), req);
    return decodeMonthUsage(response);
  }

  async getOrgBillingInformation(org_id: string) {
    const { service } = this;

    const req = new pb.GetOrgBillingInformationRequest();
    req.setOrgId(org_id);

    const response = await promisify<
      pb.GetOrgBillingInformationRequest,
      pb.GetOrgBillingInformationResponse
    >(service.getOrgBillingInformation.bind(service), req);
    return response.toObject();
  }

  async getInvoicesSummary(org_id: string) {
    const { service } = this;

    const req = new pb.GetInvoicesSummaryRequest();
    req.setOrgId(org_id);

    const response = await promisify<
      pb.GetInvoicesSummaryRequest,
      pb.GetInvoicesSummaryResponse
    >(service.getInvoicesSummary.bind(service), req);
    return response.toObject();
  }

  async getInvoicePdf(id: string, org_id: string) {
    const { service } = this;

    const req = new pb.GetInvoicePdfRequest();
    req.setId(id);
    req.setOrgId(org_id);

    const response = await promisify<
      pb.GetInvoicePdfRequest,
      pb.GetInvoicePdfResponse
    >(service.getInvoicePdf.bind(service), req);
    return response.chunk;
  }
}
