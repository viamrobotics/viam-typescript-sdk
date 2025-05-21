import { BSON } from 'bsonfy';
import { Struct, Timestamp, type JsonValue } from '@bufbuild/protobuf';
import { createRouterTransport, type Transport } from '@connectrpc/connect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataService } from '../gen/app/data/v1/data_connect';
import {
  AddBinaryDataToDatasetByIDsRequest,
  AddBinaryDataToDatasetByIDsResponse,
  AddBoundingBoxToImageByIDRequest,
  AddBoundingBoxToImageByIDResponse,
  AddTagsToBinaryDataByFilterRequest,
  AddTagsToBinaryDataByFilterResponse,
  AddTagsToBinaryDataByIDsRequest,
  AddTagsToBinaryDataByIDsResponse,
  BinaryData,
  BinaryDataByFilterRequest,
  BinaryDataByFilterResponse,
  BinaryDataByIDsRequest,
  BinaryDataByIDsResponse,
  BinaryID,
  BoundingBoxLabelsByFilterRequest,
  BoundingBoxLabelsByFilterResponse,
  CaptureInterval,
  ConfigureDatabaseUserRequest,
  ConfigureDatabaseUserResponse,
  DataRequest,
  DeleteBinaryDataByFilterRequest,
  DeleteBinaryDataByFilterResponse,
  DeleteBinaryDataByIDsResponse,
  DeleteTabularDataResponse,
  ExportTabularDataRequest,
  ExportTabularDataResponse,
  Filter,
  GetDatabaseConnectionRequest,
  GetDatabaseConnectionResponse,
  RemoveBinaryDataFromDatasetByIDsRequest,
  RemoveBinaryDataFromDatasetByIDsResponse,
  RemoveBoundingBoxFromImageByIDRequest,
  RemoveBoundingBoxFromImageByIDResponse,
  RemoveTagsFromBinaryDataByFilterRequest,
  RemoveTagsFromBinaryDataByFilterResponse,
  RemoveTagsFromBinaryDataByIDsRequest,
  RemoveTagsFromBinaryDataByIDsResponse,
  TabularData,
  TabularDataByFilterRequest,
  TabularDataByFilterResponse,
  TabularDataByMQLResponse,
  TabularDataBySQLResponse,
  TagsByFilterRequest,
  TagsByFilterResponse,
  TagsFilter,
  GetLatestTabularDataRequest,
  GetLatestTabularDataResponse,
} from '../gen/app/data/v1/data_pb';
import { DatasetService } from '../gen/app/dataset/v1/dataset_connect';
import {
  CreateDatasetRequest,
  CreateDatasetResponse,
  Dataset,
  DeleteDatasetRequest,
  DeleteDatasetResponse,
  ListDatasetsByIDsRequest,
  ListDatasetsByIDsResponse,
  ListDatasetsByOrganizationIDRequest,
  ListDatasetsByOrganizationIDResponse,
  RenameDatasetRequest,
  RenameDatasetResponse,
} from '../gen/app/dataset/v1/dataset_pb';
import { DataSyncService } from '../gen/app/datasync/v1/data_sync_connect';
import {
  DataCaptureUploadRequest,
  DataCaptureUploadResponse,
  DataType,
  SensorData,
  SensorMetadata,
  UploadMetadata,
} from '../gen/app/datasync/v1/data_sync_pb';
import { DataClient, type FilterOptions } from './data-client';
import {
  DataPipeline,
  ListDataPipelinesRequest,
  ListDataPipelinesResponse,
  GetDataPipelineRequest,
  GetDataPipelineResponse,
  CreateDataPipelineRequest,
  CreateDataPipelineResponse,
  DeleteDataPipelineRequest,
  DeleteDataPipelineResponse,
  DataPipelineRun,
  DataPipelineRunStatus,
  ListDataPipelineRunsRequest,
  ListDataPipelineRunsResponse,
} from '../gen/app/datapipelines/v1/data_pipelines_pb';
import { DataPipelinesService } from '../gen/app/datapipelines/v1/data_pipelines_connect';
vi.mock('../gen/app/data/v1/data_pb_service');

let mockTransport: Transport;
const subject = () => new DataClient(mockTransport);

