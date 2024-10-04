import { Timestamp } from '@bufbuild/protobuf';
import { createRouterTransport, type Transport } from '@connectrpc/connect';
import {
  createWritableIterable,
  type WritableIterable,
} from '@connectrpc/connect/protocol';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BillingService } from '../gen/app/v1/billing_connect';
import {
  GetInvoicePdfResponse,
  GetInvoicesSummaryResponse,
  PaymentMethodType,
} from '../gen/app/v1/billing_pb';
import {
  BillingClient,
  type GetCurrentMonthUsageResponse,
} from './billing-client';

const SECONDS = 1;
const NANOS = 2_000_000;
const testStartDate = new Timestamp({
  seconds: BigInt(SECONDS),
  nanos: NANOS,
});
const testEndDate = new Timestamp({
  seconds: BigInt(SECONDS * 2),
  nanos: NANOS,
});
const testMonthUsage: GetCurrentMonthUsageResponse = {
  cloudStorageUsageCost: 1,
  dataUploadUsageCost: 2,
  dataEgresUsageCost: 3,
  remoteControlUsageCost: 4,
  standardComputeUsageCost: 5,
  discountAmount: 6,
  totalUsageWithDiscount: 7,
  totalUsageWithoutDiscount: 8,
  binaryDataCloudStorageUsageCost: 9,
  otherCloudStorageUsageCost: 10,
  perMachineUsageCost: 11,
  startDate: testStartDate,
  endDate: testEndDate,
  start: new Date(SECONDS * 1000 + NANOS / 1_000_000),
  end: new Date(SECONDS * 2000 + NANOS / 1_000_000),
};
const testInvoiceSummary = new GetInvoicesSummaryResponse({
  invoices: [
    {
      id: 'id',
      invoiceAmount: 1,
      status: 'status',
    },
  ],
});
const testBillingInfo = {
  type: PaymentMethodType.UNSPECIFIED,
  billingEmail: 'email@email.com',
  billingTier: 'platinum',
};

let testGetInvoicePdfStream: WritableIterable<GetInvoicePdfResponse>;

let mockTransport: Transport;
const subject = () => new BillingClient(mockTransport);

describe('BillingClient tests', () => {
  beforeEach(() => {
    testGetInvoicePdfStream = createWritableIterable<GetInvoicePdfResponse>();
    mockTransport = createRouterTransport(({ service }) => {
      service(BillingService, {
        getCurrentMonthUsage: () => {
          return {
            cloudStorageUsageCost: 1,
            dataUploadUsageCost: 2,
            dataEgresUsageCost: 3,
            remoteControlUsageCost: 4,
            standardComputeUsageCost: 5,
            discountAmount: 6,
            totalUsageWithDiscount: 7,
            totalUsageWithoutDiscount: 8,
            binaryDataCloudStorageUsageCost: 9,
            otherCloudStorageUsageCost: 10,
            perMachineUsageCost: 11,
            startDate: testStartDate,
            endDate: testEndDate,
          } as GetCurrentMonthUsageResponse;
        },
        getOrgBillingInformation: () => testBillingInfo,
        getInvoicesSummary: () => testInvoiceSummary,
        getInvoicePdf: () => testGetInvoicePdfStream,
      });
    });
  });

  afterEach(() => {
    testGetInvoicePdfStream = createWritableIterable<GetInvoicePdfResponse>();
  });

  it('getCurrentMonthUsage', async () => {
    const response = await subject().getCurrentMonthUsage('orgId');
    expect(response).toEqual(testMonthUsage);
  });

  it('getOrgBillingInformation', async () => {
    const response = await subject().getOrgBillingInformation('orgId');
    expect(response).toEqual(testBillingInfo);
  });

  it('getInvoicesSummary', async () => {
    const response = await subject().getInvoicesSummary('orgId');
    expect(response).toEqual(testInvoiceSummary);
  });

  it('getInvoicePdf', async () => {
    const promise = subject().getInvoicePdf('id', 'orgId');

    const chunk1 = new Uint8Array([1, 2]);
    await testGetInvoicePdfStream.write(
      new GetInvoicePdfResponse({
        chunk: chunk1,
      })
    );

    const chunk2 = new Uint8Array([3, 4]);
    await testGetInvoicePdfStream.write(
      new GetInvoicePdfResponse({
        chunk: chunk2,
      })
    );
    testGetInvoicePdfStream.close();

    const array = new Uint8Array([1, 2, 3, 4]);
    await expect(promise).resolves.toStrictEqual(array);
  });
});
