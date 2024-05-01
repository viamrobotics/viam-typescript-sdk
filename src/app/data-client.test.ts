import { FakeTransportBuilder } from '@improbable-eng/grpc-web-fake-transport';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import {
  Struct,
  type JavaScriptValue,
} from 'google-protobuf/google/protobuf/struct_pb';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
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
  TabularDataBySQLRequest,
  TabularDataBySQLResponse,
  TabularDataByMQLRequest,
  TabularDataByMQLResponse,
  TagsFilter,
  DeleteTabularDataRequest,
  DeleteTabularDataResponse,
  DeleteBinaryDataByFilterRequest,
  DeleteBinaryDataByFilterResponse,
  DeleteBinaryDataByIDsRequest,
  AddTagsToBinaryDataByIDsRequest,
  AddTagsToBinaryDataByFilterRequest,
  RemoveTagsFromBinaryDataByIDsRequest,
  RemoveTagsFromBinaryDataByFilterRequest,
  TagsByFilterRequest,
  RemoveBoundingBoxFromImageByIDRequest,
  BoundingBoxLabelsByFilterRequest,
  AddBinaryDataToDatasetByIDsRequest,
  RemoveBinaryDataFromDatasetByIDsRequest,
  ConfigureDatabaseUserRequest,
} from '../gen/app/data/v1/data_pb';
import { DataServiceClient } from '../gen/app/data/v1/data_pb_service';
vi.mock('../gen/app/data/v1/data_pb_service');
import { DataClient } from './data-client';

const subject = () =>
  new DataClient('fakeServiceHost', {
    transport: new FakeTransportBuilder().build(),
  });

