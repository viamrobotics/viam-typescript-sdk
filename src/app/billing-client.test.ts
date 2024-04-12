import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { describe } from 'node:test';
import { beforeEach, expect, it, vi } from 'vitest';
import {
  GetCurrentMonthUsageRequest,
  GetInvoicePdfRequest,
  GetInvoicePdfResponse,
  GetInvoicesSummaryRequest,
  GetOrgBillingInformationRequest,
} from '../gen/app/v1/billing_pb';
import { BillingServiceClient } from '../gen/app/v1/billing_pb_service';
import { BillingClient, PaymentMethodType } from './billing-client';

const testMonthUsage = {
  cloudStorageUsageCost: 1,
  dataUploadUsageCost: 2,
  dataEgresUsageCost: 3,
  remoteControlUsageCost: 4,
  standardComputeUsageCost: 5,
  discountAmount: 6,
  totalUsageWithDiscount: 7,
  totalUsageWithoutDiscount: 8,
};
const testInvoiceSummary = {
  id: 'id',
  invoiceAmount: 1,
  status: 'status',
};
const testBillingInfo = {
  type: PaymentMethodType.PAYMENT_METHOD_TYPE_UNSPECIFIED,
  billingEmail: 'email@email.com',
  billingTier: 'platinum',
};

const subject = () =>
  new BillingClient('fakeServiceHost', {
    transport: new FakeTransportBuilder().build(),
  });

describe('BillingClient tests', () => {
  beforeEach(() => {
    vi.spyOn(BillingServiceClient.prototype, 'getCurrentMonthUsage')
      // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementation((_req: GetCurrentMonthUsageRequest, _md, cb) => {
        cb(null, { toObject: () => testMonthUsage });
      });

    vi.spyOn(BillingServiceClient.prototype, 'getOrgBillingInformation')
      // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementation((_req: GetOrgBillingInformationRequest, _md, cb) => {
        cb(null, { toObject: () => testBillingInfo });
      });

    vi.spyOn(BillingServiceClient.prototype, 'getInvoicesSummary')
      // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementation((_req: GetInvoicesSummaryRequest, _md, cb) => {
        cb(null, { toObject: () => testInvoiceSummary });
      });
      });
  });

  it('getCurrentMonthUsage', async () => {
    const response = await subject().getCurrentMonthUsage('org_id');
    expect(response).toEqual(testMonthUsage);
  });

  it('getOrgBillingInformation', async () => {
    const response = await subject().getOrgBillingInformation('org_id');
    expect(response).toEqual(testBillingInfo);
  });

  it('getInvoicesSummary', async () => {
    const response = await subject().getInvoicesSummary('org_id');
    expect(response).toEqual(testInvoiceSummary);
  });
});