describe('DataClient tests', () => {
  const filter = subject().createFilter({
    componentName: 'testComponentName',
    componentType: 'testComponentType',
  });

  const limit = 30;
  const lastId = 'lastId';
  const countOnly = true;
  const includeInternalData = false;
  const startDate = new Date(1, 1, 1, 1, 1, 1);

  const binaryId1 = new BinaryID({
    fileId: 'testFileId1',
    organizationId: 'testOrgId',
    locationId: 'testLocationId',
  });
  const binaryId2 = new BinaryID({
    fileId: 'testFileId1',
    organizationId: 'testOrgId',
    locationId: 'testLocationId',
  });

  const binaryDataId1 = 'testID1';
  const binaryDataId2 = 'testID2';
  describe('exportTabularData tests', () => {
    const sharedAttributes = {
      partId: 'partId1',
      resourceName: 'resource1',
      resourceSubtype: 'resource1:subtype',
      methodName: 'Readings',
      organizationId: 'orgId1',
      locationId: 'locationId1',
      robotName: 'robot1',
      robotId: 'robotId1',
      partName: 'part1',
      tags: [],
    };
    const timeCaptured1 = new Date(2024, 1, 1);
    const timeCaptured2 = new Date(2024, 1, 2);
    const tabDataResponse1 = new ExportTabularDataResponse({
      ...sharedAttributes,
      methodParameters: Struct.fromJson({ key: 'param1' }),
      timeCaptured: Timestamp.fromDate(timeCaptured1),
      payload: Struct.fromJson({ key: 'value1' }),
    });
    const tabDataResponse2 = new ExportTabularDataResponse({
      ...sharedAttributes,
      methodParameters: Struct.fromJson({ key: 'param2' }),
      timeCaptured: Timestamp.fromDate(timeCaptured2),
      payload: Struct.fromJson({ key: 'value2' }),
    });

    let capReq: ExportTabularDataRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          exportTabularData: (req) => ({
            [Symbol.asyncIterator]: async function* generateResponses() {
              await Promise.resolve();
              capReq = req;
              yield tabDataResponse1;
              yield tabDataResponse2;
            },
          }),
        });
      });
    });

    it('gets tabular data', async () => {
      const data = await subject().exportTabularData(
        'partId1',
        'resource1',
        'resource1:subtype',
        'Readings'
      );

      expect(data.length).toEqual(2);

      const expectedResponse1 = {
        ...sharedAttributes,
        methodParameters: { key: 'param1' },
        timeCaptured: timeCaptured1,
        payload: { key: 'value1' },
      };
      const expectedResponse2 = {
        ...sharedAttributes,
        methodParameters: { key: 'param2' },
        timeCaptured: timeCaptured2,
        payload: { key: 'value2' },
      };

      expect(data[0]).toMatchObject(expectedResponse1);
      expect(data[1]).toMatchObject(expectedResponse2);
    });

    it('gets tabular data for an interval', async () => {
      await subject().exportTabularData(
        'partId1',
        'resource1',
        'resource1:subtype',
        'Readings',
        timeCaptured1,
        timeCaptured2
      );

      const expectedRequest = new ExportTabularDataRequest({
        partId: 'partId1',
        resourceName: 'resource1',
        resourceSubtype: 'resource1:subtype',
        methodName: 'Readings',
        interval: {
          start: Timestamp.fromDate(timeCaptured1),
          end: Timestamp.fromDate(timeCaptured2),
        },
      });

      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('tabularDataBySQL tests', () => {
    type returnType = JsonValue | Date;
    const data: Record<string, returnType>[] = [
      { key1: startDate, key2: '2', key3: [1, 2, 3], key4: { key4sub1: 1 } },
    ];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          tabularDataBySQL: () => {
            return new TabularDataBySQLResponse({
              rawData: data.map((x) => BSON.serialize(x)),
            });
          },
        });
      });
    });

    it('get tabular data from SQL', async () => {
      const promise = await subject().tabularDataBySQL(
        'some_org_id',
        'some_sql_query'
      );
      const result = promise as typeof data;
      expect(result[0]?.key1).toBeInstanceOf(Date);
      expect(promise).toEqual(data);
    });
  });

  describe('tabularDataByMQL tests', () => {
    type returnType = JsonValue | Date;
    const data: Record<string, returnType>[] = [
      { key1: startDate, key2: '2', key3: [1, 2, 3], key4: { key4sub1: 1 } },
    ];

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          tabularDataByMQL: () => {
            return new TabularDataByMQLResponse({
              rawData: data.map((x) => BSON.serialize(x)),
            });
          },
        });
      });
    });

    it('get tabular data from MQL', async () => {
      const promise = await subject().tabularDataByMQL('some_org_id', [
        { query: 'some_mql_query' },
      ]);
      const result = promise as typeof data;
      expect(result[0]?.key1).toBeInstanceOf(Date);
      expect(promise).toEqual(data);
    });

    it('get tabular data from MQL with useRecentData = true', async () => {
      const promise = await subject().tabularDataByMQL(
        'some_org_id',
        [{ query: 'some_mql_query' }],
        true
      );
      const result = promise as typeof data;
      expect(result[0]?.key1).toBeInstanceOf(Date);
      expect(promise).toEqual(data);
    });
  });

  describe('tabularDataByFilter tests', () => {
    const tabData1 = new TabularData({
      data: Struct.fromJson({ key: 'value1' }),
    });
    const tabData2 = new TabularData({
      data: Struct.fromJson({ key: 'value2' }),
    });
    const tabDataResponse = new TabularDataByFilterResponse({
      data: [tabData1, tabData2],
      count: BigInt(limit),
      last: lastId,
    });

    let capReq: TabularDataByFilterRequest;
    beforeEach(() => {
      let once = false;
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          tabularDataByFilter: (req) => {
            capReq = req;
            if (!once) {
              once = true;
              return tabDataResponse;
            }
            return new TabularDataByFilterResponse();
          },
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
      const dataReq = new DataRequest({
        filter,
        limit: BigInt(limit),
        last: lastId,
      });
      const expectedRequest = new TabularDataByFilterRequest({
        dataRequest: dataReq,
        countOnly,
        includeInternalData,
      });

      await subject().tabularDataByFilter(
        filter,
        limit,
        undefined,
        lastId,
        countOnly,
        includeInternalData
      );
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  const bin1 = new Uint8Array([1, 2, 3]);
  const bin2 = new Uint8Array([4, 5, 6]);
  const binData1 = new BinaryData({
    binary: new Uint8Array(bin1),
  });
  const binData2 = new BinaryData({
    binary: bin2,
  });
  const binDataResponse = new BinaryDataByFilterResponse({
    data: [binData1, binData2],
    count: BigInt(limit),
    last: lastId,
  });

  describe('binaryDataByFilter tests', () => {
    let capReq: BinaryDataByFilterRequest;
    beforeEach(() => {
      let once = false;
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          binaryDataByFilter: (req) => {
            capReq = req;
            if (!once) {
              once = true;
              return binDataResponse;
            }
            return new BinaryDataByFilterResponse();
          },
        });
      });
    });
    it('get binary data', async () => {
      const promise = await subject().binaryDataByFilter();
      const { data, count, last } = promise;
      expect(data.length).toEqual(2);
      expect(data[0]?.binary).toEqual(bin1);
      expect(data[1]?.binary).toEqual(bin2);
      expect(count).toEqual(BigInt(limit));
      expect(last).toEqual(lastId);
    });

    it('get filtered binary data', async () => {
      const dataReq = new DataRequest({
        filter,
        limit: BigInt(limit),
        last: lastId,
      });
      const expectedRequest = new BinaryDataByFilterRequest({
        dataRequest: dataReq,
        includeBinary: true,
        countOnly,
        includeInternalData,
      });

      await subject().binaryDataByFilter(
        filter,
        limit,
        undefined,
        lastId,
        true,
        countOnly,
        false
      );
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  const binDataByIdsResponse = new BinaryDataByIDsResponse({
    data: [binData1, binData2],
    count: BigInt(limit),
  });

  describe('binaryDataById tests', () => {
    let capReq: BinaryDataByIDsRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          binaryDataByIDs: (req) => {
            capReq = req;
            return binDataByIdsResponse;
          },
        });
      });
    });

    it('get binary data by binary data ids', async () => {
      const promise = await subject().binaryDataByIds([
        binaryDataId1,
        binaryDataId2,
      ]);
      expect(promise.length).toEqual(2);
      expect(promise[0]?.binary).toEqual(bin1);
      expect(promise[1]?.binary).toEqual(bin2);
    });

    it('get binary data by ids', async () => {
      const promise = await subject().binaryDataByIds([binaryId1, binaryId2]);
      expect(promise.length).toEqual(2);
      expect(promise[0]?.binary).toEqual(bin1);
      expect(promise[1]?.binary).toEqual(bin2);
    });

    it('get binary data by binary data id', async () => {
      const expectedRequest = new BinaryDataByIDsRequest({
        binaryDataIds: [binaryDataId1],
        includeBinary: true,
      });

      await subject().binaryDataByIds([binaryDataId1]);
      expect(capReq).toStrictEqual(expectedRequest);
    });

    it('get binary data by id', async () => {
      const expectedRequest = new BinaryDataByIDsRequest({
        binaryIds: [binaryId1],
        includeBinary: true,
      });

      await subject().binaryDataByIds([binaryId1]);
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('deleteTabularData tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          deleteTabularData: (req) => {
            const response = new DeleteTabularDataResponse();
            response.deletedCount =
              req.deleteOlderThanDays >= 10 ? BigInt(10) : BigInt(5);
            return response;
          },
        });
      });
    });

    it('delete tabular data', async () => {
      const promise = await subject().deleteTabularData('orgId', 20);
      expect(promise).toEqual(10n);
    });

    it('delete newer tabular data', async () => {
      const promise = await subject().deleteTabularData('orgId', 5);
      expect(promise).toEqual(5n);
    });
  });

  describe('deleteBinaryDataByFilter tests', () => {
    let capReq: DeleteBinaryDataByFilterRequest;
    beforeEach(() => {
      let once = false;
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          deleteBinaryDataByFilter: (req) => {
            capReq = req;
            if (!once) {
              once = true;
              const response = new DeleteBinaryDataByFilterResponse();
              response.deletedCount = req.includeInternalData
                ? BigInt(20)
                : BigInt(10);
              return response;
            }
            return new DeleteBinaryDataByFilterResponse({
              deletedCount: BigInt(10),
            });
          },
        });
      });
    });

    it('delete binary data', async () => {
      const promise = await subject().deleteBinaryDataByFilter();
      expect(promise).toEqual(20n);
    });

    it('do not delete internal binary data', async () => {
      const promise = await subject().deleteBinaryDataByFilter(
        undefined,
        includeInternalData
      );
      expect(promise).toEqual(10n);
    });

    it('delete filtered binary data', async () => {
      const expectedRequest = new DeleteBinaryDataByFilterRequest({
        filter,
        includeInternalData: true,
      });

      const promise = await subject().deleteBinaryDataByFilter(filter);
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise).toEqual(20n);
    });
  });

  describe('deleteBinaryDataByIds tests', () => {
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          deleteBinaryDataByIDs: (req) => {
            return new DeleteBinaryDataByIDsResponse({
              deletedCount: BigInt(
                Math.max(req.binaryDataIds.length, req.binaryIds.length)
              ),
            });
          },
        });
      });
    });

    it('delete binary data by binary data ids', async () => {
      const promise1 = await subject().deleteBinaryDataByIds([binaryDataId1]);
      expect(promise1).toEqual(1n);

      const promise2 = await subject().deleteBinaryDataByIds([
        binaryDataId1,
        binaryDataId2,
      ]);
      expect(promise2).toEqual(2n);
    });

    it('delete binary data by ids', async () => {
      const promise1 = await subject().deleteBinaryDataByIds([binaryId1]);
      expect(promise1).toEqual(1n);

      const promise2 = await subject().deleteBinaryDataByIds([
        binaryId1,
        binaryId2,
      ]);
      expect(promise2).toEqual(2n);
    });
  });

  describe('addTagsToBinaryDataByIds tests', () => {
    let capReq: AddTagsToBinaryDataByIDsRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          addTagsToBinaryDataByIDs: (req) => {
            capReq = req;
            return new AddTagsToBinaryDataByIDsResponse();
          },
        });
      });
    });

    it('add tags to binary data by binary data ids', async () => {
      const expectedRequest = new AddTagsToBinaryDataByIDsRequest({
        binaryDataIds: [binaryDataId1, binaryDataId2],
        tags: ['tag1', 'tag2'],
      });

      await subject().addTagsToBinaryDataByIds(
        ['tag1', 'tag2'],
        [binaryDataId1, binaryDataId2]
      );
      expect(capReq).toStrictEqual(expectedRequest);
    });

    it('add tags to binary data', async () => {
      const expectedRequest = new AddTagsToBinaryDataByIDsRequest({
        binaryIds: [binaryId1, binaryId2],
        tags: ['tag1', 'tag2'],
      });

      await subject().addTagsToBinaryDataByIds(
        ['tag1', 'tag2'],
        [binaryId1, binaryId2]
      );
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('addTagsToBinaryDataByFilter tests', () => {
    let capReq: AddTagsToBinaryDataByFilterRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          addTagsToBinaryDataByFilter: (req) => {
            capReq = req;
            return new AddTagsToBinaryDataByFilterResponse();
          },
        });
      });
    });

    it('add tags to binary data', async () => {
      const expectedRequest = new AddTagsToBinaryDataByFilterRequest({
        filter,
        tags: ['tag1', 'tag2'],
      });

      await subject().addTagsToBinaryDataByFilter(['tag1', 'tag2'], filter);
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('removeTagsFromBinaryDataByIds tests', () => {
    let capReq: RemoveTagsFromBinaryDataByIDsRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          removeTagsFromBinaryDataByIDs: (req) => {
            capReq = req;
            return new RemoveTagsFromBinaryDataByIDsResponse({
              deletedCount: BigInt(2),
            });
          },
        });
      });
    });

    it('remove tags to binary data by binary data ids', async () => {
      const expectedRequest = new RemoveTagsFromBinaryDataByIDsRequest({
        binaryDataIds: [binaryDataId1, binaryDataId2],
        tags: ['tag1', 'tag2'],
      });

      const promise = await subject().removeTagsFromBinaryDataByIds(
        ['tag1', 'tag2'],
        [binaryDataId1, binaryDataId2]
      );
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise).toEqual(2n);
    });

    it('remove tags to binary data by ids', async () => {
      const expectedRequest = new RemoveTagsFromBinaryDataByIDsRequest({
        binaryIds: [binaryId1, binaryId2],
        tags: ['tag1', 'tag2'],
      });

      const promise = await subject().removeTagsFromBinaryDataByIds(
        ['tag1', 'tag2'],
        [binaryId1, binaryId2]
      );
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise).toEqual(2n);
    });
  });

  describe('removeTagsFromBinaryDataByFilter tests', () => {
    let capReq: RemoveTagsFromBinaryDataByFilterRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          removeTagsFromBinaryDataByFilter: (req) => {
            capReq = req;
            return new RemoveTagsFromBinaryDataByFilterResponse({
              deletedCount: BigInt(5),
            });
          },
        });
      });
    });

    it('remove tags to binary data', async () => {
      const expectedRequest = new RemoveTagsFromBinaryDataByFilterRequest({
        filter,
        tags: ['tag1', 'tag2'],
      });

      const promise = await subject().removeTagsFromBinaryDataByFilter(
        ['tag1', 'tag2'],
        filter
      );
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise).toEqual(5n);
    });
  });

  describe('tagsByFilter tests', () => {
    let capReq: TagsByFilterRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          tagsByFilter: (req) => {
            capReq = req;
            return new TagsByFilterResponse({
              tags: ['tag1', 'tag2'],
            });
          },
        });
      });
    });

    it('get tags by filter', async () => {
      const expectedRequest = new TagsByFilterRequest({
        filter,
      });

      const promise = await subject().tagsByFilter(filter);
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise).toEqual(['tag1', 'tag2']);
    });
  });

  describe('addBoundingBoxToImageById tests', () => {
    let capReq: AddBoundingBoxToImageByIDRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          addBoundingBoxToImageByID: (req) => {
            capReq = req;
            return new AddBoundingBoxToImageByIDResponse({
              bboxId: 'bboxId',
            });
          },
        });
      });
    });

    it('add bounding box to image by binary data id', async () => {
      const expectedRequest = new AddBoundingBoxToImageByIDRequest({
        binaryDataId: binaryDataId1,
        label: 'label',
        xMinNormalized: 0,
        yMinNormalized: 0,
        yMaxNormalized: 1,
        xMaxNormalized: 1,
      });

      const promise = await subject().addBoundingBoxToImageById(
        binaryDataId1,
        'label',
        0,
        0,
        1,
        1
      );
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise).toEqual('bboxId');
    });

    it('add bounding box to image by id', async () => {
      const expectedRequest = new AddBoundingBoxToImageByIDRequest({
        binaryId: binaryId1,
        label: 'label',
        xMinNormalized: 0,
        yMinNormalized: 0,
        yMaxNormalized: 1,
        xMaxNormalized: 1,
      });

      const promise = await subject().addBoundingBoxToImageById(
        binaryId1,
        'label',
        0,
        0,
        1,
        1
      );
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise).toEqual('bboxId');
    });
  });

  describe('removeBoundingBoxFromImageById tests', () => {
    let capReq: RemoveBoundingBoxFromImageByIDRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          removeBoundingBoxFromImageByID: (req) => {
            capReq = req;
            return new RemoveBoundingBoxFromImageByIDResponse();
          },
        });
      });
    });

    it('remove bounding box from image by binary data id', async () => {
      const expectedRequest = new RemoveBoundingBoxFromImageByIDRequest({
        binaryDataId: binaryDataId1,
        bboxId: 'bboxId',
      });

      await subject().removeBoundingBoxFromImageById(binaryDataId1, 'bboxId');
      expect(capReq).toStrictEqual(expectedRequest);
    });

    it('remove bounding box from image by id', async () => {
      const expectedRequest = new RemoveBoundingBoxFromImageByIDRequest({
        binaryId: binaryId1,
        bboxId: 'bboxId',
      });

      await subject().removeBoundingBoxFromImageById(binaryId1, 'bboxId');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('boundingBoxLabelsByFilter tests', () => {
    let capReq: BoundingBoxLabelsByFilterRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          boundingBoxLabelsByFilter: (req) => {
            capReq = req;
            return new BoundingBoxLabelsByFilterResponse({
              labels: ['label1', 'label2'],
            });
          },
        });
      });
    });

    it('get bounding box labels', async () => {
      const expectedRequest = new BoundingBoxLabelsByFilterRequest({
        filter,
      });

      const promise = await subject().boundingBoxLabelsByFilter(filter);
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise).toEqual(['label1', 'label2']);
    });
  });

  describe('configureDatabaseUser tests', () => {
    let capReq: ConfigureDatabaseUserRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          configureDatabaseUser: (req) => {
            capReq = req;
            return new ConfigureDatabaseUserResponse();
          },
        });
      });
    });

    it('configure database user', async () => {
      const expectedRequest = new ConfigureDatabaseUserRequest({
        organizationId: 'orgId',
        password: 'password',
      });

      await subject().configureDatabaseUser('orgId', 'password');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('getDatabaseConnection tests', () => {
    let capReq: GetDatabaseConnectionRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          getDatabaseConnection: (req) => {
            capReq = req;
            return new GetDatabaseConnectionResponse({
              hostname: 'hostname',
            });
          },
        });
      });
    });

    it('get database connection', async () => {
      const expectedRequest = new GetDatabaseConnectionRequest({
        organizationId: 'orgId',
      });

      const promise = await subject().getDatabaseConnection('orgId');
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise).toEqual('hostname');
    });
  });

  describe('addBinaryDataToDatasetByIds tests', () => {
    let capReq: AddBinaryDataToDatasetByIDsRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          addBinaryDataToDatasetByIDs: (req) => {
            capReq = req;
            return new AddBinaryDataToDatasetByIDsResponse();
          },
        });
      });
    });

    it('add binary data to dataset by binary data ids', async () => {
      const expectedRequest = new AddBinaryDataToDatasetByIDsRequest({
        binaryDataIds: [binaryDataId1, binaryDataId2],
        datasetId: 'datasetId',
      });

      await subject().addBinaryDataToDatasetByIds(
        [binaryDataId1, binaryDataId2],
        'datasetId'
      );
      expect(capReq).toStrictEqual(expectedRequest);
    });

    it('add binary data to dataset by ids', async () => {
      const expectedRequest = new AddBinaryDataToDatasetByIDsRequest({
        binaryIds: [binaryId1, binaryId2],
        datasetId: 'datasetId',
      });

      await subject().addBinaryDataToDatasetByIds(
        [binaryId1, binaryId2],
        'datasetId'
      );
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('removeBinaryDataFromDatasetByIds tests', () => {
    let capReq: RemoveBinaryDataFromDatasetByIDsRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          removeBinaryDataFromDatasetByIDs: (req) => {
            capReq = req;
            return new RemoveBinaryDataFromDatasetByIDsResponse();
          },
        });
      });
    });

    it('remove binary data from dataset by binary data ids', async () => {
      const expectedRequest = new RemoveBinaryDataFromDatasetByIDsRequest({
        binaryDataIds: [binaryDataId1, binaryDataId2],
        datasetId: 'datasetId',
      });

      await subject().removeBinaryDataFromDatasetByIds(
        [binaryDataId1, binaryDataId2],
        'datasetId'
      );
      expect(capReq).toStrictEqual(expectedRequest);
    });

    it('remove binary data from dataset by ids', async () => {
      const expectedRequest = new RemoveBinaryDataFromDatasetByIDsRequest({
        binaryIds: [binaryId1, binaryId2],
        datasetId: 'datasetId',
      });

      await subject().removeBinaryDataFromDatasetByIds(
        [binaryId1, binaryId2],
        'datasetId'
      );
      expect(capReq).toStrictEqual(expectedRequest);
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

      const expectedFilter = new Filter({
        componentName: 'camera',
      });

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
      const interval = new CaptureInterval({
        start: Timestamp.fromDate(startTime),
        end: Timestamp.fromDate(endTime),
      });
      const tagsList = ['testTag1', 'testTag2'];
      const tagsFilter = new TagsFilter({
        tags: tagsList,
      });

      const opts: FilterOptions = {
        componentName,
        componentType,
        method,
        robotName,
        robotId,
        partName,
        partId,
        locationIds: locationsIdsList,
        organizationIds: organizationIdsList,
        mimeType: mimeTypeList,
        bboxLabels: bboxLabelsList,
        startTime,
        endTime,
        tags: tagsList,
      };
      const testFilter = subject().createFilter(opts);
      expect(testFilter.componentType).toEqual('testComponentType');

      const expectedFilter = new Filter({
        componentName,
        componentType,
        method,
        robotName,
        robotId,
        partName,
        partId,
        locationIds: locationsIdsList,
        organizationIds: organizationIdsList,
        mimeType: mimeTypeList,
        bboxLabels: bboxLabelsList,
        interval,
        tagsFilter,
      });

      expect(testFilter).toEqual(expectedFilter);
    });
  });

  describe('getLatestTabularData tests', () => {
    const timeCaptured = new Date(2024, 1, 1);
    const timeSynced = new Date(2024, 1, 2);
    const payload = { key: 'value' };

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          getLatestTabularData: (req) => {
            capReq = req;
            return new GetLatestTabularDataResponse({
              timeCaptured: Timestamp.fromDate(timeCaptured),
              timeSynced: Timestamp.fromDate(timeSynced),
              payload: Struct.fromJson(payload),
            });
          },
        });
      });
    });

    let capReq: GetLatestTabularDataRequest;

    it('get latest tabular data', async () => {
      const expectedRequest = new GetLatestTabularDataRequest({
        partId: 'testPartId',
        resourceName: 'testResource',
        resourceSubtype: 'testSubtype',
        methodName: 'testMethod',
      });

      const result = await subject().getLatestTabularData(
        'testPartId',
        'testResource',
        'testSubtype',
        'testMethod'
      );

      expect(capReq).toStrictEqual(expectedRequest);
      expect(result).toEqual([timeCaptured, timeSynced, payload]);
    });

    it('returns null when no data available', async () => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          getLatestTabularData: () => {
            return new GetLatestTabularDataResponse({});
          },
        });
      });

      const result = await subject().getLatestTabularData(
        'testPartId',
        'testResource',
        'testSubtype',
        'testMethod'
      );

      expect(result).toBeNull();
    });
  });
});

