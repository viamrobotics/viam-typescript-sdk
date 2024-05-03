import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventDispatcher } from '../events';
import {
  GetCurrentMonthUsageRequest,
  GetCurrentMonthUsageResponse,
  GetInvoicePdfResponse,
  GetInvoicesSummaryRequest,
  GetOrgBillingInformationRequest,
  PaymentMethodType,
} from '../gen/app/v1/billing_pb';
import { BillingServiceClient } from '../gen/app/v1/billing_pb_service';
import { type ResponseStream } from '../gen/robot/v1/robot_pb_service';
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
  binaryDataCloudStorageUsageCost: 9,
  otherCloudStorageUsageCost: 10,
  perMachineUsageCost: 11,
  startDate: testStartDate.toObject(),
  endDate: testEndDate.toObject(),
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

class TestResponseStream<T> extends EventDispatcher {
  private stream: ResponseStream<any>;

  constructor(stream: ResponseStream<any>) {
    super();
    this.stream = stream;
  }

  override on(
    type: string,
    handler: (message: any) => void
  ): ResponseStream<T> {
    super.on(type, handler);
    return this;
  }

  cancel(): void {
    this.listeners = {};
    this.stream.cancel();
  }
}
let getGetInvoicePdfStream: ResponseStream<GetInvoicePdfResponse>;
let testGetInvoicePdfStream:
  | TestResponseStream<GetInvoicePdfResponse>
  | undefined;

const subject = () =>
  new BillingClient('fakeServiceHost', {
    transport: new FakeTransportBuilder().build(),
  });

describe('BillingClient tests', () => {
  beforeEach(() => {
    testGetInvoicePdfStream = new TestResponseStream(getGetInvoicePdfStream);
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
        response.setBinaryDataCloudStorageUsageCost(9);
        response.setOtherCloudStorageUsageCost(10);
        response.setPerMachineUsageCost(11);
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

    BillingServiceClient.prototype.getInvoicePdf = vi
      .fn()
      .mockImplementation(() => testGetInvoicePdfStream);
  });

  afterEach(() => {
    testGetInvoicePdfStream = undefined;
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

  it('getInvoicePdf', () => {
    const promise = subject().getInvoicePdf('id', 'orgId');

    const response1 = new GetInvoicePdfResponse();
    const chunk1 = new Uint8Array([1, 2]);
    response1.setChunk(chunk1);
    testGetInvoicePdfStream?.emit('data', response1);

    const response2 = new GetInvoicePdfResponse();
    const chunk2 = new Uint8Array([3, 4]);
    response2.setChunk(chunk2);
    testGetInvoicePdfStream?.emit('data', response2);
    testGetInvoicePdfStream?.emit('end', { code: 0 });

    const array = new Uint8Array([1, 2, 3, 4]);
    expect(promise).resolves.toStrictEqual(array);
  });
});
