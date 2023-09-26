import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  BinaryData,
  BinaryDataByFilterResponse,
  CaptureInterval,
  CaptureMetadata,
  DataRequest,
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

const dataReq = new DataRequest();
const filter = new Filter();
dataReq.setFilter(filter);
dataReq.setLimit(100);
dataReq.setLast('');
const tabDataReq = new TabularDataByFilterRequest();
tabDataReq.setDataRequest(dataReq);
tabDataReq.setCountOnly(false);

const struct1 = Struct.fromJavaScript({ key: 'value1' });
const struct2 = Struct.fromJavaScript({ key: 'value2' });
const metadata1 = new CaptureMetadata();
const testComponentName = 'testComponentName';
metadata1.setComponentName(testComponentName);
const metadata2 = new CaptureMetadata();
const tabData1 = new TabularData();
tabData1.setData(struct1);
tabData1.setMetadataIndex(0);
const tabData2 = new TabularData();
tabData2.setData(struct2);
tabData2.setMetadataIndex(1);
const tabDataResponse = new TabularDataByFilterResponse();
tabDataResponse.setDataList([tabData1, tabData2]);
tabDataResponse.setMetadataList([metadata1, metadata2])

const filteredTabDataResponse = new TabularDataByFilterResponse();
filteredTabDataResponse.setDataList([tabData1]);

const binary1 = 'binary1';
const binary2 = 'binary2';
const binaryData1 = new BinaryData();
binaryData1.setBinary(binary1);
const binaryData2 = new BinaryData();
binaryData2.setBinary(binary2);
const binaryDataResponse = new BinaryDataByFilterResponse();
binaryDataResponse.setDataList([binaryData1, binaryData2]);

beforeEach(() => {
  DataServiceClient.prototype.tabularDataByFilter = vi
    .fn()
    .mockImplementationOnce((_req, _md, cb) => {
        if (JSON.stringify(_req) === JSON.stringify(tabDataReq)) {
            cb(null, {
                getDataList: () => tabDataResponse.getDataList(),
                getLast: () => tabDataResponse.getLast()
              });
        } else{
            cb(null, {
                getDataList: () => filteredTabDataResponse.getDataList(),
                getLast: () => filteredTabDataResponse.getLast()
              });
        }
    })
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getDataList: () => [],
      });
    });
  DataServiceClient.prototype.binaryDataByFilter = vi
    .fn()
    .mockImplementationOnce((_req, _md, cb) => {
      cb(null, {
        getDataList: () => binaryDataResponse.getDataList(),
        getLast: () => binaryDataResponse.getLast(),
      });
    })
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getDataList: () => [],
      });
    });
  DataServiceClient.prototype.binaryDataByIDs = vi
    .fn()
    .mockImplementationOnce((_req, _md, cb) => {
      cb(null, {
        toObject: () => binaryDataResponse.toObject(),
      });
    })
    .mockImplementation((_req, _md, cb) => {
      cb(null, {
        getDataList: () => [],
      });
    });
  dataClient = new DataClient(serviceHost, { transport });
});

describe('tabularDataByFilter tests', () => {
  test('get tabular data', async () => {
    const promise = await dataClient.tabularDataByFilter(filter);
    expect(promise.length).toEqual(2);
    const [data1, data2] = promise;
    expect(data1).toMatchObject(tabData1.toObject());
    expect(data2).toMatchObject(tabData2.toObject());
  });

  test('get filtered tabular data', async () => {
    const filter2: Filter = new Filter();
    filter2.setComponentName(testComponentName);
    const promise = await dataClient.tabularDataByFilter(filter2);
    expect(promise.length).toEqual(1);
    expect(promise[0]).toMatchObject(tabData1.toObject());
  })
});

describe('binaryDataByFilter tests', () => {
  test('get binary data', async () => {
    const promise = await dataClient.binaryDataByFilter(filter);
    expect(promise.length).toEqual(2);
    expect(promise[0]?.binary).toEqual(binary1);
    expect(promise[1]?.binary).toEqual(binary2);
  });
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
