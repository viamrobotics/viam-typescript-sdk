import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import {
  Struct,
  type JavaScriptValue,
} from 'google-protobuf/google/protobuf/struct_pb';
import { beforeEach, describe, expect, type SpyInstance, it, vi } from 'vitest';
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
  TabularDataBySQLRequest,
  TabularDataBySQLResponse,
  TabularDataByMQLRequest,
  TabularDataByMQLResponse,
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
  describe('tabularDataBySQL tests', () => {
    const data: Record<string, JavaScriptValue>[] = [
      { key1: 1, key2: '2', key3: [1, 2, 3], key4: { key4sub1: 1 } },
    ];

    beforeEach(() => {
      vi.spyOn(DataServiceClient.prototype, 'tabularDataBySQL')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementationOnce((_req: TabularDataBySQLRequest, _md, cb) => {
          const response = new TabularDataBySQLResponse();
          response.setDataList(data.map((x) => Struct.fromJavaScript(x)));
          cb(null, response);
        });
    });

    it('get tabular data from SQL', async () => {
      const response = await subject().tabularDataBySQL(
        'some_org_id',
        'some_sql_query'
      );
      expect(response).toEqual(data);
    });
  });

  describe('tabularDataByMQL tests', () => {
    const data: Record<string, JavaScriptValue>[] = [
      { key1: 1, key2: '2', key3: [1, 2, 3], key4: { key4sub1: 1 } },
    ];

    beforeEach(() => {
      vi.spyOn(DataServiceClient.prototype, 'tabularDataByMQL')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementationOnce((_req: TabularDataByMQLRequest, _md, cb) => {
          const response = new TabularDataByMQLResponse();
          response.setDataList(data.map((x) => Struct.fromJavaScript(x)));
          cb(null, response);
        });
    });

    it('get tabular data from MQL', async () => {
      const response = await subject().tabularDataByMQL('some_org_id', [
        new TextEncoder().encode('some_mql_query'),
      ]);
      expect(response).toEqual(data);
    });
  });

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

    it('get tabular data', async () => {
      const promise = await subject().tabularDataByFilter();
      expect(promise.length).toEqual(2);
      const [data1, data2] = promise;
      expect(data1?.data).toMatchObject({ key: 'value1' });
      expect(data2?.data).toMatchObject({ key: 'value2' });
    });

    it('get filtered tabular data', async () => {
      const filter = subject().createFilter({
        componentName: 'testComponentName',
        componentType: 'testComponentType',
      });

      const dataReq = new DataRequest();
      dataReq.setFilter(filter);
      dataReq.setLimit(100);
      dataReq.setLast('');
      const expectedRequest = new TabularDataByFilterRequest();
      expectedRequest.setDataRequest(dataReq);
      expectedRequest.setCountOnly(false);

      await subject().tabularDataByFilter(filter);
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
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
    it('get binary data', async () => {
      const promise = await subject().binaryDataByFilter();
      expect(promise.length).toEqual(2);
      expect(promise[0]?.binary).toEqual(bin1);
      expect(promise[1]?.binary).toEqual(bin2);
    });

    it('get filtered binary data', async () => {
      const filter = subject().createFilter({
        componentName: 'testComponentName',
        componentType: 'testComponentType',
      });

      const dataReq = new DataRequest();
      dataReq.setFilter(filter);
      dataReq.setLimit(100);
      dataReq.setLast('');
      const expectedRequest = new BinaryDataByFilterRequest();
      expectedRequest.setDataRequest(dataReq);
      expectedRequest.setCountOnly(false);

      await subject().binaryDataByFilter(filter);
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
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

    it('get binary data by ids', async () => {
      const promise = await subject().binaryDataByIds([
        binaryId1.toObject(),
        binaryId2.toObject(),
      ]);
      expect(promise.length).toEqual(2);
      expect(promise[0]?.binary).toEqual(bin1);
      expect(promise[1]?.binary).toEqual(bin2);
    });

    it('get binary data by id', async () => {
      const expectedRequest = new BinaryDataByIDsRequest();
      expectedRequest.setBinaryIdsList([binaryId1]);
      expectedRequest.setIncludeBinary(true);

      await subject().binaryDataByIds([binaryId1.toObject()]);
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('createFilter tests', () => {
    it('create empty filter', () => {
      const testFilter = subject().createFilter({});
      expect(testFilter).toEqual(new Filter());
    });

    it('create filter', () => {
      const opts = { componentName: 'camera' };
      const testFilter = subject().createFilter(opts);

      const expectedFilter = new Filter();
      expectedFilter.setComponentName('camera');

      expect(testFilter).toEqual(expectedFilter);
    });

    it('create filter with all options', () => {
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

      const expectedFilter = new Filter();
      expectedFilter.setComponentName(componentName);
      expectedFilter.setComponentType(componentType);
      expectedFilter.setMethod(method);
      expectedFilter.setRobotName(robotName);
      expectedFilter.setRobotId(robotId);
      expectedFilter.setPartName(partName);
      expectedFilter.setPartId(partId);
      expectedFilter.setLocationIdsList(locationsIdsList);
      expectedFilter.setOrganizationIdsList(organizationIdsList);
      expectedFilter.setMimeTypeList(mimeTypeList);
      expectedFilter.setBboxLabelsList(bboxLabelsList);
      expectedFilter.setInterval(interval);
      expectedFilter.setTagsFilter(tagsFilter);

      expect(testFilter).toEqual(expectedFilter);
    });
  });
});
