import { beforeEach, describe, expect, it } from 'vitest';
import { create, type JsonValue } from '@bufbuild/protobuf';
import { timestampDate, timestampFromDate } from '@bufbuild/protobuf/wkt';
import { createRouterTransport, type Transport } from '@connectrpc/connect';
import { BSON } from 'bsonfy';

import {
  type AddBinaryDataToDatasetByIDsRequest,
  AddBinaryDataToDatasetByIDsRequestSchema,
  AddBinaryDataToDatasetByIDsResponseSchema,
  type AddBoundingBoxToImageByIDRequest,
  AddBoundingBoxToImageByIDRequestSchema,
  AddBoundingBoxToImageByIDResponseSchema,
  type AddTagsToBinaryDataByIDsRequest,
  AddTagsToBinaryDataByIDsRequestSchema,
  AddTagsToBinaryDataByIDsResponseSchema,
  type BinaryDataByFilterRequest,
  BinaryDataByFilterRequestSchema,
  BinaryDataByFilterResponseSchema,
  type BinaryDataByIDsRequest,
  BinaryDataByIDsRequestSchema,
  BinaryDataByIDsResponseSchema,
  BinaryDataSchema,
  CaptureIntervalSchema,
  type ConfigureDatabaseUserRequest,
  ConfigureDatabaseUserRequestSchema,
  ConfigureDatabaseUserResponseSchema,
  type CreateBinaryDataSignedURLRequest,
  CreateBinaryDataSignedURLRequestSchema,
  CreateBinaryDataSignedURLResponseSchema,
  type CreateIndexRequest,
  CreateIndexResponseSchema,
  DataRequestSchema,
  DataService,
  type DeleteBinaryDataByFilterRequest,
  DeleteBinaryDataByFilterRequestSchema,
  DeleteBinaryDataByFilterResponseSchema,
  DeleteBinaryDataByIDsResponseSchema,
  type DeleteIndexRequest,
  DeleteIndexRequestSchema,
  DeleteIndexResponseSchema,
  type DeleteTabularDataRequest,
  DeleteTabularDataResponseSchema,
  DeleteTabularFilterSchema,
  type ExportTabularDataRequest,
  ExportTabularDataRequestSchema,
  ExportTabularDataResponseSchema,
  FilterSchema,
  type GetDatabaseConnectionRequest,
  GetDatabaseConnectionRequestSchema,
  GetDatabaseConnectionResponseSchema,
  type GetLatestTabularDataRequest,
  GetLatestTabularDataRequestSchema,
  GetLatestTabularDataResponseSchema,
  IndexableCollection,
  IndexCreator,
  IndexSchema,
  type ListIndexesRequest,
  ListIndexesRequestSchema,
  ListIndexesResponseSchema,
  type RemoveBinaryDataFromDatasetByIDsRequest,
  RemoveBinaryDataFromDatasetByIDsRequestSchema,
  RemoveBinaryDataFromDatasetByIDsResponseSchema,
  type RemoveBoundingBoxFromImageByIDRequest,
  RemoveBoundingBoxFromImageByIDRequestSchema,
  RemoveBoundingBoxFromImageByIDResponseSchema,
  type RemoveTagsFromBinaryDataByIDsRequest,
  RemoveTagsFromBinaryDataByIDsRequestSchema,
  RemoveTagsFromBinaryDataByIDsResponseSchema,
  type TabularDataByMQLRequest,
  TabularDataByMQLRequestSchema,
  TabularDataByMQLResponseSchema,
  TabularDataBySQLResponseSchema,
  TabularDataSourceType,
  TagsFilterSchema,
  type UpdateBoundingBoxRequest,
  UpdateBoundingBoxRequestSchema,
  UpdateBoundingBoxResponseSchema,
} from '../gen/app/data/v1/data_pb';
import {
  type CreateDataPipelineRequest,
  CreateDataPipelineRequestSchema,
  CreateDataPipelineResponseSchema,
  DataPipelineRunSchema,
  DataPipelineRunStatus,
  DataPipelineSchema,
  DataPipelinesService,
  type DeleteDataPipelineRequest,
  DeleteDataPipelineRequestSchema,
  DeleteDataPipelineResponseSchema,
  type GetDataPipelineRequest,
  GetDataPipelineRequestSchema,
  GetDataPipelineResponseSchema,
  type ListDataPipelineRunsRequest,
  ListDataPipelineRunsRequestSchema,
  ListDataPipelineRunsResponseSchema,
  type ListDataPipelinesRequest,
  ListDataPipelinesRequestSchema,
  ListDataPipelinesResponseSchema,
} from '../gen/app/datapipelines/v1/data_pipelines_pb';
import {
  type CreateDatasetRequest,
  CreateDatasetRequestSchema,
  CreateDatasetResponseSchema,
  DatasetSchema,
  DatasetService,
  type DeleteDatasetRequest,
  DeleteDatasetRequestSchema,
  DeleteDatasetResponseSchema,
  type ListDatasetsByIDsRequest,
  ListDatasetsByIDsRequestSchema,
  ListDatasetsByIDsResponseSchema,
  type ListDatasetsByOrganizationIDRequest,
  ListDatasetsByOrganizationIDRequestSchema,
  ListDatasetsByOrganizationIDResponseSchema,
  type RenameDatasetRequest,
  RenameDatasetRequestSchema,
  RenameDatasetResponseSchema,
} from '../gen/app/dataset/v1/dataset_pb';
import {
  type DataCaptureUploadRequest,
  DataCaptureUploadRequestSchema,
  DataCaptureUploadResponseSchema,
  DataSyncService,
  DataType,
  type FileData,
  type FileUploadRequest,
  FileUploadResponseSchema,
  SensorDataSchema,
  SensorMetadataSchema,
  type UploadMetadata,
  UploadMetadataSchema,
} from '../gen/app/datasync/v1/data_sync_pb';
import {
  DataClient,
  type FileUploadOptions,
  type FilterOptions,
} from './data-client';

