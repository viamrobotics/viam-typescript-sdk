import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { create } from '@bufbuild/protobuf';
import { TimestampSchema } from '@bufbuild/protobuf/wkt';
import { createRouterTransport, type Transport } from '@connectrpc/connect';
import {
  createWritableIterable,
  type WritableIterable,
} from '@connectrpc/connect/protocol';

import {
  BillingService,
  GetCurrentMonthUsageResponseSchema,
  type GetInvoicePdfResponse,
  GetInvoicePdfResponseSchema,
  GetInvoicesSummaryResponseSchema,
  PaymentMethodType,
  ResourceUsageCostsBySourceSchema,
  SourceType,
  UsageCostType,
} from '../gen/app/v1/billing_pb';
import {
  BillingClient,
  type GetCurrentMonthUsageResponse,
} from './billing-client';

const SECONDS = 1;
const NANOS = 2_000_000;
const testStartDate = create(TimestampSchema, {
  seconds: BigInt(SECONDS),
  nanos: NANOS,
});
const testEndDate = create(TimestampSchema, {
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
  subtotal: 12,
  resourceUsageCostsBySource: [
    create(ResourceUsageCostsBySourceSchema, {
      sourceType: SourceType.ORG,
      resourceUsageCosts: {
        usageCosts: [{ resourceType: UsageCostType.UNSPECIFIED, cost: 13 }],
      },
    }),
  ],
  startDate: testStartDate,
  endDate: testEndDate,
  start: new Date(SECONDS * 1000 + NANOS / 1_000_000),
  end: new Date(SECONDS * 2000 + NANOS / 1_000_000),
};
const testInvoiceSummary = create(GetInvoicesSummaryResponseSchema, {
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
          return create(GetCurrentMonthUsageResponseSchema, {
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
            subtotal: 12,
            resourceUsageCostsBySource: [
              {
                sourceType: SourceType.ORG,
                resourceUsageCosts: {
                  usageCosts: [
                    {
                      resourceType: UsageCostType.UNSPECIFIED,
                      cost: 13,
                    },
                  ],
                },
              },
            ],
            startDate: testStartDate,
            endDate: testEndDate,
          });
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
      create(GetInvoicePdfResponseSchema, {
        chunk: chunk1,
      })
    );

    const chunk2 = new Uint8Array([3, 4]);
    await testGetInvoicePdfStream.write(
      create(GetInvoicePdfResponseSchema, {
        chunk: chunk2,
      })
    );
    testGetInvoicePdfStream.close();

    const array = new Uint8Array([1, 2, 3, 4]);
    await expect(promise).resolves.toStrictEqual(array);
  });
});
