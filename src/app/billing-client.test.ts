import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { describe } from 'vitest';
import { beforeEach, expect, it, vi } from 'vitest';
import {
  GetCurrentMonthUsageRequest,
  GetCurrentMonthUsageResponse,
  GetInvoicePdfRequest,
  GetInvoicePdfResponse,
  GetInvoicesSummaryRequest,
  GetOrgBillingInformationRequest,
  PaymentMethodType,
} from '../gen/app/v1/billing_pb';
import { BillingServiceClient } from '../gen/app/v1/billing_pb_service';
import { BillingClient } from './billing-client';

const SECONDS = 1;
const NANOS = 2_000_000;
const testStartDate = new Timestamp();
testStartDate.setSeconds(SECONDS);
testStartDate.setNanos(NANOS);
const testEndDate = new Timestamp();
testEndDate.setSeconds(SECONDS * 2);
testEndDate.setNanos(NANOS);
const testMonthUsage = {
  cloudStorageUsageCost: 1,
  dataUploadUsageCost: 2,
  dataEgresUsageCost: 3,
  remoteControlUsageCost: 4,
  standardComputeUsageCost: 5,
  discountAmount: 6,
  totalUsageWithDiscount: 7,
  totalUsageWithoutDiscount: 8,
  start: new Date(SECONDS * 1000 + NANOS / 1_000_000),
  end: new Date(SECONDS * 2000 + NANOS / 1_000_000),
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
const testInvoicePdf = new Uint8Array([1, 2, 3, 4]);

const subject = () =>
  new BillingClient('fakeServiceHost', {
    transport: new FakeTransportBuilder().build(),
  });

describe('BillingClient tests', () => {
  beforeEach(() => {
    vi.spyOn(BillingServiceClient.prototype, 'getCurrentMonthUsage')
      // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementation((_req: GetCurrentMonthUsageRequest, _md, cb) => {
        const response = new GetCurrentMonthUsageResponse();
        response.setCloudStorageUsageCost(1);
        response.setDataUploadUsageCost(2);
        response.setDataEgresUsageCost(3);
        response.setRemoteControlUsageCost(4);
        response.setStandardComputeUsageCost(5);
        response.setDiscountAmount(6);
        response.setTotalUsageWithDiscount(7);
        response.setTotalUsageWithoutDiscount(8);
        response.setStartDate(testStartDate);
        response.setEndDate(testEndDate);
        cb(null, response);
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

    vi.spyOn(BillingServiceClient.prototype, 'getInvoicePdf')
      // @ts-expect-error compiler is matching incorrect function signature
      .mockImplementation((_req: GetInvoicePdfRequest, _md, cb) => {
        const response = new GetInvoicePdfResponse();
        response.setChunk(testInvoicePdf);
        cb(null, response);
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

  it('getInvoicePdf', async () => {
    const response = await subject().getInvoicePdf('id', 'org_id');
    expect(response).toEqual(testInvoicePdf);
  });
});
