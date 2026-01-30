import type {
  GetLocationBillingOrganizationResponse,
  UpdateLocationBillingOrganizationResponse,
  ChargeOrganizationResponse
} from '../gen/app/v1/billing_pb';
import { createClient, type Client, type Transport } from '@connectrpc/connect';
import { BillingService } from '../gen/app/v1/billing_connect';
import type { GetCurrentMonthUsageResponse as PBGetCurrentMonthUsageResponse } from '../gen/app/v1/billing_pb';

export type GetCurrentMonthUsageResponse =
  Partial<PBGetCurrentMonthUsageResponse> & {
    start?: Date;
    end?: Date;
  };

export class BillingClient {
  private client: Client<typeof BillingService>;

  constructor(transport: Transport) {
    this.client = createClient(BillingService, transport);
  }

  /**
   * Get the data usage information for the current month for a given
   * organization.
   *
   * @example
   *
   * ```ts
   * const usage = await billing.getCurrentMonthUsage('<organization-id>');
   * ```
   *
   * For more information, see [Billing
   * API](https://docs.viam.com/dev/reference/apis/billing-client/#getcurrentmonthusage).
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
   * const billingInfo = await billing.getOrgBillingInformation(
   *   '<organization-id>'
   * );
   * ```
   *
   * For more information, see [Billing
   * API](https://docs.viam.com/dev/reference/apis/billing-client/#getorgbillinginformation).
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
   * const invoicesSummary = await billing.getInvoicesSummary(
   *   '<organization-id>'
   * );
   * ```
   *
   * For more information, see [Billing
   * API](https://docs.viam.com/dev/reference/apis/billing-client/#getinvoicesummary).
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
   * const invoicePdf = await billing.getInvoicePdf(
   *   '<invoice-id>',
   *   '<organization-id>'
   * );
   * ```
   *
   * For more information, see [Billing
   * API](https://docs.viam.com/dev/reference/apis/billing-client/#getinvoicepdf).
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

  /**
   * Get the billing organization for a location.
   *
   * @param locationId - The location ID.
   */
  async getLocationBillingOrganization(locationId: string) {
    return this.client.getLocationBillingOrganization({
      locationId,
    });
  }

  /**
   * Update the billing organization for a location.
   *
   * @param locationId - The location ID.
   * @param billingOrganizationId - The billing organization ID.
   */
  async updateLocationBillingOrganization(
    locationId: string,
    billingOrganizationId: string
  ) {
    return this.client.updateLocationBillingOrganization({
      locationId,
      billingOrganizationId,
    });
  }

  /**
   * Charge an organization on the spot.
   *
   * @param orgIdToCharge - The organization ID to charge.
   * @param subtotal - The subtotal amount to charge.
   * @param tax - The tax amount to charge.
   * @param options - Optional parameters.
   * @param options.description - A description for the charge.
   * @param options.orgIdForBranding - The organization ID for branding purposes.
   * @param options.disableConfirmationEmail - Whether to disable the confirmation email.
   */
  async chargeOrganization(
    orgIdToCharge: string,
    subtotal: number,
    tax: number,
    options?: {
      description?: string;
      orgIdForBranding?: string;
      disableConfirmationEmail?: boolean;
    }
  ) {
    return this.client.chargeOrganization({
      orgIdToCharge,
      description: options?.description,
      subtotal,
      tax,
      orgIdForBranding: options?.orgIdForBranding,
      disableConfirmationEmail: options?.disableConfirmationEmail ?? false,
    });
  }

  /**
   * @deprecated Use {@link BillingClient.chargeOrganization} instead.
   * Directly create a flat fee invoice for an organization and charge on the spot.
   *
   * @param orgIdToCharge - The organization ID to charge.
   * @param subtotal - The subtotal amount to charge.
   * @param tax - The tax amount to charge.
   * @param options - Optional parameters.
   * @param options.description - A description for the invoice.
   * @param options.orgIdForBranding - The organization ID for branding purposes.
   * @param options.disableConfirmationEmail - Whether to disable the confirmation email.
   */
  async createInvoiceAndChargeImmediately(
    orgIdToCharge: string,
    subtotal: number,
    tax: number,
    options?: {
      description?: string;
      orgIdForBranding?: string;
      disableConfirmationEmail?: boolean;
    }
  ) {
    return this.chargeOrganization(orgIdToCharge, subtotal, tax, options);
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