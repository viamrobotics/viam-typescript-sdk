import { type RpcOptions } from '@improbable-eng/grpc-web/dist/typings/client.d';
import { BillingServiceClient } from '../gen/app/v1/billing_pb_service';
import pb from '../gen/app/v1/billing_pb';
import { promisify } from '../utils';

type GetCurrentMonthUsageResponse =
  Partial<pb.GetCurrentMonthUsageResponse.AsObject> & {
    start?: Date;
    end?: Date;
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

    const result: GetCurrentMonthUsageResponse = response.toObject();
    result.start = response.getStartDate()?.toDate();
    result.end = response.getEndDate()?.toDate();
    return result;
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

    const chunks: Uint8Array[] = [];
    const stream = service.getInvoicePdf(req);

    stream.on('data', (response) => {
      const chunk = response.getChunk_asU8();
      chunks.push(chunk);
    });

    return new Promise<Uint8Array>((resolve, reject) => {
      stream.on('status', (status) => {
        if (status.code !== 0) {
          const error = {
            message: status.details,
            code: status.code,
            metadata: status.metadata,
          };
          reject(error);
        }
      });

      stream.on('end', (end) => {
        if (end === undefined) {
          const error = { message: 'Stream ended without a status code' };
          reject(error);
        } else if (end.code !== 0) {
          const error = {
            message: end.details,
            code: end.code,
            metadata: end.metadata,
          };
          reject(error);
        }
        const arr = concatArrayU8(chunks);
        resolve(arr);
      });
    });
  }
}

const concatArrayU8 = (arrays: Uint8Array[]) => {
  const totalLength = arrays.reduce((acc, value) => acc + value.length, 0);
  const result = new Uint8Array(totalLength);
  let length = 0;
  for (const array of arrays) {
    result.set(array, length);
    length += array.length;
  }
  return result;
};