let mockTransport: Transport;
const subject = () => new DataClient(mockTransport);

describe('DataClient tests', () => {
  const filter = DataClient.createFilter({
    componentName: 'testComponentName',
    componentType: 'testComponentType',
  });

  const limit = 30;
  const lastId = 'lastId';
  const countOnly = true;
  const includeInternalData = false;
  const startDate = new Date(1, 1, 1, 1, 1, 1);

  const binaryDataId1 = 'testID1';
  const binaryDataId2 = 'testID2';
  const boundingBoxId1 = 'testBoxID1';

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
    const tabDataResponse1 = create(ExportTabularDataResponseSchema, {
      ...sharedAttributes,
      methodParameters: { key: 'param1' },
      timeCaptured: timestampFromDate(timeCaptured1),
      payload: { key: 'value1' },
    });
    const tabDataResponse2 = create(ExportTabularDataResponseSchema, {
      ...sharedAttributes,
      methodParameters: { key: 'param2' },
      timeCaptured: timestampFromDate(timeCaptured2),
      payload: { key: 'value2' },
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

      const expectedRequest = create(ExportTabularDataRequestSchema, {
        partId: 'partId1',
        resourceName: 'resource1',
        resourceSubtype: 'resource1:subtype',
        methodName: 'Readings',
        interval: {
          start: timestampFromDate(timeCaptured1),
          end: timestampFromDate(timeCaptured2),
        },
      });

      expect(capReq).toStrictEqual(expectedRequest);
    });

    // Test for additional params
    const additionalParams = {
      key: 'value1',
    };

    it('gets tabular data for an interval with additional params', async () => {
      await subject().exportTabularData(
        'partId1',
        'resource1',
        'resource1:subtype',
        'Readings',
        timeCaptured1,
        timeCaptured2,
        additionalParams
      );

      const expectedRequest = create(ExportTabularDataRequestSchema, {
        partId: 'partId1',
        resourceName: 'resource1',
        resourceSubtype: 'resource1:subtype',
        methodName: 'Readings',
        interval: {
          start: timestampFromDate(timeCaptured1),
          end: timestampFromDate(timeCaptured2),
        },
        additionalParameters: {
          key: 'value1',
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
            return create(TabularDataBySQLResponseSchema, {
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
            return create(TabularDataByMQLResponseSchema, {
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

    it('get tabular data from MQL with queryPrefixName', async () => {
      const expectedRequest = create(TabularDataByMQLRequestSchema, {
        organizationId: 'some_org_id',
        mqlBinary: [BSON.serialize({ query: 'some_mql_query' })],
        queryPrefixName: 'my_prefix',
      });
      let capReq: TabularDataByMQLRequest | undefined = undefined;
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          tabularDataByMQL: (req) => {
            capReq = req;
            return create(TabularDataByMQLResponseSchema, {
              rawData: data.map((x) => BSON.serialize(x)),
            });
          },
        });
      });
      const promise = await subject().tabularDataByMQL(
        'some_org_id',
        [{ query: 'some_mql_query' }],
        false,
        undefined,
        'my_prefix'
      );
      expect(capReq).toStrictEqual(expectedRequest);
      const result = promise as typeof data;
      expect(result[0]?.key1).toBeInstanceOf(Date);
      expect(promise).toEqual(data);
    });
  });

  const bin1 = new Uint8Array([1, 2, 3]);
  const bin2 = new Uint8Array([4, 5, 6]);
  const binData1 = create(BinaryDataSchema, {
    binary: new Uint8Array(bin1),
  });
  const binData2 = create(BinaryDataSchema, {
    binary: bin2,
  });
  const binDataResponse = create(BinaryDataByFilterResponseSchema, {
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
            return create(BinaryDataByFilterResponseSchema, {});
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
      const dataReq = create(DataRequestSchema, {
        filter,
        limit: BigInt(limit),
        last: lastId,
      });
      const expectedRequest = create(BinaryDataByFilterRequestSchema, {
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

  const binDataByIdsResponse = create(BinaryDataByIDsResponseSchema, {
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

    it('get binary data by binary data id', async () => {
      const expectedRequest = create(BinaryDataByIDsRequestSchema, {
        binaryDataIds: [binaryDataId1],
        includeBinary: true,
      });

      await subject().binaryDataByIds([binaryDataId1]);
      expect(capReq).toStrictEqual(expectedRequest);
    });

    it('get binary data by binary data id with includeBinary false', async () => {
      const expectedRequest = create(BinaryDataByIDsRequestSchema, {
        binaryDataIds: [binaryDataId1],
        includeBinary: false,
      });

      await subject().binaryDataByIds([binaryDataId1], false);
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('createBinaryDataSignedURL tests', () => {
    let capReq: CreateBinaryDataSignedURLRequest;
    const signedUrl = 'https://example.com/signed-url?token=abc123';
    const binaryDataId = 'test-binary-data-id';

    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          createBinaryDataSignedURL: (req) => {
            capReq = req;
            return create(CreateBinaryDataSignedURLResponseSchema, {
              signedUrl,
            });
          },
        });
      });
    });

    it('create signed URL for binary data', async () => {
      const expectedRequest = create(CreateBinaryDataSignedURLRequestSchema, {
        binaryDataId,
      });

      const response = await subject().createBinaryDataSignedURL(binaryDataId);
      expect(capReq).toStrictEqual(expectedRequest);
      expect(response).toEqual(signedUrl);
    });

    it('create signed URL with expiration minutes', async () => {
      const expirationMinutes = 30;
      const expectedRequest = create(CreateBinaryDataSignedURLRequestSchema, {
        binaryDataId,
        expirationMinutes,
      });

      const response = await subject().createBinaryDataSignedURL(
        binaryDataId,
        expirationMinutes
      );
      expect(capReq).toStrictEqual(expectedRequest);
      expect(response).toEqual(signedUrl);
    });
  });

  describe('deleteTabularData tests', () => {
    let capturedRequest: DeleteTabularDataRequest | undefined;

    beforeEach(() => {
      capturedRequest = undefined;
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          deleteTabularData: (req) => {
            capturedRequest = req;
            const response = create(DeleteTabularDataResponseSchema, {});
            response.deletedCount = BigInt(10);
            return response;
          },
        });
      });
    });

    it('delete tabular data', async () => {
      const promise = await subject().deleteTabularData('orgId', 20);
      expect(promise).toEqual(10n);
      expect(capturedRequest?.filter).toBeUndefined();
    });

    it('delete tabular data with filter', async () => {
      const deleteTabularFilter = create(DeleteTabularFilterSchema, {
        locationIds: ['location-1'],
        componentName: 'camera',
      });
      const promise = await subject().deleteTabularData(
        'orgId',
        20,
        deleteTabularFilter
      );
      expect(promise).toEqual(10n);
      expect(capturedRequest?.filter).toBeDefined();
      expect(capturedRequest?.filter?.locationIds).toEqual(['location-1']);
      expect(capturedRequest?.filter?.componentName).toEqual('camera');
    });

    it('delete tabular data with undefined filter', async () => {
      const promise = await subject().deleteTabularData('orgId', 20, undefined);
      expect(promise).toEqual(10n);
      expect(capturedRequest?.filter).toBeUndefined();
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
              const response = create(
                DeleteBinaryDataByFilterResponseSchema,
                {}
              );
              response.deletedCount = req.includeInternalData
                ? BigInt(20)
                : BigInt(10);
              return response;
            }
            return create(DeleteBinaryDataByFilterResponseSchema, {
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
      const expectedRequest = create(DeleteBinaryDataByFilterRequestSchema, {
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
            return create(DeleteBinaryDataByIDsResponseSchema, {
              deletedCount: BigInt(Math.max(req.binaryDataIds.length)),
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
  });

  describe('addTagsToBinaryDataByIds tests', () => {
    let capReq: AddTagsToBinaryDataByIDsRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          addTagsToBinaryDataByIDs: (req) => {
            capReq = req;
            return create(AddTagsToBinaryDataByIDsResponseSchema, {});
          },
        });
      });
    });

    it('add tags to binary data by binary data ids', async () => {
      const expectedRequest = create(AddTagsToBinaryDataByIDsRequestSchema, {
        binaryDataIds: [binaryDataId1, binaryDataId2],
        tags: ['tag1', 'tag2'],
      });

      await subject().addTagsToBinaryDataByIds(
        ['tag1', 'tag2'],
        [binaryDataId1, binaryDataId2]
      );
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
            return create(RemoveTagsFromBinaryDataByIDsResponseSchema, {
              deletedCount: BigInt(2),
            });
          },
        });
      });
    });

    it('remove tags to binary data by binary data ids', async () => {
      const expectedRequest = create(
        RemoveTagsFromBinaryDataByIDsRequestSchema,
        {
          binaryDataIds: [binaryDataId1, binaryDataId2],
          tags: ['tag1', 'tag2'],
        }
      );

      const promise = await subject().removeTagsFromBinaryDataByIds(
        ['tag1', 'tag2'],
        [binaryDataId1, binaryDataId2]
      );
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise).toEqual(2n);
    });
  });

  describe('addBoundingBoxToImageById tests', () => {
    let capReq: AddBoundingBoxToImageByIDRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          addBoundingBoxToImageByID: (req) => {
            capReq = req;
            return create(AddBoundingBoxToImageByIDResponseSchema, {
              bboxId: 'bboxId',
            });
          },
        });
      });
    });

    it('add bounding box to image by binary data id', async () => {
      const expectedRequest = create(AddBoundingBoxToImageByIDRequestSchema, {
        binaryDataId: binaryDataId1,
        label: 'label',
        xMinNormalized: 0,
        yMinNormalized: 0,
        yMaxNormalized: 1,
        xMaxNormalized: 1,
        confidence: 0.4,
      });

      const promise = await subject().addBoundingBoxToImageById(
        binaryDataId1,
        'label',
        0,
        0,
        1,
        1,
        0.4
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
            return create(RemoveBoundingBoxFromImageByIDResponseSchema, {});
          },
        });
      });
    });

    it('remove bounding box from image by binary data id', async () => {
      const expectedRequest = create(
        RemoveBoundingBoxFromImageByIDRequestSchema,
        {
          binaryDataId: binaryDataId1,
          bboxId: 'bboxId',
        }
      );

      await subject().removeBoundingBoxFromImageById(binaryDataId1, 'bboxId');
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('updateBoundingBox tests', () => {
    let capReq: UpdateBoundingBoxRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          updateBoundingBox: (req) => {
            capReq = req;
            return create(UpdateBoundingBoxResponseSchema, {});
          },
        });
      });
    });

    it('update bounding box on image by binary data id', async () => {
      const expectedRequest = create(UpdateBoundingBoxRequestSchema, {
        binaryDataId: binaryDataId1,
        bboxId: boundingBoxId1,
        label: 'label',
        xMinNormalized: 0,
        yMinNormalized: 0,
        yMaxNormalized: 1,
        xMaxNormalized: 1,
        confidence: 0.4,
      });

      await subject().updateBoundingBox(
        binaryDataId1,
        boundingBoxId1,
        'label',
        0,
        0,
        1,
        1,
        0.4
      );
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('configureDatabaseUser tests', () => {
    let capReq: ConfigureDatabaseUserRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          configureDatabaseUser: (req) => {
            capReq = req;
            return create(ConfigureDatabaseUserResponseSchema, {});
          },
        });
      });
    });

    it('configure database user', async () => {
      const expectedRequest = create(ConfigureDatabaseUserRequestSchema, {
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
            return create(GetDatabaseConnectionResponseSchema, {
              hostname: 'hostname',
            });
          },
        });
      });
    });

    it('get database connection', async () => {
      const expectedRequest = create(GetDatabaseConnectionRequestSchema, {
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
            return create(AddBinaryDataToDatasetByIDsResponseSchema, {});
          },
        });
      });
    });

    it('add binary data to dataset by binary data ids', async () => {
      const expectedRequest = create(AddBinaryDataToDatasetByIDsRequestSchema, {
        binaryDataIds: [binaryDataId1, binaryDataId2],
        datasetId: 'datasetId',
      });

      await subject().addBinaryDataToDatasetByIds(
        [binaryDataId1, binaryDataId2],
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
            return create(RemoveBinaryDataFromDatasetByIDsResponseSchema, {});
          },
        });
      });
    });

    it('remove binary data from dataset by binary data ids', async () => {
      const expectedRequest = create(
        RemoveBinaryDataFromDatasetByIDsRequestSchema,
        {
          binaryDataIds: [binaryDataId1, binaryDataId2],
          datasetId: 'datasetId',
        }
      );

      await subject().removeBinaryDataFromDatasetByIds(
        [binaryDataId1, binaryDataId2],
        'datasetId'
      );
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('createIndex tests', () => {
    let capReq: CreateIndexRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          createIndex: (req) => {
            capReq = req;
            return create(CreateIndexResponseSchema, {});
          },
        });
      });
    });
    it('creates an index', async () => {
      const organizationId = 'orgId';
      const collectionType = IndexableCollection.PIPELINE_SINK;
      const indexSpec = { keys: { field: 1 }, options: { priority: 1 } };
      const pipelineName = 'pipeline1';
      await subject().createIndex(
        organizationId,
        collectionType,
        indexSpec,
        pipelineName
      );
      expect(capReq.organizationId).toBe(organizationId);
      expect(capReq.collectionType).toBe(collectionType);
      expect(
        capReq.indexSpec.map((spec) => BSON.deserialize(spec))[0]
      ).toStrictEqual(indexSpec);
      expect(capReq.pipelineName).toBe(pipelineName);
    });
    it('creates an index without pipeline name', async () => {
      const organizationId = 'orgId';
      const collectionType = IndexableCollection.HOT_STORE;
      const indexSpec = { keys: { field: 2 }, options: { priority: 2 } };
      await subject().createIndex(organizationId, collectionType, indexSpec);
      expect(capReq.organizationId).toBe(organizationId);
      expect(capReq.collectionType).toBe(collectionType);
      expect(
        capReq.indexSpec.map((spec) => BSON.deserialize(spec))[0]
      ).toStrictEqual(indexSpec);
    });
  });

  describe('listIndexes tests', () => {
    let capReq: ListIndexesRequest;
    const index1 = create(IndexSchema, {
      collectionType: IndexableCollection.HOT_STORE,
      indexName: 'index1',
      indexSpec: [new TextEncoder().encode(JSON.stringify({ field: 1 }))],
      createdBy: IndexCreator.CUSTOMER,
    });
    const index2 = create(IndexSchema, {
      collectionType: IndexableCollection.PIPELINE_SINK,
      pipelineName: 'pipeline1',
      indexName: 'index2',
      indexSpec: [
        new TextEncoder().encode(JSON.stringify({ another_field: -1 })),
      ],
      createdBy: IndexCreator.VIAM,
    });
    const indexes = [index1, index2];
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          listIndexes: (req) => {
            capReq = req;
            return create(ListIndexesResponseSchema, {
              indexes,
            });
          },
        });
      });
    });
    it('lists indexes', async () => {
      const organizationId = 'orgId';
      const collectionType = IndexableCollection.HOT_STORE;
      const pipelineName = 'pipeline1';
      const expectedRequest = create(ListIndexesRequestSchema, {
        organizationId,
        collectionType,
        pipelineName,
      });
      const result = await subject().listIndexes(
        organizationId,
        collectionType,
        pipelineName
      );
      expect(capReq).toStrictEqual(expectedRequest);
      expect(result).toEqual(indexes);
    });
    it('lists indexes without pipeline name', async () => {
      const organizationId = 'orgId';
      const collectionType = IndexableCollection.HOT_STORE;
      const expectedRequest = create(ListIndexesRequestSchema, {
        organizationId,
        collectionType,
      });
      const result = await subject().listIndexes(
        organizationId,
        collectionType
      );
      expect(capReq).toStrictEqual(expectedRequest);
      expect(result).toEqual(indexes);
    });
  });

  describe('deleteIndex tests', () => {
    let capReq: DeleteIndexRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataService, {
          deleteIndex: (req) => {
            capReq = req;
            return create(DeleteIndexResponseSchema, {});
          },
        });
      });
    });
    it('deletes an index', async () => {
      const organizationId = 'orgId';
      const collectionType = IndexableCollection.HOT_STORE;
      const indexName = 'my_index';
      const pipelineName = 'pipeline1';
      const expectedRequest = create(DeleteIndexRequestSchema, {
        organizationId,
        collectionType,
        indexName,
        pipelineName,
      });
      await subject().deleteIndex(
        organizationId,
        collectionType,
        indexName,
        pipelineName
      );
      expect(capReq).toStrictEqual(expectedRequest);
    });
    it('deletes an index without pipeline name', async () => {
      const organizationId = 'orgId';
      const collectionType = IndexableCollection.HOT_STORE;
      const indexName = 'my_index';
      const expectedRequest = create(DeleteIndexRequestSchema, {
        organizationId,
        collectionType,
        indexName,
      });
      await subject().deleteIndex(organizationId, collectionType, indexName);
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('createFilter tests', () => {
    it('create empty filter', () => {
      const testFilter = DataClient.createFilter({});
      expect(testFilter).toEqual(create(FilterSchema, {}));
    });

    it('create filter', () => {
      const opts = { componentName: 'camera' };
      const testFilter = DataClient.createFilter(opts);

      const expectedFilter = create(FilterSchema, {
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
      const interval = create(CaptureIntervalSchema, {
        start: timestampFromDate(startTime),
        end: timestampFromDate(endTime),
      });
      const tagsList = ['testTag1', 'testTag2'];
      const tagsFilter = create(TagsFilterSchema, {
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
      const testFilter = DataClient.createFilter(opts);
      expect(testFilter.componentType).toEqual('testComponentType');

      const expectedFilter = create(FilterSchema, {
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
            return create(GetLatestTabularDataResponseSchema, {
              timeCaptured: timestampFromDate(timeCaptured),
              timeSynced: timestampFromDate(timeSynced),
              payload,
            });
          },
        });
      });
    });

    let capReq: GetLatestTabularDataRequest;

    it('get latest tabular data', async () => {
      const expectedRequest = create(GetLatestTabularDataRequestSchema, {
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
            return create(GetLatestTabularDataResponseSchema, {});
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
  const dataset1 = create(DatasetSchema, {
    id: 'id1',
    name: 'name1',
    organizationId: 'orgId1',
    timeCreated: timestampFromDate(created1),
  });
  const created2 = new Date(2, 2, 2, 2, 2, 2);
  const dataset2 = create(DatasetSchema, {
    id: 'id2',
    name: 'name2',
    organizationId: 'orgId2',
    timeCreated: timestampFromDate(created2),
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
            return create(CreateDatasetResponseSchema, {
              id: 'id',
            });
          },
        });
      });
    });

    it('create dataset', async () => {
      const expectedRequest = create(CreateDatasetRequestSchema, {
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
            return create(DeleteDatasetResponseSchema, {});
          },
        });
      });
    });

    it('delete dataset', async () => {
      const expectedRequest = create(DeleteDatasetRequestSchema, {
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
            return create(RenameDatasetResponseSchema, {});
          },
        });
      });
    });

    it('rename dataset', async () => {
      const expectedRequest = create(RenameDatasetRequestSchema, {
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
            return create(ListDatasetsByOrganizationIDResponseSchema, {
              datasets,
            });
          },
        });
      });
    });

    it('list datasets by organization ID', async () => {
      const expectedRequest = create(
        ListDatasetsByOrganizationIDRequestSchema,
        {
          organizationId: 'orgId',
        }
      );

      const promise = await subject().listDatasetsByOrganizationID('orgId');
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise.length).toEqual(2);
      const [set1, set2] = promise;
      expect(set1?.id).toEqual('id1');
      expect(set1?.name).toEqual('name1');
      expect(set1?.organizationId).toEqual('orgId1');
      expect(set1?.created).toEqual(
        dataset1.timeCreated ? timestampDate(dataset1.timeCreated) : undefined
      );
      expect(set2?.id).toEqual('id2');
      expect(set2?.name).toEqual('name2');
      expect(set2?.organizationId).toEqual('orgId2');
      expect(set2?.created).toEqual(
        dataset2.timeCreated ? timestampDate(dataset2.timeCreated) : undefined
      );
    });
  });

  describe('listDatasetsByIDs tests', () => {
    let capReq: ListDatasetsByIDsRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DatasetService, {
          listDatasetsByIDs: (req) => {
            capReq = req;
            return create(ListDatasetsByIDsResponseSchema, {
              datasets,
            });
          },
        });
      });
    });

    it('list datasets by organization ID', async () => {
      const expectedRequest = create(ListDatasetsByIDsRequestSchema, {
        ids: datasetIds,
      });

      const promise = await subject().listDatasetsByIds(datasetIds);
      expect(capReq).toStrictEqual(expectedRequest);
      expect(promise.length).toEqual(2);
      const [set1, set2] = promise;
      expect(set1?.id).toEqual('id1');
      expect(set1?.name).toEqual('name1');
      expect(set1?.organizationId).toEqual('orgId1');
      expect(set1?.created).toEqual(
        dataset1.timeCreated ? timestampDate(dataset1.timeCreated) : undefined
      );
      expect(set2?.id).toEqual('id2');
      expect(set2?.name).toEqual('name2');
      expect(set2?.organizationId).toEqual('orgId2');
      expect(set2?.created).toEqual(
        dataset2.timeCreated ? timestampDate(dataset2.timeCreated) : undefined
      );
    });
  });
});

