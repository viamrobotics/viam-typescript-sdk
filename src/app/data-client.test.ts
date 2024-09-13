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
  AddBoundingBoxToImageByIDRequest,
  GetDatabaseConnectionRequest,
} from '../gen/app/data/v1/data_pb';
import { DataServiceClient } from '../gen/app/data/v1/data_pb_service';
vi.mock('../gen/app/data/v1/data_pb_service');
import { DataClient } from './data-client';
import { DatasetServiceClient } from '../gen/app/dataset/v1/dataset_pb_service';
import {
  CreateDatasetRequest,
  Dataset,
  DeleteDatasetRequest,
  ListDatasetsByIDsRequest,
  ListDatasetsByOrganizationIDRequest,
  RenameDatasetRequest,
} from '../gen/app/dataset/v1/dataset_pb';
import { DataSyncServiceClient } from '../gen/app/datasync/v1/data_sync_pb_service';
import {
  DataCaptureUploadRequest,
  DataCaptureUploadResponse,
  DataType,
  SensorData,
  SensorMetadata,
  UploadMetadata,
} from '../gen/app/datasync/v1/data_sync_pb';

const subject = () =>
  new DataClient('fakeServiceHost', {
    transport: new FakeTransportBuilder().build(),
  });

describe('DataClient tests', () => {
  const filter = subject().createFilter({
    componentName: 'testComponentName',
    componentType: 'testComponentType',
  });

  const limit = 30;
  const lastId = 'lastId';
  const countOnly = true;
  const includeInternalData = false;

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
      const promise = await subject().tabularDataBySQL(
        'some_org_id',
        'some_sql_query'
      );
      expect(promise).toEqual(data);
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
      const promise = await subject().tabularDataByMQL('some_org_id', [
        new TextEncoder().encode('some_mql_query'),
      ]);
      expect(promise).toEqual(data);
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
    tabDataResponse.setCount(limit);
    tabDataResponse.setLast(lastId);

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
      const { data, count, last } = promise;
      expect(data.length).toEqual(2);
      expect(data[0]?.data).toMatchObject({ key: 'value1' });
      expect(data[1]?.data).toMatchObject({ key: 'value2' });
      expect(count).toEqual(count);
      expect(last).toEqual(lastId);
    });

    it('get filtered tabular data', async () => {
      const dataReq = new DataRequest();
      dataReq.setFilter(filter);
      dataReq.setLimit(limit);
      dataReq.setLast(lastId);
      const expectedRequest = new TabularDataByFilterRequest();
      expectedRequest.setDataRequest(dataReq);
      expectedRequest.setCountOnly(countOnly);
      expectedRequest.setIncludeInternalData(includeInternalData);

      await subject().tabularDataByFilter(
        filter,
        limit,
        undefined,
        lastId,
        countOnly,
        includeInternalData
      );
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
  binDataResponse.setCount(limit);
  binDataResponse.setLast(lastId);

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
      const { data, count, last } = promise;
      expect(data.length).toEqual(2);
      expect(data[0]?.binary).toEqual(bin1);
      expect(data[1]?.binary).toEqual(bin2);
      expect(count).toEqual(limit);
      expect(last).toEqual(lastId);
    });

    it('get filtered binary data', async () => {
      const dataReq = new DataRequest();
      dataReq.setFilter(filter);
      dataReq.setLimit(limit);
      dataReq.setLast(lastId);
      const expectedRequest = new BinaryDataByFilterRequest();
      expectedRequest.setDataRequest(dataReq);
      expectedRequest.setIncludeBinary(true);
      expectedRequest.setCountOnly(countOnly);
      expectedRequest.setIncludeInternalData(includeInternalData);

      await subject().binaryDataByFilter(
        filter,
        limit,
        undefined,
        lastId,
        true,
        countOnly,
        false
      );
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
        includeInternalData
      );
      expect(promise).toEqual(10);
    });

    it('delete filtered binary data', async () => {
      const expectedRequest = new DeleteBinaryDataByFilterRequest();
      expectedRequest.setFilter(filter);
      expectedRequest.setIncludeInternalData(true);

      const promise = await subject().deleteBinaryDataByFilter(filter);
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
      expect(promise).toEqual(20);
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
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'addBoundingBoxToImageByID')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, { getBboxId: () => 'bboxId' });
        });
    });

    it('add bounding box to image', async () => {
      const expectedRequest = new AddBoundingBoxToImageByIDRequest();
      expectedRequest.setBinaryId(binaryId1);
      expectedRequest.setLabel('label');
      expectedRequest.setXMinNormalized(0);
      expectedRequest.setYMinNormalized(0);
      expectedRequest.setYMaxNormalized(1);
      expectedRequest.setXMaxNormalized(1);

      const promise = await subject().addBoundingBoxToImageById(
        binaryId1.toObject(),
        'label',
        0,
        0,
        1,
        1
      );
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
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
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataServiceClient.prototype, 'getDatabaseConnection')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, { getHostname: () => 'hostname' });
        });
    });

    it('get database connection', async () => {
      const expectedRequest = new GetDatabaseConnectionRequest();
      expectedRequest.setOrganizationId('orgId');

      const promise = await subject().getDatabaseConnection('orgId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
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

describe('DatasetClient tests', () => {
  const dataset1 = new Dataset();
  dataset1.setId('id1');
  dataset1.setName('name1');
  dataset1.setOrganizationId('orgId1');
  const created1 = new Date(1, 1, 1, 1, 1, 1);
  dataset1.setTimeCreated(Timestamp.fromDate(created1));
  const dataset2 = new Dataset();
  dataset2.setId('id2');
  dataset2.setName('name2');
  dataset2.setOrganizationId('orgId2');
  const created2 = new Date(2, 2, 2, 2, 2, 2);
  dataset2.setTimeCreated(Timestamp.fromDate(created2));
  const datasets = [dataset1, dataset2];
  const datasetIds = ['dataset1', 'dataset2'];

  describe('createDataset tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DatasetServiceClient.prototype, 'createDataset')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, { getId: () => 'id' });
        });
    });

    it('create dataset', async () => {
      const expectedRequest = new CreateDatasetRequest();
      expectedRequest.setName('name');
      expectedRequest.setOrganizationId('orgId');

      const promise = await subject().createDataset('name', 'orgId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
      expect(promise).toEqual('id');
    });
  });

  describe('deleteDataset tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DatasetServiceClient.prototype, 'deleteDataset')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, {});
        });
    });

    it('delete dataset', async () => {
      const expectedRequest = new DeleteDatasetRequest();
      expectedRequest.setId('id');

      await subject().deleteDataset('id');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('renameDataset tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DatasetServiceClient.prototype, 'renameDataset')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, {});
        });
    });

    it('rename dataset', async () => {
      const expectedRequest = new RenameDatasetRequest();
      expectedRequest.setId('id');
      expectedRequest.setName('name');

      await subject().renameDataset('id', 'name');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('listDatasetsByOrganizationID tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DatasetServiceClient.prototype, 'listDatasetsByOrganizationID')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, { getDatasetsList: () => datasets });
        });
    });

    it('list datasets by organization ID', async () => {
      const expectedRequest = new ListDatasetsByOrganizationIDRequest();
      expectedRequest.setOrganizationId('orgId');

      const promise = await subject().listDatasetsByOrganizationID('orgId');
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
      expect(promise.length).toEqual(2);
      const [set1, set2] = promise;
      expect(set1?.id).toEqual('id1');
      expect(set1?.name).toEqual('name1');
      expect(set1?.organizationId).toEqual('orgId1');
      expect(set1?.created).toEqual(dataset1.getTimeCreated()?.toDate());
      expect(set2?.id).toEqual('id2');
      expect(set2?.name).toEqual('name2');
      expect(set2?.organizationId).toEqual('orgId2');
      expect(set2?.created).toEqual(dataset2.getTimeCreated()?.toDate());
    });
  });

  describe('listDatasetsByIDs tests', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DatasetServiceClient.prototype, 'listDatasetsByIDs')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req, _md, cb) => {
          cb(null, { getDatasetsList: () => datasets });
        });
    });

    it('list datasets by organization ID', async () => {
      const expectedRequest = new ListDatasetsByIDsRequest();
      expectedRequest.setIdsList(datasetIds);

      const promise = await subject().listDatasetsByIds(datasetIds);
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
      expect(promise.length).toEqual(2);
      const [set1, set2] = promise;
      expect(set1?.id).toEqual('id1');
      expect(set1?.name).toEqual('name1');
      expect(set1?.organizationId).toEqual('orgId1');
      expect(set1?.created).toEqual(dataset1.getTimeCreated()?.toDate());
      expect(set2?.id).toEqual('id2');
      expect(set2?.name).toEqual('name2');
      expect(set2?.organizationId).toEqual('orgId2');
      expect(set2?.created).toEqual(dataset2.getTimeCreated()?.toDate());
    });
  });
});

