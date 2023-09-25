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
    const tagsList = ['testTag1', 'testTag2']
    const tagsFilter = new TagsFilter();
    tagsFilter.setTagsList(tagsList);

    opts = {
      componentName: componentName,
      componentType: componentType,
      method: method,
      robotName: robotName,
      robotId: robotId,
      partName: partName,
      partId: partId,
      locationIdsList: locationsIdsList,
      organizationIdsList: organizationIdsList,
      mimeTypeList: mimeTypeList,
      bboxLabelsList: bboxLabelsList,
      startTime: startTime,
      endTime: endTime,
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