describe('DataSyncClient tests', () => {
  const partId = 'testPartId';
  const componentType = 'testComponentType';
  const componentName = 'testComponentName';
  const methodName = 'testMethodName';
  const tags = ['testTag1', 'testTag2'];
  const datasetIds = ['dataset1', 'dataset2'];
  const timeRequested1 = new Date(1970, 1, 1, 1, 1, 1);
  const timeReceived1 = new Date(1971, 2, 2, 2, 2, 2);
  const dataRequestTimes1: [Date, Date] = [timeRequested1, timeReceived1];
  const timeRequested2 = new Date(1972, 3, 3, 3, 3, 3);
  const timeReceived2 = new Date(1973, 4, 4, 4, 4, 4);
  const dataRequestTimes2: [Date, Date] = [timeRequested2, timeReceived2];
  const tabularData1 = { key1: 1, key2: '2' };
  const tabularData2 = { key3: [1, 2, 3], key4: { key4sub1: 1 } };
  const binaryData = new Uint8Array([1, 2]);

  const expectedRequest = create(DataCaptureUploadRequestSchema, {});
  const metadata = create(UploadMetadataSchema, {
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
            return create(DataCaptureUploadResponseSchema, {
              fileId: 'fileId',
            });
          },
        });
      });
    });

    it('tabular data capture upload', async () => {
      metadata.type = DataType.TABULAR_SENSOR;
      expectedRequest.metadata = metadata;
      const sensorData1 = create(SensorDataSchema, {});
      const sensorMetadata1 = create(SensorMetadataSchema, {});
      sensorMetadata1.timeRequested = timestampFromDate(timeRequested1);
      sensorMetadata1.timeReceived = timestampFromDate(timeReceived1);
      sensorData1.metadata = sensorMetadata1;
      sensorData1.data.case = 'struct';
      sensorData1.data.value = tabularData1;
      const sensorData2 = create(SensorDataSchema, {});
      const sensorMetadata2 = create(SensorMetadataSchema, {});
      sensorMetadata2.timeRequested = timestampFromDate(timeRequested2);
      sensorMetadata2.timeReceived = timestampFromDate(timeReceived2);
      sensorData2.metadata = sensorMetadata2;
      sensorData2.data.case = 'struct';
      sensorData2.data.value = tabularData2;
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
            return create(DataCaptureUploadResponseSchema, {
              binaryDataId: 'fileId',
            });
          },
        });
      });
    });

    it('binary data capture upload', async () => {
      const mimeType = 'image/png';

      const expectedReq = create(DataCaptureUploadRequestSchema, {});
      const expectedMd = create(UploadMetadataSchema, {
        partId,
        componentType,
        componentName,
        methodName,
        type: DataType.BINARY_SENSOR,
        tags,
        datasetIds,
        mimeType,
        fileExtension: '',
      });
      expectedReq.metadata = expectedMd;

      const sensorData = create(SensorDataSchema, {});
      const sensorMetadata = create(SensorMetadataSchema, {});
      sensorMetadata.timeRequested = timestampFromDate(timeRequested1);
      sensorMetadata.timeReceived = timestampFromDate(timeReceived1);
      sensorData.metadata = sensorMetadata;
      sensorData.data.case = 'binary';
      sensorData.data.value = binaryData;
      expectedReq.sensorContents = [sensorData];

      const response = await subject().binaryDataCaptureUpload(
        binaryData,
        partId,
        componentType,
        componentName,
        methodName,
        dataRequestTimes1,
        { tags, datasetIds, mimeType }
      );
      expect(capReq).toStrictEqual(expectedReq);
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
  const dataSourceTypeStandard = TabularDataSourceType.STANDARD;
  const dataSourceTypeHotStorage = TabularDataSourceType.HOT_STORAGE;
  const enableBackfill = true;

  describe('listDataPipelines tests', () => {
    const pipeline1 = create(DataPipelineSchema, {
      id: 'pipeline1',
      name: 'pipeline1',
      organizationId: 'org1',
      dataSourceType: dataSourceTypeStandard,
    });
    const pipeline2 = create(DataPipelineSchema, {
      id: 'pipeline2',
      name: 'pipeline2',
      organizationId: 'org2',
      dataSourceType: dataSourceTypeHotStorage,
    });
    const pipelines = [pipeline1, pipeline2];

    let capReq: ListDataPipelinesRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataPipelinesService, {
          listDataPipelines: (req: ListDataPipelinesRequest) => {
            capReq = req;
            return create(ListDataPipelinesResponseSchema, {
              dataPipelines: pipelines,
            });
          },
        });
      });
    });

    it('list data pipelines', async () => {
      const expectedRequest = create(ListDataPipelinesRequestSchema, {
        organizationId,
      });

      const response = await subject().listDataPipelines(organizationId);
      expect(capReq).toStrictEqual(expectedRequest);
      expect(response).toEqual(pipelines);
    });
  });

  describe('getPipeline tests', () => {
    const pipeline = create(DataPipelineSchema, {
      id: pipelineId,
      name: pipelineName,
      organizationId,
      dataSourceType: dataSourceTypeStandard,
    });

    let capReq: GetDataPipelineRequest;
    beforeEach(() => {
      mockTransport = createRouterTransport(({ service }) => {
        service(DataPipelinesService, {
          getDataPipeline: (req: GetDataPipelineRequest) => {
            capReq = req;
            return create(GetDataPipelineResponseSchema, {
              dataPipeline: pipeline,
            });
          },
        });
      });
    });

    it('get pipeline', async () => {
      const expectedRequest = create(GetDataPipelineRequestSchema, {
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
            return create(GetDataPipelineResponseSchema, {});
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
            return create(CreateDataPipelineResponseSchema, {
              id: pipelineId,
            });
          },
        });
      });
    });

    it('create data pipeline', async () => {
      const expectedRequest = create(CreateDataPipelineRequestSchema, {
        organizationId,
        name: pipelineName,
        mqlBinary: mqlQuery.map((value) => BSON.serialize(value)),
        schedule,
        enableBackfill,
        dataSourceType: dataSourceTypeStandard,
      });

      const response = await subject().createDataPipeline(
        organizationId,
        pipelineName,
        mqlQuery,
        schedule,
        enableBackfill,
        dataSourceTypeStandard
      );
      expect(capReq).toStrictEqual(expectedRequest);
      expect(response).toEqual(pipelineId);
    });

    it('create data pipeline with optional dataSourceType', async () => {
      const expectedRequest = create(CreateDataPipelineRequestSchema, {
        organizationId,
        name: pipelineName,
        mqlBinary: mqlQuery.map((value) => BSON.serialize(value)),
        schedule,
        enableBackfill,
        dataSourceType: dataSourceTypeStandard,
      });

      const response = await subject().createDataPipeline(
        organizationId,
        pipelineName,
        mqlQuery,
        schedule,
        enableBackfill
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
            return create(DeleteDataPipelineResponseSchema, {});
          },
        });
      });
    });

    it('delete data pipeline', async () => {
      const expectedRequest = create(DeleteDataPipelineRequestSchema, {
        id: pipelineId,
      });

      await subject().deleteDataPipeline(pipelineId);
      expect(capReq).toStrictEqual(expectedRequest);
    });
  });

  describe('listDataPipelineRuns tests', () => {
    const run1 = create(DataPipelineRunSchema, {
      id: 'run1',
      status: DataPipelineRunStatus.STARTED,
    });
    const run2 = create(DataPipelineRunSchema, {
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
            return create(ListDataPipelineRunsResponseSchema, {
              runs,
              nextPageToken,
            });
          },
        });
      });
    });

    it('list data pipeline runs', async () => {
      const expectedRequest = create(ListDataPipelineRunsRequestSchema, {
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
            return create(ListDataPipelineRunsResponseSchema, {
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
            return create(ListDataPipelineRunsResponseSchema, {
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

describe('fileUpload tests', () => {
  const partId = 'testPartId';
  const binaryData = new Uint8Array([1, 2, 3, 4, 5]);
  const options: FileUploadOptions = {
    componentType: 'componentType',
    componentName: 'componentName',
    methodName: 'methodName',
    fileName: 'fileName',
    fileExtension: '.png',
    tags: ['testTag1', 'testTag2'],
    datasetIds: ['dataset1', 'dataset2'],
  };

  const expectedFileId = 'testFileId';
  const expectedBinaryDataId = 'testBinaryDataId';

  let capturedRequests: FileUploadRequest[];

  beforeEach(() => {
    capturedRequests = [];
    mockTransport = createRouterTransport(({ service }) => {
      service(DataSyncService, {
        fileUpload: async (requests: AsyncIterable<FileUploadRequest>) => {
          for await (const request of requests) {
            capturedRequests.push(request);
          }
          return create(FileUploadResponseSchema, {
            fileId: expectedFileId,
            binaryDataId: expectedBinaryDataId,
          });
        },
      });
    });
  });

  it('uploads file with metadata and file contents', async () => {
    const result = await subject().fileUpload(binaryData, partId, options);

    expect(result).toBe(expectedBinaryDataId);
    expect(capturedRequests).toHaveLength(2);

    // Check metadata request
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const metadataRequest = capturedRequests[0]!;
    expect(metadataRequest.uploadPacket.case).toBe('metadata');
    const metadata = metadataRequest.uploadPacket.value as UploadMetadata;
    expect(metadata.partId).toBe(partId);
    expect(metadata.type).toBe(DataType.FILE);
    expect(metadata.componentType).toBe(options.componentType);
    expect(metadata.componentName).toBe(options.componentName);
    expect(metadata.methodName).toBe(options.methodName);
    expect(metadata.fileName).toBe(options.fileName);
    expect(metadata.fileExtension).toBe(options.fileExtension);
    expect(metadata.tags).toStrictEqual(options.tags);
    expect(metadata.datasetIds).toStrictEqual(options.datasetIds);

    // Check file contents request
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fileContentsRequest = capturedRequests[1]!;
    expect(fileContentsRequest.uploadPacket.case).toBe('fileContents');
    const fileContents = fileContentsRequest.uploadPacket.value as FileData;
    expect(fileContents.data).toEqual(binaryData);
  });

  it('uploads file without optional parameters', async () => {
    const result = await subject().fileUpload(binaryData, partId);

    expect(result).toBe(expectedBinaryDataId);
    expect(capturedRequests).toHaveLength(2);

    // Check metadata request
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const metadataRequest = capturedRequests[0]!;
    expect(metadataRequest.uploadPacket.case).toBe('metadata');
    const metadata = metadataRequest.uploadPacket.value as UploadMetadata;
    expect(metadata.partId).toBe(partId);
    expect(metadata.type).toBe(DataType.FILE);
    expect(metadata.componentType).toBe('');
    expect(metadata.componentName).toBe('');
    expect(metadata.methodName).toBe('');
    expect(metadata.fileName).toBe('');
    expect(metadata.fileExtension).toBe('');
    expect(metadata.tags).toStrictEqual([]);
    expect(metadata.datasetIds).toStrictEqual([]);

    // Check file contents request
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fileContentsRequest = capturedRequests[1]!;
    expect(fileContentsRequest.uploadPacket.case).toBe('fileContents');
    const fileContents = fileContentsRequest.uploadPacket.value as FileData;
    expect(fileContents.data).toEqual(binaryData);
  });

  it('chunks file data', async () => {
    const numChunks = 3;
    const data = Uint8Array.from(
      { length: DataClient.UPLOAD_CHUNK_SIZE * numChunks },
      () => Math.floor(Math.random() * 256)
    );

    const result = await subject().fileUpload(data, partId);
    expect(result).toBe(expectedBinaryDataId);
    expect(capturedRequests).toHaveLength(1 + numChunks);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const metadataRequest = capturedRequests[0]!;
    expect(metadataRequest.uploadPacket.case).toBe('metadata');

    const contentRequests = capturedRequests.slice(1);
    expect(contentRequests).toHaveLength(numChunks);

    const receivedLength = contentRequests.reduce(
      (acc, val) => acc + (val.uploadPacket.value as FileData).data.length,
      0
    );
    expect(receivedLength).toEqual(numChunks * DataClient.UPLOAD_CHUNK_SIZE);

    const receivedData = new Uint8Array(receivedLength);
    let offset = 0;
    for (const req of contentRequests) {
      expect(req.uploadPacket.case).toBe('fileContents');
      const fileData = req.uploadPacket.value as FileData;
      expect(fileData.data).toHaveLength(DataClient.UPLOAD_CHUNK_SIZE);
      receivedData.set(fileData.data, offset);
      offset += fileData.data.length;
    }

    expect(receivedData).toStrictEqual(data);
  });
});