describe('DatasetClient tests', () => {
  const created1 = new Date(1, 1, 1, 1, 1, 1);
  const dataset1 = new Dataset({
    id: 'id1',
    name: 'name1',
    organizationId: 'orgId1',
    timeCreated: Timestamp.fromDate(created1),
  });
  const created2 = new Date(2, 2, 2, 2, 2, 2);
  const dataset2 = new Dataset({
    id: 'id2',
    name: 'name2',
    organizationId: 'orgId2',
    timeCreated: Timestamp.fromDate(created2),
  });
  const datasets = [dataset1, dataset2];
  const datasetIds = ['dataset1', 'dataset2'];

  describe('createDataset tests', () => {
    let capReq: CreateDatasetRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DatasetService, {
          createDataset: (req) => {
            capReq = req;
            return new CreateDatasetResponse({
              id: 'id',
            });
          },
        });
      });
    });

    it('create dataset', async () => {
      const expectedRequest = new CreateDatasetRequest({
        name: 'name',
        organizationId: 'orgId',
      });

      const promise = await subject().createDataset('name', 'orgId');
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise).toEqual('id');
    });
  });

  describe('deleteDataset tests', () => {
    let capReq: DeleteDatasetRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DatasetService, {
          deleteDataset: (req) => {
            capReq = req;
            return new DeleteDatasetResponse();
          },
        });
      });
    });

    it('delete dataset', async () => {
      const expectedRequest = new DeleteDatasetRequest({
        id: 'id',
      });

      await subject().deleteDataset('id');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('renameDataset tests', () => {
    let capReq: RenameDatasetRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DatasetService, {
          renameDataset: (req) => {
            capReq = req;
            return new RenameDatasetResponse();
          },
        });
      });
    });

    it('rename dataset', async () => {
      const expectedRequest = new RenameDatasetRequest({
        id: 'id',
        name: 'name',
      });

      await subject().renameDataset('id', 'name');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('listDatasetsByOrganizationID tests', () => {
    let capReq: ListDatasetsByOrganizationIDRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DatasetService, {
          listDatasetsByOrganizationID: (req) => {
            capReq = req;
            return new ListDatasetsByOrganizationIDResponse({
              datasets,
            });
          },
        });
      });
    });

    it('list datasets by organization ID', async () => {
      const expectedRequest = new ListDatasetsByOrganizationIDRequest({
        organizationId: 'orgId',
      });

      const promise = await subject().listDatasetsByOrganizationID('orgId');
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise.length).toEqual(2);
      const [set1, set2] = promise;
      expect(set1?.id).toEqual('id1');
      expect(set1?.name).toEqual('name1');
      expect(set1?.organizationId).toEqual('orgId1');
      expect(set1?.created).toEqual(dataset1.timeCreated?.toDate());
      expect(set2?.id).toEqual('id2');
      expect(set2?.name).toEqual('name2');
      expect(set2?.organizationId).toEqual('orgId2');
      expect(set2?.created).toEqual(dataset2.timeCreated?.toDate());
    });
  });

  describe('listDatasetsByIDs tests', () => {
    let capReq: ListDatasetsByIDsRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DatasetService, {
          listDatasetsByIDs: (req) => {
            capReq = req;
            return new ListDatasetsByIDsResponse({
              datasets,
            });
          },
        });
      });
    });

    it('list datasets by organization ID', async () => {
      const expectedRequest = new ListDatasetsByIDsRequest({
        ids: datasetIds,
      });

      const promise = await subject().listDatasetsByIds(datasetIds);
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise.length).toEqual(2);
      const [set1, set2] = promise;
      expect(set1?.id).toEqual('id1');
      expect(set1?.name).toEqual('name1');
      expect(set1?.organizationId).toEqual('orgId1');
      expect(set1?.created).toEqual(dataset1.timeCreated?.toDate());
      expect(set2?.id).toEqual('id2');
      expect(set2?.name).toEqual('name2');
      expect(set2?.organizationId).toEqual('orgId2');
      expect(set2?.created).toEqual(dataset2.timeCreated?.toDate());
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
  const timeRequested1 = new Date(1970, 1, 1, 1, 1, 1);
  const timeReceived1 = new Date(1971, 2, 2, 2, 2, 2);
  const dataRequestTimes1: [Date, Date] = [timeRequested1, timeReceived1];
  const timeRequested2 = new Date(1972, 3, 3, 3, 3, 3);
  const timeReceived2 = new Date(1973, 4, 4, 4, 4, 4);
  const dataRequestTimes2: [Date, Date] = [timeRequested2, timeReceived2];
  const tabularData1 = { key1: 1, key2: '2' };
  const tabularData2 = { key3: [1, 2, 3], key4: { key4sub1: 1 } };
  const binaryData = new Uint8Array([1, 2]);

  const expectedRequest = new DataCaptureUploadRequest();
  const metadata = new UploadMetadata({
    partId,
    componentType,
    componentName,
    methodName,
    tags,
  });

  describe('tabularDataCaptureUpload', () => {
    let capReq: DataCaptureUploadRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataSyncService, {
          dataCaptureUpload: (req) => {
            capReq = req;
            return new DataCaptureUploadResponse({
              fileId: 'fileId',
            });
          },
        });
      });
    });

    it('tabular data capture upload', async () => {
      metadata.type = DataType.TABULAR_SENSOR;
      expectedRequest.metadata = metadata;
      const sensorData1 = new SensorData();
      const sensorMetadata1 = new SensorMetadata();
      sensorMetadata1.timeRequested = Timestamp.fromDate(timeRequested1);
      sensorMetadata1.timeReceived = Timestamp.fromDate(timeReceived1);
      sensorData1.metadata = sensorMetadata1;
      sensorData1.data.case = 'struct';
      sensorData1.data.value = Struct.fromJson(tabularData1);
      const sensorData2 = new SensorData();
      const sensorMetadata2 = new SensorMetadata();
      sensorMetadata2.timeRequested = Timestamp.fromDate(timeRequested2);
      sensorMetadata2.timeReceived = Timestamp.fromDate(timeReceived2);
      sensorData2.metadata = sensorMetadata2;
      sensorData2.data.case = 'struct';
      sensorData2.data.value = Struct.fromJson(tabularData2);
      expectedRequest.sensorContents = [sensorData1, sensorData2];

      const response = await subject().tabularDataCaptureUpload(
        [tabularData1, tabularData2],
        partId,
        componentType,
        componentName,
        methodName,
        [dataRequestTimes1, dataRequestTimes2],
        tags
      );
      expect(capReq).toStrictEqual(expectedRequest);
      expect(response).toStrictEqual('fileId');
    });
  });

  describe('binaryDataCaptureUpload', () => {
    let capReq: DataCaptureUploadRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataSyncService, {
          dataCaptureUpload: (req) => {
            capReq = req;
            return new DataCaptureUploadResponse({
              binaryDataId: 'fileId',
            });
          },
        });
      });
    });

    it('binary data capture upload', async () => {
      metadata.type = DataType.BINARY_SENSOR;
      metadata.fileExtension = fileExtension;
      expectedRequest.metadata = metadata;
      const sensorData = new SensorData();
      const sensorMetadata = new SensorMetadata();
      sensorMetadata.timeRequested = Timestamp.fromDate(timeRequested1);
      sensorMetadata.timeReceived = Timestamp.fromDate(timeReceived1);
      sensorData.metadata = sensorMetadata;
      sensorData.data.case = 'binary';
      sensorData.data.value = binaryData;
      expectedRequest.sensorContents = [sensorData];

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
      expect(capReq).toStrictEqual(expectedRequest);
      expect(response).toStrictEqual('fileId');
    });
  });
});

