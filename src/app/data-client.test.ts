import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  BinaryData,
  BinaryDataByFilterRequest,
  BinaryDataByFilterResponse,
  CaptureInterval,
  Filter,
  TabularData,
  TabularDataByFilterRequest,
  TabularDataByFilterResponse,
  TagsFilter,
} from '../gen/app/data/v1/data_pb';
import { DataServiceClient } from '../gen/app/data/v1/data_pb_service';
vi.mock('../gen/app/data/v1/data_pb_service');
import { type BinaryID, DataClient, type FilterOptions } from './data-client';

const serviceHost = 'fakeServiceHost';
const transport = new FakeTransportBuilder().build();
let dataClient: DataClient;

const filter1 = new Filter();
const filter2 = new Filter();
const testComponentName = 'testComponentName';
filter2.setComponentName(testComponentName);

const struct1 = Struct.fromJavaScript({ key: 'value1' });
const struct2 = Struct.fromJavaScript({ key: 'value2' });
const tabData1 = new TabularData();
tabData1.setData(struct1);
const tabData2 = new TabularData();
tabData2.setData(struct2);
const tabDataResponse = new TabularDataByFilterResponse();
tabDataResponse.setDataList([tabData1, tabData2]);

const bin1 = 'binary1';
const bin2 = 'binary2';
const binData1 = new BinaryData();
binData1.setBinary(bin1);
const binData2 = new BinaryData();
binData2.setBinary(bin2);
const binDataResponse = new BinaryDataByFilterResponse();
binDataResponse.setDataList([binData1, binData2]);

const filteredTabDataResponse = new TabularDataByFilterResponse();
filteredTabDataResponse.setDataList([tabData1]);
const filteredBinDataResponse = new BinaryDataByFilterResponse();
filteredBinDataResponse.setDataList([binData1]);

beforeEach(() => {
  DataServiceClient.prototype.tabularDataByFilter = vi
    .fn()
    .mockImplementationOnce((_req: TabularDataByFilterRequest, _md, cb) => {
      if (_req?.getDataRequest?.()?.getFilter?.() === filter1) {
        cb(null, tabDataResponse);
      } else if (_req?.getDataRequest?.()?.getFilter?.() === filter2) {
        cb(null, filteredTabDataResponse);
      }
    })
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getDataList: () => [],
      });
    });
  DataServiceClient.prototype.binaryDataByFilter = vi
    .fn()
    .mockImplementationOnce((_req: BinaryDataByFilterRequest, _md, cb) => {
      if (_req?.getDataRequest?.()?.getFilter?.() === filter1) {
        cb(null, binDataResponse);
      } else if (_req?.getDataRequest?.()?.getFilter?.() === filter2) {
        cb(null, filteredBinDataResponse);
      }
    })
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getDataList: () => [],
      });
    });
  DataServiceClient.prototype.binaryDataByIDs = vi
    .fn()
    .mockImplementation((_req, _md, cb) => {
      cb(null, binDataResponse);
    })
  dataClient = new DataClient(serviceHost, { transport });
});

describe('tabularDataByFilter tests', () => {
  test('get tabular data', async () => {
    const promise = await dataClient.tabularDataByFilter(filter1);
    expect(promise.length).toEqual(2);
    const [data1, data2] = promise;
    expect(data1).toMatchObject(tabData1.toObject());
    expect(data2).toMatchObject(tabData2.toObject());
  });

  test('get filtered tabular data', async () => {
    const promise = await dataClient.tabularDataByFilter(filter2);
    expect(promise.length).toEqual(1);
    expect(promise[0]).toMatchObject(tabData1.toObject());
  });
});

describe('binaryDataByFilter tests', () => {
  test('get binary data', async () => {
    const promise = await dataClient.binaryDataByFilter(filter1);
    expect(promise.length).toEqual(2);
    expect(promise[0]?.binary).toEqual(bin1);
    expect(promise[1]?.binary).toEqual(bin2);
  });

  test('get filtered binary data', async () => {
    const promise = await dataClient.binaryDataByFilter(filter2);
    expect(promise.length).toEqual(1);
    expect(promise[0]?.binary).toEqual(bin1);
  })
});

describe('binaryDataById tests', () => {
  const binaryID: BinaryID = {
    fileId: 'testFileId',
    organizationId: 'testOrgId',
    locationId: 'testLocationId',
  };

  test('get binary data by id', async () => {
    const promise = await dataClient.binaryDataByIds([binaryID]);
    console.log(promise);
  });
});

describe('createFilter tests', () => {
  let opts: FilterOptions;
  let testFilter: Filter;
  let actualFilter: Filter;

  test('create empty filter', () => {
    opts = {};
    dataClient.createFilter(opts);
    expect(testFilter).toBeUndefined();
  });

  test('create filter', () => {
    opts = { componentName: 'camera' };
    testFilter = dataClient.createFilter(opts);

    actualFilter = new Filter();
    actualFilter.setComponentName('camera');

    expect(testFilter).toEqual(actualFilter);
  });

  test('create filter with all options', () => {
    const componentName = 'testComponentName';
    const componentType = 'testComponentType';
    const method = 'testMethod';
    const robotName = 'testRobotName';
    const robotId = 'testRobotId';
    const partName = 'testPartName';
    const partId = 'testPartId';
    const locationsIdsList = ['testLocationId1', 'testLocationId2'];
    const organizationIdsList = ['testOrgId1', 'testOrgId2'];
    const mimeTypeList = ['testMimeType1', 'testMimeType2'];
    const bboxLabelsList = ['testBboxLabel1', 'testBboxLabel2'];
    const startTime = new Date(1, 1, 1, 1, 1, 1);
    const endTime = new Date(2, 2, 2, 2, 2, 2);
    const interval = new CaptureInterval();
    interval.setStart(Timestamp.fromDate(startTime));
    interval.setEnd(Timestamp.fromDate(endTime));
    const tagsList = ['testTag1', 'testTag2'];
    const tagsFilter = new TagsFilter();
    tagsFilter.setTagsList(tagsList);

    opts = {
      componentName,
      componentType,
      method,
      robotName,
      robotId,
      partName,
      partId,
      locationIdsList: locationsIdsList,
      organizationIdsList,
      mimeTypeList,
      bboxLabelsList,
      startTime,
      endTime,
      tags: tagsList,
    };
    testFilter = dataClient.createFilter(opts);
    expect(testFilter.getComponentType()).toEqual('testComponentType');

    actualFilter = new Filter();
    actualFilter.setComponentName(componentName);
    actualFilter.setComponentType(componentType);
    actualFilter.setMethod(method);
    actualFilter.setRobotName(robotName);
    actualFilter.setRobotId(robotId);
    actualFilter.setPartName(partName);
    actualFilter.setPartId(partId);
    actualFilter.setLocationIdsList(locationsIdsList);
    actualFilter.setOrganizationIdsList(organizationIdsList);
    actualFilter.setMimeTypeList(mimeTypeList);
    actualFilter.setBboxLabelsList(bboxLabelsList);
    actualFilter.setInterval(interval);
    actualFilter.setTagsFilter(tagsFilter);

    expect(testFilter).toEqual(actualFilter);
  });
});
