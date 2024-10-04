import {
  createPromiseClient,
  type PromiseClient,
  type Transport,
} from '@connectrpc/connect';
import { BillingService } from '../gen/app/v1/billing_connect';
import type { GetCurrentMonthUsageResponse as PBGetCurrentMonthUsageResponse } from '../gen/app/v1/billing_pb';

export type GetCurrentMonthUsageResponse =
  Partial<PBGetCurrentMonthUsageResponse> & {
    start?: Date;
    end?: Date;
  };

export class BillingClient {
  private client: PromiseClient<typeof BillingService>;

  constructor(transport: Transport) {
    this.client = createPromiseClient(BillingService, transport);
  }

  async getCurrentMonthUsage(orgId: string) {
    const result: GetCurrentMonthUsageResponse =
      await this.client.getCurrentMonthUsage({
        orgId,
      });
    result.start = result.startDate?.toDate();
    result.end = result.endDate?.toDate();
    return result;
  }

  async getOrgBillingInformation(orgId: string) {
    return this.client.getOrgBillingInformation({
      orgId,
    });
  }

  async getInvoicesSummary(orgId: string) {
    return this.client.getInvoicesSummary({
      orgId,
    });
  }

  async getInvoicePdf(id: string, orgId: string) {
    const pdfParts = this.client.getInvoicePdf({
      id,
      orgId,
    });
    const chunks = [];
    for await (const pdfPart of pdfParts) {
      chunks.push(pdfPart.chunk);
    }
    return concatArrayU8(chunks);
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