describe('DataSyncClient tests', () => {
  const partId = 'testPartId';
  const componentType = 'testComponentType';
  const componentName = 'testComponentName';
  const methodName = 'testMethodName';
  const fileExtension = '.png';
  const tags = ['testTag1', 'testTag2'];
  const timeRequested1 = new Date(1, 1, 1, 1, 1, 1);
  const timeReceived1 = new Date(2, 2, 2, 2, 2, 2);
  const dataRequestTimes1: [Date, Date] = [timeRequested1, timeReceived1];
  const timeRequested2 = new Date(3, 3, 3, 3, 3, 3);
  const timeReceived2 = new Date(4, 4, 4, 4, 4, 4);
  const dataRequestTimes2: [Date, Date] = [timeRequested2, timeReceived2];
  const tabularData1 = { key1: 1, key2: '2' };
  const tabularData2 = { key3: [1, 2, 3], key4: { key4sub1: 1 } };
  const binaryData = new Uint8Array([1, 2]);

  const expectedRequest = new DataCaptureUploadRequest();
  const metadata = new UploadMetadata();
  metadata.setPartId(partId);
  metadata.setComponentType(componentType);
  metadata.setComponentName(componentName);
  metadata.setMethodName(methodName);
  metadata.setTagsList(tags);

  describe('tabularDataCaptureUpload', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataSyncServiceClient.prototype, 'dataCaptureUpload')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req: DataCaptureUploadRequest, _md, cb) => {
          const response = new DataCaptureUploadResponse();
          response.setFileId('fileId');
          cb(null, response);
        });
    });

    it('tabular data capture upload', async () => {
      metadata.setType(DataType.DATA_TYPE_TABULAR_SENSOR);
      expectedRequest.setMetadata(metadata);
      const sensorData1 = new SensorData();
      const sensorMetadata1 = new SensorMetadata();
      sensorMetadata1.setTimeRequested(Timestamp.fromDate(timeRequested1));
      sensorMetadata1.setTimeReceived(Timestamp.fromDate(timeReceived1));
      sensorData1.setMetadata(sensorMetadata1);
      sensorData1.setStruct(Struct.fromJavaScript(tabularData1));
      const sensorData2 = new SensorData();
      const sensorMetadata2 = new SensorMetadata();
      sensorMetadata2.setTimeRequested(Timestamp.fromDate(timeRequested2));
      sensorMetadata2.setTimeReceived(Timestamp.fromDate(timeReceived2));
      sensorData2.setMetadata(sensorMetadata2);
      sensorData2.setStruct(Struct.fromJavaScript(tabularData2));
      expectedRequest.setSensorContentsList([sensorData1, sensorData2]);

      const response = await subject().tabularDataCaptureUpload(
        [tabularData1, tabularData2],
        partId,
        componentType,
        componentName,
        methodName,
        [dataRequestTimes1, dataRequestTimes2],
        tags
      );
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
      expect(response).toStrictEqual('fileId');
    });
  });

  describe('binaryDataCaptureUpload', () => {
    let methodSpy: MockInstance;
    beforeEach(() => {
      methodSpy = vi
        .spyOn(DataSyncServiceClient.prototype, 'dataCaptureUpload')
        // @ts-expect-error compiler is matching incorrect function signature
        .mockImplementation((_req: DataCaptureUploadRequest, _md, cb) => {
          const response = new DataCaptureUploadResponse();
          response.setFileId('fileId');
          cb(null, response);
        });
    });

    it('binary data capture upload', async () => {
      metadata.setType(DataType.DATA_TYPE_BINARY_SENSOR);
      metadata.setFileExtension(fileExtension);
      expectedRequest.setMetadata(metadata);
      const sensorData = new SensorData();
      const sensorMetadata = new SensorMetadata();
      sensorMetadata.setTimeRequested(Timestamp.fromDate(timeRequested1));
      sensorMetadata.setTimeReceived(Timestamp.fromDate(timeReceived1));
      sensorData.setMetadata(sensorMetadata);
      sensorData.setBinary(binaryData);
      expectedRequest.setSensorContentsList([sensorData]);

      const response = await subject().binaryDataCaptureUpload(
        binaryData,
        partId,
        componentType,
        componentName,
        methodName,
        fileExtension,
        dataRequestTimes1,
        tags
      );
      expect(methodSpy).toHaveBeenCalledWith(
        expectedRequest,
        expect.anything(),
        expect.anything()
      );
      expect(response).toStrictEqual('fileId');
    });
  });
});
