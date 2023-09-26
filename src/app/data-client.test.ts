import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import {
  beforeEach,
  describe,
  expect,
  type SpyInstance,
  test,
  vi,
} from 'vitest';
import {
  BinaryData,
  BinaryDataByFilterRequest,
  BinaryDataByFilterResponse,
  BinaryDataByIDsRequest,
  BinaryID,
  CaptureInterval,
  DataRequest,
  Filter,
  TabularData,
  TabularDataByFilterRequest,
  TabularDataByFilterResponse,
  TagsFilter,
} from '../gen/app/data/v1/data_pb';
import { DataServiceClient } from '../gen/app/data/v1/data_pb_service';
vi.mock('../gen/app/data/v1/data_pb_service');
import { DataClient } from './data-client';

const subject = () =>
  new DataClient('fakeServiceHost', {
    transport: new FakeTransportBuilder().build(),
  });
describe('DataClient tests', () => {
  describe('tabularDataByFilter tests', () => {
    let methodSpy: SpyInstance;
    const tabData1 = new TabularData();
    const tabData2 = new TabularData();
    tabData1.setData(Struct.fromJavaScript({ key: 'value1' }));
    tabData2.setData(Struct.fromJavaScript({ key: 'value2' }));
    const tabDataResponse = new TabularDataByFilterResponse();
    tabDataResponse.setDataList([tabData1, tabData2]);

    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'tabularDataByFilter')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementationOnce((_req: TabularDataByFilterRequest, _md, cb) => {
          cb(null, tabDataResponse);
        })
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, {
            getDataList: () => [],
          });
        });
    });

    test('get tabular data', async () => {
      const promise = await subject().tabularDataByFilter();
      expect(promise.length).toEqual(2);
      const [data1, data2] = promise;
      expect(data1).toMatchObject(tabData1.toObject());
      expect(data2).toMatchObject(tabData2.toObject());
    });

    test('get filtered tabular data', async () => {
      const filter = new Filter();
      const testComponentName = 'testComponentName';
      filter.setComponentName(testComponentName);

      const dataReq = new DataRequest();
      dataReq.setFilter(filter);
      dataReq.setLimit(100);
      dataReq.setLast('');
      const req = new TabularDataByFilterRequest();
      req.setDataRequest(dataReq);
      req.setCountOnly(false);

      await subject().tabularDataByFilter(filter);
      expect(methodSpy).toHaveBeenCalledWith(
        req,
        expect.anything(),
        expect.anything()
      );
    });
  });

  const bin1 = 'binary1';
  const bin2 = 'binary2';
  const binData1 = new BinaryData();
  binData1.setBinary(bin1);
  const binData2 = new BinaryData();
  binData2.setBinary(bin2);
  const binDataResponse = new BinaryDataByFilterResponse();
  binDataResponse.setDataList([binData1, binData2]);

  describe('binaryDataByFilter tests', () => {
    let methodSpy: SpyInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'binaryDataByFilter')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementationOnce((_req: BinaryDataByFilterRequest, _md, cb) => {
          cb(null, binDataResponse);
        })
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, {
            getDataList: () => [],
          });
        });
    });
    test('get binary data', async () => {
      const promise = await subject().binaryDataByFilter();
      expect(promise.length).toEqual(2);
      expect(promise[0]?.binary).toEqual(bin1);
      expect(promise[1]?.binary).toEqual(bin2);
    });

    test('get filtered binary data', async () => {
      const filter = new Filter();
      const testComponentName = 'testComponentName';
      filter.setComponentName(testComponentName);

      const dataReq = new DataRequest();
      dataReq.setFilter(filter);
      dataReq.setLimit(100);
      dataReq.setLast('');
      const req = new BinaryDataByFilterRequest();
      req.setDataRequest(dataReq);
      req.setCountOnly(false);

      await subject().binaryDataByFilter(filter);
      expect(methodSpy).toHaveBeenCalledWith(
        req,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('binaryDataById tests', () => {
    let methodSpy: SpyInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'binaryDataByIDs')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req: BinaryDataByIDsRequest, _md, cb) => {
          cb(null, binDataResponse);
        });
    });

    const binaryId1 = new BinaryID();
    binaryId1.setFileId('testFileId1');
    binaryId1.setOrganizationId('testOrgId');
    binaryId1.setLocationId('testLocationId');
    const binaryId2 = new BinaryID();
    binaryId2.setFileId('testFileId1');
    binaryId2.setOrganizationId('testOrgId');
    binaryId2.setLocationId('testLocationId');

    test('get binary data by ids', async () => {
      const promise = await subject().binaryDataByIds([
        binaryId1.toObject(),
        binaryId2.toObject(),
      ]);
      expect(promise.length).toEqual(2);
      expect(promise[0]?.binary).toEqual(bin1);
      expect(promise[1]?.binary).toEqual(bin2);
    });

    test('get binary data by id', async () => {
      const req = new BinaryDataByIDsRequest();
      req.setBinaryIdsList([binaryId1]);
      req.setIncludeBinary(true);

      await subject().binaryDataByIds([binaryId1.toObject()]);
      expect(methodSpy).toHaveBeenCalledWith(
        req,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('createFilter tests', () => {
    test('create empty filter', () => {
      const testFilter = subject().createFilter({});
      expect(testFilter).toEqual(new Filter());
    });

    test('create filter', () => {
      const opts = { componentName: 'camera' };
      const testFilter = subject().createFilter(opts);

      const actualFilter = new Filter();
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

      const opts = {
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
      const testFilter = subject().createFilter(opts);
      expect(testFilter.getComponentType()).toEqual('testComponentType');

      const actualFilter = new Filter();
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
});
