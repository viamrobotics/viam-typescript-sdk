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

  /**
   * Get the data usage information for the current month for a given
   * organization.
   *
   * @example
   *
   * ```ts
   * const billing = new VIAM.BillingClient(machine, 'my_billing');
   * const usage = await billing.getCurrentMonthUsage('<organization-id>');
   * console.log(usage);
   * ```
   *
   * @param orgId - The organization ID.
   */
  async getCurrentMonthUsage(orgId: string) {
    const result: GetCurrentMonthUsageResponse =
      await this.client.getCurrentMonthUsage({
        orgId,
      });
    result.start = result.startDate?.toDate();
    result.end = result.endDate?.toDate();
    return result;
  }

  /**
   * Get the billing information (payment method, billing tier, etc.) for a
   * given org.
   *
   * @example
   *
   * ```ts
   * const billing = new VIAM.BillingClient(machine, 'my_billing');
   * const billingInfo = await billing.getOrgBillingInformation(
   *   '<organization-id>'
   * );
   * console.log(billingInfo);
   * ```
   *
   * @param orgId - The organization ID.
   */
  async getOrgBillingInformation(orgId: string) {
    return this.client.getOrgBillingInformation({
      orgId,
    });
  }

  /**
   * Get total outstanding balance plus invoice summaries for a given org.
   *
   * @example
   *
   * ```ts
   * const billing = new VIAM.BillingClient(machine, 'my_billing');
   * const invoicesSummary = await billing.getInvoicesSummary(
   *   '<organization-id>'
   * );
   * console.log(invoicesSummary);
   * ```
   *
   * @param orgId - The organization ID.
   */
  async getInvoicesSummary(orgId: string) {
    return this.client.getInvoicesSummary({
      orgId,
    });
  }

  /**
   * Get invoice PDF data.
   *
   * @example
   *
   * ```ts
   * const billing = new VIAM.BillingClient(machine, 'my_billing');
   * const invoicePdf = await billing.getInvoicePdf(
   *   '<invoice-id>',
   *   '<organization-id>'
   * );
   * console.log(invoicePdf);
   * ```
   *
   * @param id - The invoice ID.
   * @param orgId - The organization ID.
   */

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
