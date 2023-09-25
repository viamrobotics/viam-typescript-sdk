import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { beforeEach, describe, expect, test } from 'vitest';
import {
  CaptureInterval,
  Filter,
  TagsFilter,
} from '../gen/app/data/v1/data_pb';
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

beforeEach(() => {
  dataClient = new DataClient(serviceHost, { transport });
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
