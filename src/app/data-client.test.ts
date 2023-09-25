import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CaptureInterval,
  Filter,
  TabularData,
  TabularDataByFilterResponse,
  TagsFilter,
} from '../gen/app/data/v1/data_pb';
import { DataServiceClient } from '../gen/app/data/v1/data_pb_service';
vi.mock('../gen/app/data/v1/data_pb_service');
import { DataClient, type FilterOptions } from './data-client';

const serviceHost = 'fakeServiceHost';
const transport = new FakeTransportBuilder().build();
let dataClient: DataClient;

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
const interval = new CaptureInterval();
interval.setStart(Timestamp.fromDate(new Date(1, 1, 1, 1, 1, 1)));
interval.setEnd(Timestamp.fromDate(new Date(2, 2, 2, 2, 2, 2)));
const tagsFilter = new TagsFilter();
tagsFilter.setTagsList(['testTag1', 'testTag2']);

const tabularData1 = new TabularData();
const data1 = { key: 'value1' };
const struct1 = Struct.fromJavaScript(data1);
tabularData1.setData(struct1);
const tabularData2 = new TabularData();
const data2 = { key: 'value2' };
const struct2 = Struct.fromJavaScript(data2);
tabularData2.setData(struct2);
const tabularDataResponse = new TabularDataByFilterResponse();
tabularDataResponse.setDataList([tabularData1, tabularData2]);

beforeEach(() => {
  DataServiceClient.prototype.tabularDataByFilter = vi
    .fn()
    .mockImplementationOnce((_req, _md, cb) => {
      cb(null, {
        getDataList: () => tabularDataResponse.getDataList(),
        getLast: () => tabularDataResponse.getLast(),
      });
    })
    .mockImplementation((_req, _md, cb) => {
        cb(null, {
            getDataList: () => []
        })
    });
  dataClient = new DataClient(serviceHost, { transport });
});

describe('tabularDataByFilter tests',  () => {
  const filter: Filter = new Filter();
  const dataList = tabularDataResponse.getDataList();
  const dataArray: TabularData.AsObject[] = [];
  dataArray.push(...dataList.map((data) => data.toObject()));

  test('tabulardatabyfilter', async () => {
    const promise = await dataClient.tabularDataByFilter(filter);
    expect(promise.length).toEqual(2);
    expect(promise[0].data.fieldsMap[0][0]).toEqual('key')
    expect(promise[0].data.fieldsMap[0][1].stringValue).toEqual('value1')
    expect(promise[1].data.fieldsMap[0][0]).toEqual('key')
    expect(promise[1].data.fieldsMap[0][1].stringValue).toEqual('value2')
  });
});

describe('createFilter', () => {
  let opts: FilterOptions;
  let filter: Filter;
  let testFilter: Filter;

  test('create filter', () => {
    opts = { componentName: 'camera' };
    filter = dataClient.createFilter(opts);

    const thing = new Filter();
    thing.setComponentName('camera');

    expect(filter).toEqual(thing);
  });

  test('create filter with all options', () => {
    opts = {
      componentName: 'testComponentName',
      componentType: 'testComponentType',
      method: 'testMethod',
      robotName: 'testRobotName',
      robotId: 'testRobotId',
      partName: 'testPartName',
      partId: 'testPartId',
      locationIdsList: ['testLocationId1', 'testLocationId2'],
      organizationIdsList: ['testOrgId1', 'testOrgId2'],
      mimeTypeList: ['testMimeType1', 'testMimeType2'],
      bboxLabelsList: ['testBboxLabel1', 'testBboxLabel2'],
      startTime: new Date(1, 1, 1, 1, 1, 1),
      endTime: new Date(2, 2, 2, 2, 2, 2),
      tags: ['testTag1', 'testTag2'],
    };
    filter = dataClient.createFilter(opts);

    testFilter = new Filter();
    testFilter.setComponentName(componentName);
    testFilter.setComponentType(componentType);
    testFilter.setMethod(method);
    testFilter.setRobotName(robotName);
    testFilter.setRobotId(robotId);
    testFilter.setPartName(partName);
    testFilter.setPartId(partId);
    testFilter.setLocationIdsList(locationsIdsList);
    testFilter.setOrganizationIdsList(organizationIdsList);
    testFilter.setMimeTypeList(mimeTypeList);
    testFilter.setBboxLabelsList(bboxLabelsList);
    testFilter.setInterval(interval);
    testFilter.setTagsFilter(tagsFilter);

    expect(filter).toEqual(testFilter);
  });
});