describe('DataPipelineClient tests', () => {
  const organizationId = 'testOrgId';
  const pipelineId = 'testPipelineId';
  const pipelineName = 'testPipeline';
  const mqlQuery = [{ $match: { component_name: 'sensor-1' } }];
  const schedule = '0 0 * * *';

  describe('listDataPipelines tests', () => {
    const pipeline1 = new DataPipeline({
      id: 'pipeline1',
      name: 'pipeline1',
      organizationId: 'org1',
    });
    const pipeline2 = new DataPipeline({
      id: 'pipeline2',
      name: 'pipeline2',
      organizationId: 'org2',
    });
    const pipelines = [pipeline1, pipeline2];

    let capReq: ListDataPipelinesRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataPipelinesService, {
          listDataPipelines: (req: ListDataPipelinesRequest) => {
            capReq = req;
            return new ListDataPipelinesResponse({
              dataPipelines: pipelines,
            });
          },
        });
      });
    });

    it('list data pipelines', async () => {
      const expectedRequest = new ListDataPipelinesRequest({
        organizationId,
      });

      const response = await subject().listDataPipelines(organizationId);
      expect(capReq).toStrictEqual(expectedRequest);
      expect(response).toEqual(pipelines);
    });
  });

  describe('getPipeline tests', () => {
    const pipeline = new DataPipeline({
      id: pipelineId,
      name: pipelineName,
      organizationId,
    });

    let capReq: GetDataPipelineRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataPipelinesService, {
          getDataPipeline: (req: GetDataPipelineRequest) => {
            capReq = req;
            return new GetDataPipelineResponse({
              dataPipeline: pipeline,
            });
          },
        });
      });
    });

    it('get pipeline', async () => {
      const expectedRequest = new GetDataPipelineRequest({
        id: pipelineId,
      });

      const response = await subject().getDataPipeline(pipelineId);
      expect(capReq).toStrictEqual(expectedRequest);
      expect(response).toEqual(pipeline);
    });

    it('returns null when pipeline does not exist', async () => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataPipelinesService, {
          getDataPipeline: () => {
            return new GetDataPipelineResponse({});
          },
        });
      });

      const response = await subject().getDataPipeline(pipelineId);
      expect(response).toBeNull();
    });
  });

  describe('createDataPipeline tests', () => {
    let capReq: CreateDataPipelineRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataPipelinesService, {
          createDataPipeline: (req: CreateDataPipelineRequest) => {
            capReq = req;
            return new CreateDataPipelineResponse({
              id: pipelineId,
            });
          },
        });
      });
    });

    it('create data pipeline', async () => {
      const expectedRequest = new CreateDataPipelineRequest({
        organizationId,
        name: pipelineName,
        mqlBinary: mqlQuery.map((value) => BSON.serialize(value)),
        schedule,
      });

      const response = await subject().createDataPipeline(
        organizationId,
        pipelineName,
        mqlQuery,
        schedule
      );
      expect(capReq).toStrictEqual(expectedRequest);
      expect(response).toEqual(pipelineId);
    });
  });

  describe('deleteDataPipeline tests', () => {
    let capReq: DeleteDataPipelineRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataPipelinesService, {
          deleteDataPipeline: (req: DeleteDataPipelineRequest) => {
            capReq = req;
            return new DeleteDataPipelineResponse();
          },
        });
      });
    });

    it('delete data pipeline', async () => {
      const expectedRequest = new DeleteDataPipelineRequest({
        id: pipelineId,
      });

      await subject().deleteDataPipeline(pipelineId);
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('listDataPipelineRuns tests', () => {
    const run1 = new DataPipelineRun({
      id: 'run1',
      status: DataPipelineRunStatus.STARTED,
    });
    const run2 = new DataPipelineRun({
      id: 'run2',
      status: DataPipelineRunStatus.COMPLETED,
    });
    const runs = [run1, run2];
    const pageSize = 10;
    const nextPageToken = 'nextPageToken';

    let capReq: ListDataPipelineRunsRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataPipelinesService, {
          listDataPipelineRuns: (req: ListDataPipelineRunsRequest) => {
            capReq = req;
            return new ListDataPipelineRunsResponse({
              runs,
              nextPageToken,
            });
          },
        });
      });
    });

    it('list data pipeline runs', async () => {
      const expectedRequest = new ListDataPipelineRunsRequest({
        id: pipelineId,
        pageSize,
      });

      const page = await subject().listDataPipelineRuns(pipelineId, pageSize);
      expect(capReq).toStrictEqual(expectedRequest);
      expect(page.runs).toEqual(runs);
      const nextPage = await page.nextPage();
      expect(nextPage.runs).toEqual(runs);
    });

    it('get next page of runs', async () => {
      const nextPageRuns = [run2];
      mockTransport = createRouterTransport(({ service }) => {
        service(DataPipelinesService, {
          listDataPipelineRuns: (req: ListDataPipelineRunsRequest) => {
            capReq = req;
            return new ListDataPipelineRunsResponse({
              runs: nextPageRuns,
              nextPageToken: 'some-token',
            });
          },
        });
      });

      const page = await subject().listDataPipelineRuns(pipelineId, pageSize);
      const nextPage = await page.nextPage();
      expect(nextPage.runs).toEqual(nextPageRuns);
    });

    it('returns empty page when no more runs', async () => {
      const someRuns = [run1];
      mockTransport = createRouterTransport(({ service }) => {
        service(DataPipelinesService, {
          listDataPipelineRuns: (req: ListDataPipelineRunsRequest) => {
            capReq = req;
            return new ListDataPipelineRunsResponse({
              runs: someRuns,
              nextPageToken: '',
            });
          },
        });
      });

      const page = await subject().listDataPipelineRuns(pipelineId, pageSize);
      const nextPage = await page.nextPage();
      expect(nextPage.runs).toEqual([]);
    });
  });
});