describe('DataClient tests', () => {
  const filter = subject().createFilter({
    componentName: 'testComponentName',
    componentType: 'testComponentType',
  });

  const binaryId1 = new BinaryID();
  binaryId1.setFileId('testFileId1');
  binaryId1.setOrganizationId('testOrgId');
  binaryId1.setLocationId('testLocationId');
  const binaryId2 = new BinaryID();
  binaryId2.setFileId('testFileId1');
  binaryId2.setOrganizationId('testOrgId');
  binaryId2.setLocationId('testLocationId');

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
    let methodSpy: MockInstance;
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
        .mockImplementationOnce((_req, _md, cb) => {
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
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'binaryDataByFilter')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementationOnce((_req, _md, cb) => {
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
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'binaryDataByIDs')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, binDataResponse);
        });
    });

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

  describe('deleteTabularData tests', () => {
    beforeEach(() => {
      vi.spyOn(DataServiceClient.prototype, 'deleteTabularData')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((req: DeleteTabularDataRequest, _md, cb) => {
          const response = new DeleteTabularDataResponse();
          if (req.getDeleteOlderThanDays() >= 10) {
            response.setDeletedCount(10);
          } else {
            response.setDeletedCount(5);
          }

          cb(null, response);
        });
    });

    it('delete tabular data', async () => {
      const promise = await subject().deleteTabularData('orgId', 20);
      expect(promise).toEqual(10);
    });

    it('delete newer tabular data', async () => {
      const promise = await subject().deleteTabularData('orgId', 5);
      expect(promise).toEqual(5);
    });
  });

  describe('deleteBinaryDataByFilter tests', () => {
    let methodSpy: MockInstance;

    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'deleteBinaryDataByFilter')
        .mockImplementationOnce(
          // @ts-expect-error compiler is matching incorrect function signature
          (req: DeleteBinaryDataByFilterRequest, _md, cb) => {
            const response = new DeleteBinaryDataByFilterResponse();
            if (req.getIncludeInternalData()) {
              response.setDeletedCount(20);
            } else {
              response.setDeletedCount(10);
            }
            cb(null, response);
          }
        )
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, { getDeletedCount: () => 10 });
        });
    });

    it('delete binary data', async () => {
      const promise = await subject().deleteBinaryDataByFilter();
      expect(promise).toEqual(20);
    });

    it('do not delete internal binary data', async () => {
      const promise = await subject().deleteBinaryDataByFilter(
        undefined,
        false
      );
      expect(promise).toEqual(10);
    });

    it('delete filtered binary data', async () => {
      const expectedRequest = new DeleteBinaryDataByFilterRequest();
      expectedRequest.setFilter(filter);
      expectedRequest.setIncludeInternalData(true);

      await subject().deleteBinaryDataByFilter(filter);
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('deleteBinaryDataByIds tests', () => {
    beforeEach(() => {
      vi.spyOn(
        DataServiceClient.prototype,
        'deleteBinaryDataByIDs'
        // @ts-expect-error compiler is matching incorrect function signature
      ).mockImplementation((req: DeleteBinaryDataByIDsRequest, _md, cb) => {
        cb(null, { getDeletedCount: () => req.getBinaryIdsList().length });
      });
    });

    it('delete binary data', async () => {
      const promise1 = await subject().deleteBinaryDataByIds([
        binaryId1.toObject(),
      ]);
      expect(promise1).toEqual(1);

      const promise2 = await subject().deleteBinaryDataByIds([
        binaryId1.toObject(),
        binaryId2.toObject(),
      ]);
      expect(promise2).toEqual(2);
    });
  });

  describe('addTagsToBinaryDataByIds tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'addTagsToBinaryDataByIDs')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, {});
        });
    });

    it('add tags to binary data', async () => {
      const expectedRequest = new AddTagsToBinaryDataByIDsRequest();
      expectedRequest.setBinaryIdsList([binaryId1, binaryId2]);
      expectedRequest.setTagsList(['tag1', 'tag2']);

      await subject().addTagsToBinaryDataByIds(
        ['tag1', 'tag2'],
        [binaryId1.toObject(), binaryId2.toObject()]
      );
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('addTagsToBinaryDataByFilter tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'addTagsToBinaryDataByFilter')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, {});
        });
    });

    it('add tags to binary data', async () => {
      const expectedRequest = new AddTagsToBinaryDataByFilterRequest();
      expectedRequest.setFilter(filter);
      expectedRequest.setTagsList(['tag1', 'tag2']);

      await subject().addTagsToBinaryDataByFilter(['tag1', 'tag2'], filter);
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('removeTagsFromBinaryDataByIds tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'removeTagsFromBinaryDataByIDs')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, { getDeletedCount: () => 2 });
        });
    });

    it('remove tags to binary data', async () => {
      const expectedRequest = new RemoveTagsFromBinaryDataByIDsRequest();
      expectedRequest.setBinaryIdsList([binaryId1, binaryId2]);
      expectedRequest.setTagsList(['tag1', 'tag2']);

      const promise = await subject().removeTagsFromBinaryDataByIds(
        ['tag1', 'tag2'],
        [binaryId1.toObject(), binaryId2.toObject()]
      );
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
      expect(promise).toEqual(2);
    });
  });

  describe('removeTagsFromBinaryDataByFilter tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'removeTagsFromBinaryDataByFilter')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, { getDeletedCount: () => 5 });
        });
    });

    it('remove tags to binary data', async () => {
      const expectedRequest = new RemoveTagsFromBinaryDataByFilterRequest();
      expectedRequest.setFilter(filter);
      expectedRequest.setTagsList(['tag1', 'tag2']);

      const promise = await subject().removeTagsFromBinaryDataByFilter(
        ['tag1', 'tag2'],
        filter
      );
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
      expect(promise).toEqual(5);
    });
  });

  describe('tagsByFilter tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'tagsByFilter')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, { getTagsList: () => ['tag1', 'tag2'] });
        });
    });

    it('get tags by filter', async () => {
      const expectedRequest = new TagsByFilterRequest();
      expectedRequest.setFilter(filter);

      const promise = await subject().tagsByFilter(filter);
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
      expect(promise).toEqual(['tag1', 'tag2']);
    });
  });

  describe('addBoundingBoxToImageById tests', () => {
    beforeEach(() => {
      vi.spyOn(DataServiceClient.prototype, 'addBoundingBoxToImageByID')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, { getBboxId: () => 'bboxId' });
        });
    });

    it('add bounding box to image', async () => {
      const promise = await subject().addBoundingBoxToImageById(
        binaryId1.toObject(),
        'label',
        1,
        1,
        0,
        0
      );
      expect(promise).toEqual('bboxId');
    });
  });

  describe('removeBoundingBoxFromImageById tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'removeBoundingBoxFromImageByID')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, {});
        });
    });

    it('remove bounding box from image', async () => {
      const expectedRequest = new RemoveBoundingBoxFromImageByIDRequest();
      expectedRequest.setBinaryId(binaryId1);
      expectedRequest.setBboxId('bboxId');

      await subject().removeBoundingBoxFromImageById(
        binaryId1.toObject(),
        'bboxId'
      );
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('boundingBoxLabelsByFilter tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'boundingBoxLabelsByFilter')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, { getLabelsList: () => ['label1', 'label2'] });
        });
    });

    it('get bounding box labels', async () => {
      const expectedRequest = new BoundingBoxLabelsByFilterRequest();
      expectedRequest.setFilter(filter);

      const promise = await subject().boundingBoxLabelsByFilter(filter);
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
      expect(promise).toEqual(['label1', 'label2']);
    });
  });

  describe('configureDatabaseUser tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'configureDatabaseUser')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, {});
        });
    });

    it('configure database user', async () => {
      const expectedRequest = new ConfigureDatabaseUserRequest();
      expectedRequest.setOrganizationId('orgId');
      expectedRequest.setPassword('password');

      await subject().configureDatabaseUser('orgId', 'password');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('getDatabaseConnection tests', () => {
    beforeEach(() => {
      vi.spyOn(DataServiceClient.prototype, 'getDatabaseConnection')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, { getHostname: () => 'hostname' });
        });
    });

    it('get database connection', async () => {
      const promise = await subject().getDatabaseConnection('orgId');
      expect(promise).toEqual('hostname');
    });
  });

  describe('addBinaryDataToDatasetByIds tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'addBinaryDataToDatasetByIDs')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, {});
        });
    });

    it('add binary data to dataset', async () => {
      const expectedRequest = new AddBinaryDataToDatasetByIDsRequest();
      expectedRequest.setBinaryIdsList([binaryId1, binaryId2]);
      expectedRequest.setDatasetId('datasetId');

      await subject().addBinaryDataToDatasetByIds(
        [binaryId1.toObject(), binaryId2.toObject()],
        'datasetId'
      );
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('removeBinaryDataFromDatasetByIds tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'removeBinaryDataFromDatasetByIDs')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, {});
        });
    });

    it('remove binary data from dataset', async () => {
      const expectedRequest = new RemoveBinaryDataFromDatasetByIDsRequest();
      expectedRequest.setBinaryIdsList([binaryId1, binaryId2]);
      expectedRequest.setDatasetId('datasetId');

      await subject().removeBinaryDataFromDatasetByIds(
        [binaryId1.toObject(), binaryId2.toObject()],
        'datasetId'
      );
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
