import {
  Struct,
  Timestamp,
  type JsonValue,
  type PartialMessage,
} from '@bufbuild/protobuf';
import { createClient, type Client, type Transport } from '@connectrpc/connect';
import { BSON } from 'bsonfy';
import { DataService } from '../gen/app/data/v1/data_connect';
import {
  BinaryID,
  CaptureInterval,
  CaptureMetadata,
  Filter,
  Index,
  IndexableCollection,
  Order,
  TabularDataSource,
  TabularDataSourceType,
  TagsFilter,
} from '../gen/app/data/v1/data_pb';
import { DataPipelinesService } from '../gen/app/datapipelines/v1/data_pipelines_connect';
import {
  DataPipeline,
  DataPipelineRun,
} from '../gen/app/datapipelines/v1/data_pipelines_pb';
import { DatasetService } from '../gen/app/dataset/v1/dataset_connect';
import type { Dataset as PBDataset } from '../gen/app/dataset/v1/dataset_pb';
import { DataSyncService } from '../gen/app/datasync/v1/data_sync_connect';
import {
  DataCaptureUploadRequest,
  DataType,
  FileData,
  FileUploadRequest,
  SensorData,
  SensorMetadata,
  UploadMetadata,
} from '../gen/app/datasync/v1/data_sync_pb';

export type FilterOptions = Partial<Filter> & {
  endTime?: Date;
  startTime?: Date;
  tags?: string[];
};

interface TabularData {
  data?: JsonValue;
  metadata?: CaptureMetadata;
  timeRequested?: Date;
  timeReceived?: Date;
}

interface TabularDataPoint {
  partId: string;
  resourceName: string;
  resourceSubtype: string;
  methodName: string;
  timeCaptured: Date;
  organizationId: string;
  locationId: string;
  robotName: string;
  robotId: string;
  partName: string;
  methodParameters: JsonValue;
  tags: string[];
  payload: JsonValue;
}

/** Optional parameters for uploading files */
export interface FileUploadOptions {
  /**
   * Optional type of the component associated with the file (for example,
   * "movement_sensor").
   */
  componentType?: string;

  /** Optional name of the component associated with the file. */
  componentName?: string;

  /** Optional name of the method associated with the file. */
  methodName?: string;

  /**
   * Optional name of the file. The empty string `""` will be assigned as the
   * file name if one isn't provided.
   */
  fileName?: string;

  /**
   * Optional file extension. The empty string `""` will be assigned as the file
   * extension if one isn't provided. Files with a `.jpeg`, `.jpg`, or `.png`
   * extension will be saved to the **Images** tab.
   */
  fileExtension?: string;

  /**
   * Optional list of tags to allow for tag-based filtering when retrieving
   * data.
   */
  tags?: string[];

  /** Optional list of datasets to add the data to. */
  datasetIds?: string[];
}

export type Dataset = Partial<PBDataset> & {
  created?: Date;
};

const logDeprecationWarning = () => {
  // eslint-disable-next-line no-console
  console.warn(
    'The BinaryID type is deprecated and will be removed in a future release. Please migrate to the BinaryDataId field instead.'
  );
};

export class DataClient {
  private dataClient: Client<typeof DataService>;
  private datasetClient: Client<typeof DatasetService>;
  private dataSyncClient: Client<typeof DataSyncService>;
  private dataPipelinesClient: Client<typeof DataPipelinesService>;
  static readonly UPLOAD_CHUNK_SIZE = 1024 * 64;

  constructor(transport: Transport) {
    this.dataClient = createClient(DataService, transport);
    this.datasetClient = createClient(DatasetService, transport);
    this.dataSyncClient = createClient(DataSyncService, transport);
    this.dataPipelinesClient = createClient(DataPipelinesService, transport);
  }

  /**
   * Obtain unified tabular data and metadata from the specified data source.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.exportTabularData(
   *   '123abc45-1234-5678-90ab-cdef12345678',
   *   'my-sensor',
   *   'rdk:component:sensor',
   *   'Readings',
   *   new Date('2025-03-25'),
   *   new Date('2024-03-27')
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#exporttabulardata).
   *
   * @param partId The ID of the part that owns the data
   * @param resourceName The name of the requested resource that captured the
   *   data
   * @param resourceSubtype The subtype of the requested resource that captured
   *   the data
   * @param methodName The data capture method name
   * @param startTime Optional start time (`Date` object) for requesting a
   *   specific range of data
   * @param endTime Optional end time (`Date` object) for requesting a specific
   *   range of data
   * @returns An array of unified tabular data and metadata.
   */
  async exportTabularData(
    partId: string,
    resourceName: string,
    resourceSubtype: string,
    methodName: string,
    startTime?: Date,
    endTime?: Date,
    additionalParams?: Record<string, JsonValue>
  ) {
    const interval = new CaptureInterval();
    if (startTime) {
      interval.start = Timestamp.fromDate(startTime);
    }
    if (endTime) {
      interval.end = Timestamp.fromDate(endTime);
    }

    let additionalParameters: Struct | undefined;
    if (additionalParams) {
      additionalParameters = Struct.fromJson(additionalParams);
    }

    const req = {
      partId,
      resourceName,
      resourceSubtype,
      methodName,
      interval,
      additionalParameters,
    };

    const responses = this.dataClient.exportTabularData(req);

    const dataArray: TabularDataPoint[] = [];

    for await (const response of responses) {
      dataArray.push({
        partId: response.partId,
        resourceName: response.resourceName,
        resourceSubtype: response.resourceSubtype,
        methodName: response.methodName,
        timeCaptured: response.timeCaptured!.toDate(), // eslint-disable-line @typescript-eslint/no-non-null-assertion
        organizationId: response.organizationId,
        locationId: response.locationId,
        robotName: response.robotName,
        robotId: response.robotId,
        partName: response.partName,
        methodParameters: response.methodParameters!.toJson(), // eslint-disable-line @typescript-eslint/no-non-null-assertion
        tags: response.tags,
        payload: response.payload!.toJson(), // eslint-disable-line @typescript-eslint/no-non-null-assertion
      });
    }

    return dataArray;
  }

  /**
   * Obtain unified tabular data and metadata, queried with SQL.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.tabularDataBySQL(
   *   '123abc45-1234-5678-90ab-cdef12345678',
   *   'SELECT * FROM readings LIMIT 5'
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#exporttabulardata).
   *
   * @param organizationId The ID of the organization that owns the data
   * @param query The SQL query to run
   * @returns An array of data objects
   */
  async tabularDataBySQL(organizationId: string, query: string) {
    const resp = await this.dataClient.tabularDataBySQL({
      organizationId,
      sqlQuery: query,
    });
    return resp.rawData.map((value) => BSON.deserialize(value));
  }

  /**
   * Obtain unified tabular data and metadata, queried with MQL.
   *
   * @example
   *
   * ```ts
   * // {@link JsonValue} is imported from @bufbuild/protobuf
   * const mqlQuery: Record<string, JsonValue>[] = [
   *   {
   *     $match: {
   *       component_name: 'sensor-1',
   *     },
   *   },
   *   {
   *     $limit: 5,
   *   },
   * ];
   *
   * const data = await dataClient.tabularDataByMQL(
   *   '123abc45-1234-5678-90ab-cdef12345678',
   *   mqlQuery
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#tabulardatabymql).
   *
   * @param organizationId The ID of the organization that owns the data
   * @param query The MQL query to run as a list of BSON documents
   * @param useRecentData Whether to query blob storage or your recent data
   *   store. Defaults to false. Deprecated - use dataSource instead.
   * @param dataSource The data source to query. Defaults to the standard data
   *   source.
   * @param queryPrefixName Optional name of the query prefix.
   * @returns An array of data objects
   */
  async tabularDataByMQL(
    organizationId: string,
    query: Uint8Array[] | Record<string, Date | JsonValue>[],
    useRecentData?: boolean,
    tabularDataSource?: TabularDataSource,
    queryPrefixName?: string
  ) {
    const binary: Uint8Array[] =
      query[0] instanceof Uint8Array
        ? (query as Uint8Array[])
        : query.map((value) => BSON.serialize(value));

    // Legacy support for useRecentData, which is now deprecated.
    let dataSource = tabularDataSource;
    if (
      useRecentData &&
      (!dataSource || dataSource.type === TabularDataSourceType.UNSPECIFIED)
    ) {
      dataSource = new TabularDataSource({
        type: TabularDataSourceType.HOT_STORAGE,
      });
    }

    const resp = await this.dataClient.tabularDataByMQL({
      organizationId,
      mqlBinary: binary,
      dataSource,
      queryPrefixName,
    });
    return resp.rawData.map((value) => BSON.deserialize(value));
  }

  /**
   * Filter and get a page of tabular data. The returned metadata might be empty
   * if the metadata index of the data is out of the bounds of the returned
   * metadata list. The data will be paginated into pages of `limit` items, and
   * the pagination ID will be included in the returned tuple.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.tabularDataByFilter(
   *   {
   *     componentName: 'sensor-1',
   *     componentType: 'rdk:component:sensor',
   *   } as Filter,
   *   5
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#tabulardatabyfilter).
   *
   * @param filter Optional `pb.Filter` specifying tabular data to retrieve. No
   *   `filter` implies all tabular data.
   * @param limit The maximum number of entries to include in a page. Defaults
   *   to 50 if unspecfied
   * @param sortOrder The desired sort order of the data
   * @param last Optional string indicating the ID of the last-returned data. If
   *   provided, the server will return the next data entries after the `last`
   *   ID.
   * @param countOnly Whether to return only the total count of entries
   * @param includeInternalData Whether to retun internal data. Internal data is
   *   used for Viam-specific data ingestion, like cloud SLAM. Defaults to
   *   `false`.
   * @returns An array of data objects, the count (number of entries), and the
   *   last-returned page ID.
   */
  async tabularDataByFilter(
    filter?: Filter,
    limit?: number,
    sortOrder?: Order,
    last = '',
    countOnly = false,
    includeInternalData = false
  ) {
    const dataReq = {
      filter,
      limit: limit === undefined ? undefined : BigInt(limit),
      sortOrder,
      last,
    };

    const req = {
      dataRequest: dataReq,
      countOnly,
      includeInternalData,
    };

    const response = await this.dataClient.tabularDataByFilter(req);
    const mdListLength = response.metadata.length;

    const dataArray: TabularData[] = [];
    dataArray.push(
      ...response.data.map((data) => {
        const mdIndex = data.metadataIndex;
        const metadata =
          mdListLength !== 0 && mdIndex >= mdListLength
            ? new CaptureMetadata()
            : response.metadata[mdIndex];
        return {
          data: data.data?.toJson(),
          metadata,
          timeRequested: data.timeRequested?.toDate(),
          timeReceived: data.timeRequested?.toDate(),
        };
      })
    );

    return {
      data: dataArray,
      count: response.count,
      last: response.last,
    };
  }

  /**
   * Filter and get a page of binary data. The returned metadata might be empty
   * if the metadata index of the data is out of the bounds of the returned
   * metadata list. The data will be paginated into pages of `limit` items, and
   * the pagination ID will be included in the returned tuple.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.binaryDataByFilter(
   *   {
   *     componentName: 'camera-1',
   *     componentType: 'rdk:component:camera',
   *   } as Filter,
   *   1
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#binarydatabyfilter).
   *
   * @param filter Optional `pb.Filter` specifying binary data to retrieve. No
   *   `filter` implies all binary data.
   * @param limit The maximum number of entries to include in a page. Defaults
   *   to 50 if unspecfied
   * @param sortOrder The desired sort order of the data
   * @param last Optional string indicating the ID of the last-returned data. If
   *   provided, the server will return the next data entries after the `last`
   *   ID.
   * @param includeBinary Whether to include binary file data with each
   *   retrieved file
   * @param countOnly Whether to return only the total count of entries
   * @param includeInternalData Whether to retun internal data. Internal data is
   *   used for Viam-specific data ingestion, like cloud SLAM. Defaults to
   *   `false`.
   * @returns An array of data objects, the count (number of entries), and the
   *   last-returned page ID.
   */
  async binaryDataByFilter(
    filter?: Filter,
    limit?: number,
    sortOrder?: Order,
    last = '',
    includeBinary = true,
    countOnly = false,
    includeInternalData = false
  ) {
    const dataReq = {
      filter,
      limit: limit === undefined ? undefined : BigInt(limit),
      sortOrder,
      last,
    };

    const req = {
      dataRequest: dataReq,
      includeBinary,
      countOnly,
      includeInternalData,
    };

    const response = await this.dataClient.binaryDataByFilter(req);
    return {
      data: response.data,
      count: response.count,
      last: response.last,
    };
  }

  /**
   * Get binary data using the binary data ID.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.binaryDataByIds([
   *   'ccb74b53-1235-4328-a4b9-91dff1915a50/x5vur1fmps/YAEzj5I1kTwtYsDdf4a7ctaJpGgKRHmnM9bJNVyblk52UpqmrnMVTITaBKZctKEh',
   * ]);
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#binarydatabyids).
   *
   * @param ids The IDs of the requested binary data
   * @returns An array of data objects
   */
  async binaryDataByIds(ids: string[] | BinaryID[]) {
    if (Array.isArray(ids) && typeof ids[0] === 'string') {
      const resp = await this.dataClient.binaryDataByIDs({
        binaryDataIds: ids as string[],
        includeBinary: true,
      });
      return resp.data;
    }
    logDeprecationWarning();
    const resp = await this.dataClient.binaryDataByIDs({
      binaryIds: ids as BinaryID[],
      includeBinary: true,
    });
    return resp.data;
  }

  /**
   * Delete tabular data older than a specified number of days.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.deleteTabularData(
   *   '123abc45-1234-5678-90ab-cdef12345678',
   *   10
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#deletetabulardata).
   *
   * @param organizationId The ID of organization to delete data from
   * @param deleteOlderThanDays Delete data that was captured more than this
   *   many days ago. For example if `deleteOlderThanDays` is 10, this deletes
   *   any data that was captured more than 10 days ago. If it is 0, all
   *   existing data is deleted.
   * @returns The number of items deleted
   */
  async deleteTabularData(organizationId: string, deleteOlderThanDays: number) {
    const resp = await this.dataClient.deleteTabularData({
      organizationId,
      deleteOlderThanDays,
    });
    return resp.deletedCount;
  }

  /**
   * Filter and delete binary data.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.deleteBinaryDataByFilter({
   *   componentName: 'camera-1',
   *   componentType: 'rdk:component:camera',
   *   organizationIds: ['123abc45-1234-5678-90ab-cdef12345678'],
   *   startTime: new Date('2025-03-19'),
   *   endTime: new Date('2025-03-20'),
   * } as Filter);
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#deletebinarydatabyfilter).
   *
   * @param filter Optional `pb.Filter` specifying binary data to delete. No
   *   `filter` implies all binary data.
   * @param includeInternalData Whether or not to delete internal data. Default
   *   is true
   * @returns The number of items deleted
   */
  async deleteBinaryDataByFilter(filter?: Filter, includeInternalData = true) {
    const resp = await this.dataClient.deleteBinaryDataByFilter({
      filter,
      includeInternalData,
    });
    return resp.deletedCount;
  }

  /**
   * Delete binary data, specified by ID.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.deleteBinaryDataByIds([
   *   'ccb74b53-1235-4328-a4b9-91dff1915a50/x5vur1fmps/YAEzj5I1kTwtYsDdf4a7ctaJpGgKRHmnM9bJNVyblk52UpqmrnMVTITaBKZctKEh',
   * ]);
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#deletebinarydatabyids).
   *
   * @param ids The IDs of the data to be deleted. Must be non-empty.
   * @returns The number of items deleted
   */
  async deleteBinaryDataByIds(ids: string[] | BinaryID[]) {
    if (Array.isArray(ids) && typeof ids[0] === 'string') {
      const resp = await this.dataClient.deleteBinaryDataByIDs({
        binaryDataIds: ids as string[],
      });
      return resp.deletedCount;
    }
    logDeprecationWarning();
    const resp = await this.dataClient.deleteBinaryDataByIDs({
      binaryIds: ids as BinaryID[],
    });
    return resp.deletedCount;
  }

  /**
   * Add tags to binary data, specified by ID.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.addTagsToBinaryDataByIds(
   *   ['tag1', 'tag2'],
   *   [
   *     'ccb74b53-1235-4328-a4b9-91dff1915a50/x5vur1fmps/YAEzj5I1kTwtYsDdf4a7ctaJpGgKRHmnM9bJNVyblk52UpqmrnMVTITaBKZctKEh',
   *   ]
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#addtagstobinarydatabyids).
   *
   * @param tags The list of tags to add to specified binary data. Must be
   *   non-empty.
   * @param ids The IDs of the data to be tagged. Must be non-empty.
   */
  async addTagsToBinaryDataByIds(tags: string[], ids: string[] | BinaryID[]) {
    if (Array.isArray(ids) && typeof ids[0] === 'string') {
      await this.dataClient.addTagsToBinaryDataByIDs({
        tags,
        binaryDataIds: ids as string[],
      });
      return;
    }
    logDeprecationWarning();
    await this.dataClient.addTagsToBinaryDataByIDs({
      tags,
      binaryIds: ids as BinaryID[],
    });
  }

  /**
   * Add tags to binary data, specified by filter.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.addTagsToBinaryDataByFilter(
   *   ['tag1', 'tag2'],
   *   [
   *     {
   *       componentName: 'camera-1',
   *     } as Filter,
   *   ]
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#addtagstobinarydatabyfilter).
   *
   * @param tags The tags to add to the data
   * @param filter Optional `pb.Filter` specifying binary data to add tags to.
   *   No `filter` implies all binary data.
   */
  async addTagsToBinaryDataByFilter(tags: string[], filter?: Filter) {
    await this.dataClient.addTagsToBinaryDataByFilter({
      tags,
      filter,
    });
  }

  /**
   * Remove tags from binary data, specified by ID.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.removeTagsFromBinaryDataByIds(
   *   ['tag1', 'tag2'],
   *   [
   *     'ccb74b53-1235-4328-a4b9-91dff1915a50/x5vur1fmps/YAEzj5I1kTwtYsDdf4a7ctaJpGgKRHmnM9bJNVyblk52UpqmrnMVTITaBKZctKEh',
   *   ]
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#removetagsfrombinarydatabyids).
   *
   * @param tags List of tags to remove from specified binary data. Must be
   *   non-empty.
   * @param ids The IDs of the data to be edited. Must be non-empty.
   * @returns The number of items deleted
   */
  async removeTagsFromBinaryDataByIds(
    tags: string[],
    ids: string[] | BinaryID[]
  ) {
    if (Array.isArray(ids) && typeof ids[0] === 'string') {
      const resp = await this.dataClient.removeTagsFromBinaryDataByIDs({
        tags,
        binaryDataIds: ids as string[],
      });
      return resp.deletedCount;
    }
    logDeprecationWarning();
    const resp = await this.dataClient.removeTagsFromBinaryDataByIDs({
      tags,
      binaryIds: ids as BinaryID[],
    });
    return resp.deletedCount;
  }

  /**
   * Remove tags from binary data, specified by filter.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.removeTagsFromBinaryDataByFilter(
   *   ['tag1', 'tag2'],
   *   {
   *     componentName: 'camera-1',
   *     componentType: 'rdk:component:camera',
   *     organizationIds: ['123abc45-1234-5678-90ab-cdef12345678'],
   *     startTime: new Date('2025-03-19'),
   *     endTime: new Date('2025-03-20'),
   *   } as Filter
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#removetagsfrombinarydatabyfilter).
   *
   * @param tags List of tags to remove from specified binary data. Must be
   *   non-empty.
   * @param filter Optional `pb.Filter` specifying binary data to add tags to.
   *   No `filter` implies all binary data.
   * @returns The number of items deleted
   */
  async removeTagsFromBinaryDataByFilter(tags: string[], filter?: Filter) {
    const resp = await this.dataClient.removeTagsFromBinaryDataByFilter({
      tags,
      filter,
    });
    return resp.deletedCount;
  }

  /**
   * Get a list of tags using a filter.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.tagsByFilter({
   *   componentName: 'camera-1',
   * } as Filter);
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#tagsbyfilter).
   *
   * @param filter Optional `pb.Filter` specifying what data to get tags from.
   *   No `filter` implies all data.
   * @returns The list of tags
   */
  async tagsByFilter(filter?: Filter) {
    const resp = await this.dataClient.tagsByFilter({ filter });
    return resp.tags;
  }

  /**
   * Add bounding box to an image.
   *
   * @example
   *
   * ```ts
   * const bboxId = await dataClient.addBoundingBoxToImageById(
   *   'ccb74b53-1235-4328-a4b9-91dff1915a50/x5vur1fmps/YAEzj5I1kTwtYsDdf4a7ctaJpGgKRHmnM9bJNVyblk52UpqmrnMVTITaBKZctKEh',
   *   'label1',
   *   0.3,
   *   0.3,
   *   0.6,
   *   0.6
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#addboundingboxtoimagebyid).
   *
   * @param binaryId The ID of the image to add the bounding box to
   * @param label A label for the bounding box
   * @param xMinNormalized The min X value of the bounding box normalized from 0
   *   to 1
   * @param yMinNormalized The min Y value of the bounding box normalized from 0
   *   to 1
   * @param xMaxNormalized The max X value of the bounding box normalized from 0
   *   to 1
   * @param yMaxNormalized The max Y value of the bounding box normalized from 0
   *   to 1
   * @returns The bounding box ID
   */
  async addBoundingBoxToImageById(
    binaryId: string | BinaryID,
    label: string,
    xMinNormalized: number,
    yMinNormalized: number,
    xMaxNormalized: number,
    yMaxNormalized: number
  ) {
    if (typeof binaryId === 'string') {
      const resp = await this.dataClient.addBoundingBoxToImageByID({
        binaryDataId: binaryId,
        label,
        xMinNormalized,
        yMinNormalized,
        xMaxNormalized,
        yMaxNormalized,
      });
      return resp.bboxId;
    }
    logDeprecationWarning();
    const resp = await this.dataClient.addBoundingBoxToImageByID({
      binaryId,
      label,
      xMinNormalized,
      yMinNormalized,
      xMaxNormalized,
      yMaxNormalized,
    });
    return resp.bboxId;
  }

  /**
   * Remove a bounding box from an image.
   *
   * @example
   *
   * ```ts
   * await dataClient.removeBoundingBoxFromImageById(
   *   'ccb74b53-1235-4328-a4b9-91dff1915a50/x5vur1fmps/YAEzj5I1kTwtYsDdf4a7ctaJpGgKRHmnM9bJNVyblk52UpqmrnMVTITaBKZctKEh',
   *   '5Z9ryhkW7ULaXROjJO6ghPYulNllnH20QImda1iZFroZpQbjahK6igQ1WbYigXED'
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#removeboundingboxfromimagebyid).
   *
   * @param binId The ID of the image to remove the bounding box from
   * @param bboxId The ID of the bounding box to remove
   */
  async removeBoundingBoxFromImageById(
    binId: string | BinaryID,
    bboxId: string
  ) {
    if (typeof binId === 'string') {
      await this.dataClient.removeBoundingBoxFromImageByID({
        binaryDataId: binId,
        bboxId,
      });
      return;
    }
    logDeprecationWarning();
    await this.dataClient.removeBoundingBoxFromImageByID({
      binaryId: binId,
      bboxId,
    });
  }

  /**
   * Get a list of bounding box labels using a Filter.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.boundingBoxLabelsByFilter({
   *   componentName: 'camera-1',
   * } as Filter);
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#boundingboxlabelsbyfilter).
   *
   * @param filter Optional `pb.Filter` specifying what data to get tags from.
   *   No `filter` implies all labels.
   * @returns The list of bounding box labels
   */
  async boundingBoxLabelsByFilter(filter?: Filter) {
    const resp = await this.dataClient.boundingBoxLabelsByFilter({
      filter,
    });
    return resp.labels;
  }

  /**
   * Configure a database user for the Viam organization's MongoDB Atlas Data
   * Federation instance. It can also be used to reset the password of the
   * existing database user.
   *
   * @example
   *
   * ```ts
   * await dataClient.configureDatabaseUser(
   *   '123abc45-1234-5678-90ab-cdef12345678',
   *   'Password01!'
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#configuredatabaseuser).
   *
   * @param organizationId The ID of the organization
   * @param password The password of the user
   */
  async configureDatabaseUser(organizationId: string, password: string) {
    await this.dataClient.configureDatabaseUser({ organizationId, password });
  }

  /**
   * Get a connection to access a MongoDB Atlas Data federation instance.
   *
   * @example
   *
   * ```ts
   * const hostname = await dataClient.getDatabaseConnection(
   *   '123abc45-1234-5678-90ab-cdef12345678'
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#getdatabaseconnection).
   *
   * @param organizationId Organization to retrieve connection for
   * @returns Hostname of the federated database
   */
  async getDatabaseConnection(organizationId: string) {
    const resp = await this.dataClient.getDatabaseConnection({
      organizationId,
    });
    return resp.hostname;
  }

  /**
   * Add BinaryData to the provided dataset.
   *
   * @example
   *
   * ```ts
   * await dataClient.addBinaryDataToDatasetByIds(
   *   [
   *     'ccb74b53-1235-4328-a4b9-91dff1915a50/x5vur1fmps/YAEzj5I1kTwtYsDdf4a7ctaJpGgKRHmnM9bJNVyblk52UpqmrnMVTITaBKZctKEh',
   *   ],
   *   '12ab3de4f56a7bcd89ef0ab1'
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#addbinarydatatodatasetbyids).
   *
   * @param ids The IDs of binary data to add to dataset
   * @param datasetId The ID of the dataset to be added to
   */
  async addBinaryDataToDatasetByIds(
    ids: string[] | BinaryID[],
    datasetId: string
  ) {
    if (Array.isArray(ids) && typeof ids[0] === 'string') {
      await this.dataClient.addBinaryDataToDatasetByIDs({
        binaryDataIds: ids as string[],
        datasetId,
      });
      return;
    }
    logDeprecationWarning();
    await this.dataClient.addBinaryDataToDatasetByIDs({
      binaryIds: ids as BinaryID[],
      datasetId,
    });
  }

  /**
   * Remove BinaryData from the provided dataset.
   *
   * @example
   *
   * ```ts
   * await dataClient.removeBinaryDataFromDatasetByIds(
   *   [
   *     'ccb74b53-1235-4328-a4b9-91dff1915a50/x5vur1fmps/YAEzj5I1kTwtYsDdf4a7ctaJpGgKRHmnM9bJNVyblk52UpqmrnMVTITaBKZctKEh',
   *   ],
   *   '12ab3de4f56a7bcd89ef0ab1'
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#removebinarydatafromdatasetbyids).
   *
   * @param ids The IDs of the binary data to remove from dataset
   * @param datasetId The ID of the dataset to be removed from
   */
  async removeBinaryDataFromDatasetByIds(
    ids: string[] | BinaryID[],
    datasetId: string
  ) {
    if (Array.isArray(ids) && typeof ids[0] === 'string') {
      await this.dataClient.removeBinaryDataFromDatasetByIDs({
        binaryDataIds: ids as string[],
        datasetId,
      });
      return;
    }
    logDeprecationWarning();
    await this.dataClient.removeBinaryDataFromDatasetByIDs({
      binaryIds: ids as BinaryID[],
      datasetId,
    });
  }

  /**
   * Create a new dataset.
   *
   * @example
   *
   * ```ts
   * const datasetId = await dataClient.createDataset(
   *   'my-new-dataset',
   *   '123abc45-1234-5678-90ab-cdef12345678'
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#createdataset).
   *
   * @param name The name of the new dataset
   * @param organizationId The ID of the organization the dataset is being
   *   created in
   * @returns The ID of the dataset
   */
  async createDataset(name: string, organizationId: string) {
    const resp = await this.datasetClient.createDataset({
      name,
      organizationId,
    });
    return resp.id;
  }

  /**
   * Delete a dataset.
   *
   * @example
   *
   * ```ts
   * await dataClient.deleteDataset('12ab3de4f56a7bcd89ef0ab1');
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#deletedataset).
   *
   * @param id The ID of the dataset.
   */
  async deleteDataset(id: string) {
    await this.datasetClient.deleteDataset({ id });
  }

  /**
   * Rename a dataset.
   *
   * @example
   *
   * ```ts
   * await dataClient.renameDataset(
   *   '12ab3de4f56a7bcd89ef0ab1',
   *   'my-new-dataset'
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#renamedataset).
   *
   * @param id The ID of the dataset
   * @param name The new name of the dataset
   */
  async renameDataset(id: string, name: string) {
    await this.datasetClient.renameDataset({ id, name });
  }

  /**
   * List all of the datasets for an organization.
   *
   * @example
   *
   * ```ts
   * const datasets = await dataClient.listDatasetsByOrganizationID(
   *   '123abc45-1234-5678-90ab-cdef12345678'
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#listdatasetsbyorganizationid).
   *
   * @param organizationId The ID of the organization
   * @returns The list of datasets in the organization
   */
  async listDatasetsByOrganizationID(
    organizationId: string
  ): Promise<Dataset[]> {
    const resp = await this.datasetClient.listDatasetsByOrganizationID({
      organizationId,
    });
    return resp.datasets.map((ds) => {
      return {
        created: ds.timeCreated?.toDate(),
        ...ds,
      };
    });
  }

  /**
   * List all of the datasets specified by the given dataset IDs.
   *
   * @example
   *
   * ```ts
   * const datasets = await dataClient.listDatasetsByIds([
   *   '12ab3de4f56a7bcd89ef0ab1',
   * ]);
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#listdatasetsbyids).
   *
   * @param ids The list of IDs of the datasets
   * @returns The list of datasets
   */
  async listDatasetsByIds(ids: string[]): Promise<Dataset[]> {
    const resp = await this.datasetClient.listDatasetsByIDs({
      ids,
    });
    return resp.datasets.map((ds) => {
      return {
        created: ds.timeCreated?.toDate(),
        ...ds,
      };
    });
  }

  /**
   * Uploads the content and metadata for tabular data.
   *
   * Upload tabular data collected on a robot through a specific component (for
   * example, a motor) along with the relevant metadata to app.viam.com. Tabular
   * data can be found under the "Sensors" subtab of the Data tab on
   * app.viam.com.
   *
   * @example
   *
   * ```ts
   * const fileId = await dataClient.tabularDataCaptureUpload(
   *   [
   *     {
   *       readings: {
   *         timestamp: '2025-03-26T10:00:00Z',
   *         value: 10,
   *       },
   *     },
   *   ],
   *   '123abc45-1234-5678-90ab-cdef12345678',
   *   'rdk:component:sensor',
   *   'my-sensor',
   *   'Readings',
   *   [
   *     [
   *       new Date('2025-03-26T10:00:00Z'),
   *       new Date('2025-03-26T10:00:00Z'),
   *     ],
   *   ]
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#tabulardatacaptureupload).
   *
   * @param tabularData The list of data to be uploaded, represented tabularly
   *   as an array.
   * @param partId The part ID of the component used to capture the data
   * @param componentType The type of the component used to capture the data
   *   (for example, "movementSensor")
   * @param componentName The name of the component used to capture the data
   * @param methodName The name of the method used to capture the data.
   * @param tags The list of tags to allow for tag-based filtering when
   *   retrieving data
   * @param dataRequestTimes Array of Date tuples, each containing two `Date`
   *   objects denoting the times this data was requested[0] by the robot and
   *   received[1] from the appropriate sensor. Passing a list of tabular data
   *   and Timestamps with length n > 1 will result in n datapoints being
   *   uploaded, all tied to the same metadata.
   * @returns The file ID of the uploaded data
   */
  async tabularDataCaptureUpload(
    tabularData: Record<string, JsonValue>[],
    partId: string,
    componentType: string,
    componentName: string,
    methodName: string,
    dataRequestTimes: [Date, Date][],
    tags?: string[]
  ) {
    if (dataRequestTimes.length !== tabularData.length) {
      throw new Error('dataRequestTimes and data lengths must be equal.');
    }

    const metadata = new UploadMetadata({
      partId,
      componentType,
      componentName,
      methodName,
      type: DataType.TABULAR_SENSOR,
      tags,
    });

    const sensorContents: SensorData[] = [];
    for (const [i, data] of tabularData.entries()) {
      const sensorMetadata = new SensorMetadata();
      const dates = dataRequestTimes[i];
      if (dates) {
        sensorMetadata.timeRequested = Timestamp.fromDate(dates[0]);
        sensorMetadata.timeReceived = Timestamp.fromDate(dates[1]);
      }
      sensorContents.push(
        new SensorData({
          metadata: sensorMetadata,
          data: {
            case: 'struct',
            value: Struct.fromJson(data),
          },
        })
      );
    }

    const req = new DataCaptureUploadRequest({
      metadata,
      sensorContents,
    });

    const resp = await this.dataSyncClient.dataCaptureUpload(req);
    return resp.fileId;
  }

  /**
   * Uploads the content and metadata for binary data.
   *
   * Upload binary data collected on a robot through a specific component (for
   * example, a motor) along with the relevant metadata to app.viam.com. binary
   * data can be found under the "Sensors" subtab of the Data tab on
   * app.viam.com.
   *
   * @example
   *
   * ```ts
   * const binaryDataId = await dataClient.binaryDataCaptureUpload(
   *   binaryData,
   *   '123abc45-1234-5678-90ab-cdef12345678',
   *   'rdk:component:camera',
   *   'my-camera',
   *   'ReadImage',
   *   '.jpg',
   *   [new Date('2025-03-19'), new Date('2025-03-19')]
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#binarydatacaptureupload).
   *
   * @param binaryData The data to be uploaded, represented in bytes
   * @param partId The part ID of the component used to capture the data
   * @param componentType The type of the component used to capture the data
   *   (for example, "movementSensor")
   * @param componentName The name of the component used to capture the data
   * @param methodName The name of the method used to capture the data.
   * @param fileExtension The file extension of binary data including the
   *   period, for example .jpg, .png, or .pcd. The backend will route the
   *   binary to its corresponding mime type based on this extension. Files with
   *   a .jpeg, .jpg, or .png extension will be saved to the images tab.
   * @param tags The list of tags to allow for tag-based filtering when
   *   retrieving data
   * @param dataRequestTimes Tuple containing `Date` objects denoting the times
   *   this data was requested[0] by the robot and received[1] from the
   *   appropriate sensor.
   * @returns The binary data ID of the uploaded data
   */
  async binaryDataCaptureUpload(
    binaryData: Uint8Array,
    partId: string,
    componentType: string,
    componentName: string,
    methodName: string,
    fileExtension: string,
    dataRequestTimes: [Date, Date],
    tags?: string[],
    datasetIds?: string[]
  ) {
    const metadata = new UploadMetadata({
      partId,
      componentType,
      componentName,
      methodName,
      type: DataType.BINARY_SENSOR,
      tags,
      fileExtension,
      datasetIds,
    });

    const sensorData = new SensorData({
      metadata: {
        timeRequested: Timestamp.fromDate(dataRequestTimes[0]),
        timeReceived: Timestamp.fromDate(dataRequestTimes[1]),
      },
      data: {
        case: 'binary',
        value: binaryData,
      },
    });

    const req = new DataCaptureUploadRequest({
      metadata,
      sensorContents: [sensorData],
    });

    const resp = await this.dataSyncClient.dataCaptureUpload(req);
    return resp.binaryDataId;
  }

  /**
   * Upload arbitrary file data.
   *
   * Upload file data that may be stored on a robot along with the relevant
   * metadata. File data can be found in the **Files** tab of the **DATA**
   * page.
   *
   * @example
   *
   * ```ts
   * const binaryDataId = await dataClient.fileUpload(
   *   binaryData,
   *   'INSERT YOUR PART ID',
   *   {
   *     fileExtension: '.jpeg',
   *     tags: ['tag_1', 'tag_2'],
   *   }
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#fileupload).
   *
   * @param binaryData The data to be uploaded
   * @param partId The part ID of the machine that captured the data
   * @param options Options for the file upload
   * @returns The binary data ID of the uploaded data
   */
  async fileUpload(
    binaryData: Uint8Array,
    partId: string,
    options?: FileUploadOptions
  ) {
    const md = new UploadMetadata({
      partId,
      type: DataType.FILE,
      ...options,
    });

    const response = await this.dataSyncClient.fileUpload(
      DataClient.fileUploadRequests(md, binaryData)
    );
    return response.binaryDataId;
  }

  /**
   * Create an async generator of FileUploadRequests to use with FileUpload
   * methods.
   *
   * @param metadata The file's metadata
   * @param data The binary data of the file
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private static async *fileUploadRequests(
    metadata: UploadMetadata,
    data: Uint8Array
  ): AsyncGenerator<PartialMessage<FileUploadRequest>> {
    yield new FileUploadRequest({
      uploadPacket: {
        case: 'metadata',
        value: metadata,
      },
    });
    for (let i = 0; i < data.length; i += DataClient.UPLOAD_CHUNK_SIZE) {
      let end = i + DataClient.UPLOAD_CHUNK_SIZE;
      if (end > data.length) {
        end = data.length;
      }
      yield new FileUploadRequest({
        uploadPacket: {
          case: 'fileContents',
          value: new FileData({ data: data.slice(i, end) }),
        },
      });
    }
  }

  static createFilter(options: FilterOptions): Filter {
    const filter = new Filter(options);

    if (options.startTime ?? options.endTime) {
      const interval = new CaptureInterval();
      if (options.startTime) {
        interval.start = Timestamp.fromDate(options.startTime);
      }
      if (options.endTime) {
        interval.end = Timestamp.fromDate(options.endTime);
      }
      filter.interval = interval;
    }

    const tagsFilter = new TagsFilter();
    if (options.tags) {
      tagsFilter.tags = options.tags;
      filter.tagsFilter = tagsFilter;
    }

    return filter;
  }

  /**
   * Gets the most recent tabular data captured from the specified data source,
   * as long as it was synced within the last year.
   *
   * @example
   *
   * ```ts
   * const data = await dataClient.getLatestTabularData(
   *   '123abc45-1234-5678-90ab-cdef12345678',
   *   'my-sensor',
   *   'rdk:component:sensor',
   *   'Readings'
   * );
   * ```
   *
   * For more information, see [Data
   * API](https://docs.viam.com/dev/reference/apis/data-client/#getlatesttabulardata).
   *
   * @param partId The ID of the part that owns the data
   * @param resourceName The name of the requested resource that captured the
   *   data. Ex: "my-sensor"
   * @param resourceSubtype The subtype of the requested resource that captured
   *   the data. Ex: "rdk:component:sensor"
   * @param methodName The data capture method name. Ex: "Readings"
   * @returns A tuple containing [timeCaptured, timeSynced, payload] or null if
   *   no data has been synced for the specified resource OR the most recently
   *   captured data was over a year ago
   */
  async getLatestTabularData(
    partId: string,
    resourceName: string,
    resourceSubtype: string,
    methodName: string,
    additionalParams?: Record<string, JsonValue>
  ): Promise<[Date, Date, Record<string, JsonValue>] | null> {
    let additionalParameters: Struct | undefined;
    if (additionalParams) {
      additionalParameters = Struct.fromJson(additionalParams);
    }

    const resp = await this.dataClient.getLatestTabularData({
      partId,
      resourceName,
      resourceSubtype,
      methodName,
      additionalParameters,
    });

    if (!resp.payload || !resp.timeCaptured || !resp.timeSynced) {
      return null;
    }

    return [
      resp.timeCaptured.toDate(),
      resp.timeSynced.toDate(),
      resp.payload.toJson() as Record<string, JsonValue>,
    ];
  }

  /**
   * List all data pipelines for an organization.
   *
   * @example
   *
   * ```ts
   * const pipelines = await dataClient.listDataPipelines(
   *   '123abc45-1234-5678-90ab-cdef12345678'
   * );
   * ```
   *
   * @param organizationId The ID of the organization
   * @returns The list of data pipelines
   */
  async listDataPipelines(organizationId: string): Promise<DataPipeline[]> {
    const resp = await this.dataPipelinesClient.listDataPipelines({
      organizationId,
    });
    return resp.dataPipelines;
  }

  /**
   * Get a data pipeline configuration by its ID.
   *
   * @example
   *
   * ```ts
   * const pipeline = await dataClient.getPipeline(
   *   '123abc45-1234-5678-90ab-cdef12345678'
   * );
   * ```
   *
   * @param pipelineId The ID of the data pipeline
   * @returns The data pipeline configuration or null if it does not exist
   */
  async getDataPipeline(pipelineId: string): Promise<DataPipeline | null> {
    const resp = await this.dataPipelinesClient.getDataPipeline({
      id: pipelineId,
    });
    return resp.dataPipeline ?? null;
  }

  /**
   * Creates a new data pipeline using the given query and schedule.
   *
   * @example
   *
   * ```ts
   * // {@link JsonValue} is imported from @bufbuild/protobuf
   * const mqlQuery: Record<string, JsonValue>[] = [
   *   {
   *     $match: {
   *       component_name: 'sensor-1',
   *     },
   *   },
   *   {
   *     $limit: 5,
   *   },
   * ];
   *
   * const pipelineId = await dataClient.createDataPipeline(
   *   '123abc45-1234-5678-90ab-cdef12345678',
   *   'my-pipeline',
   *   mqlQuery,
   *   '0 0 * * *'
   *   false,
   *   0
   * );
   * ```
   *
   * @param organizationId The ID of the organization
   * @param name The name of the data pipeline
   * @param query The MQL query to run as a list of BSON documents
   * @param schedule The schedule to run the query on (cron expression)
   * @param dataSourceType The type of data source to use for the data pipeline
   * @param enableBackfill Whether to enable backfill for the data pipeline
   * @returns The ID of the created data pipeline
   */
  async createDataPipeline(
    organizationId: string,
    name: string,
    query: Uint8Array[] | Record<string, Date | JsonValue>[],
    schedule: string,
    enableBackfill: boolean,
    dataSourceType?: TabularDataSourceType
  ): Promise<string> {
    const mqlBinary: Uint8Array[] =
      query[0] instanceof Uint8Array
        ? (query as Uint8Array[])
        : query.map((value) => BSON.serialize(value));

    const inputDataSourceType =
      dataSourceType ?? TabularDataSourceType.STANDARD;

    const resp = await this.dataPipelinesClient.createDataPipeline({
      organizationId,
      name,
      mqlBinary,
      schedule,
      enableBackfill,
      dataSourceType: inputDataSourceType,
    });
    return resp.id;
  }

  /**
   * Deletes a data pipeline by its ID.
   *
   * @example
   *
   * ```ts
   * await dataClient.deleteDataPipeline(
   *   '123abc45-1234-5678-90ab-cdef12345678'
   * );
   * ```
   *
   * @param pipelineId The ID of the data pipeline
   */
  async deleteDataPipeline(pipelineId: string): Promise<void> {
    await this.dataPipelinesClient.deleteDataPipeline({
      id: pipelineId,
    });
  }

  /**
   * List all runs of a data pipeline.
   *
   * @example
   *
   * ```ts
   * const page = await dataClient.listDataPipelineRuns(
   *   '123abc45-1234-5678-90ab-cdef12345678'
   * );
   * page.runs.forEach((run) => {
   *   console.log(run);
   * });
   * page = await page.nextPage();
   * page.runs.forEach((run) => {
   *   console.log(run);
   * });
   * ```
   *
   * @param pipelineId The ID of the data pipeline
   * @param pageSize The number of runs to return per page
   * @returns A page of data pipeline runs
   */
  async listDataPipelineRuns(
    pipelineId: string,
    pageSize?: number
  ): Promise<ListDataPipelineRunsPage> {
    const resp = await this.dataPipelinesClient.listDataPipelineRuns({
      id: pipelineId,
      pageSize,
    });
    return new ListDataPipelineRunsPage(
      this.dataPipelinesClient,
      pipelineId,
      resp.runs,
      pageSize,
      resp.nextPageToken
    );
  }

  /**
   * CreateIndex starts a custom index build
   *
   * @example
   *
   * ```ts
   * await dataClient.createIndex(
   *   '123abc45-1234-5678-90ab-cdef12345678',
   *   IndexableCollection.HOT_STORE,
   *   [new TextEncoder().encode(JSON.stringify({ field: 1 }))]
   * );
   * ```
   *
   * @param organizationId The ID of the organization
   * @param collectionType The type of collection to create the index on
   * @param indexSpec The MongoDB index specification in JSON format, as a
   *   Uint8Array
   * @param pipelineName Optional name of the pipeline if collectionType is
   *   PIPELINE_SINK
   */
  async createIndex(
    organizationId: string,
    collectionType: IndexableCollection,
    indexSpec: {
      keys: Record<string, number>;
      options?: Record<string, unknown>;
    },
    pipelineName?: string
  ) {
    const serializedIndexSpec = [BSON.serialize(indexSpec.keys)];

    if (indexSpec.options) {
      serializedIndexSpec.push(BSON.serialize(indexSpec.options));
    }

    await this.dataClient.createIndex({
      organizationId,
      collectionType,
      indexSpec: serializedIndexSpec,
      pipelineName,
    });
  }

  /**
   * ListIndexes returns all the indexes for a given collection
   *
   * @example
   *
   * ```ts
   * const indexes = await dataClient.listIndexes(
   *   '123abc45-1234-5678-90ab-cdef12345678',
   *   IndexableCollection.HOT_STORE
   * );
   * ```
   *
   * @param organizationId The ID of the organization
   * @param collectionType The type of collection to list indexes for
   * @param pipelineName Optional name of the pipeline if collectionType is
   *   PIPELINE_SINK
   * @returns An array of indexes
   */
  async listIndexes(
    organizationId: string,
    collectionType: IndexableCollection,
    pipelineName?: string
  ): Promise<Index[]> {
    const resp = await this.dataClient.listIndexes({
      organizationId,
      collectionType,
      pipelineName,
    });
    return resp.indexes;
  }

  /**
   * DeleteIndex drops the specified custom index from a collection
   *
   * @example
   *
   * ```ts
   * await dataClient.deleteIndex(
   *   '123abc45-1234-5678-90ab-cdef12345678',
   *   IndexableCollection.HOT_STORE,
   *   'my_index'
   * );
   * ```
   *
   * @param organizationId The ID of the organization
   * @param collectionType The type of collection to delete the index from
   * @param indexName The name of the index to delete
   * @param pipelineName Optional name of the pipeline if collectionType is
   *   PIPELINE_SINK
   */
  async deleteIndex(
    organizationId: string,
    collectionType: IndexableCollection,
    indexName: string,
    pipelineName?: string
  ) {
    await this.dataClient.deleteIndex({
      organizationId,
      collectionType,
      indexName,
      pipelineName,
    });
  }
}

export class ListDataPipelineRunsPage {
  constructor(
    private readonly dataPipelinesClient: Client<typeof DataPipelinesService>,
    private readonly pipelineId: string,
    public readonly runs: DataPipelineRun[] = [],
    private readonly pageSize?: number,
    private readonly nextPageToken?: string
  ) {}

  /**
   * Retrieves the next page of data pipeline runs.
   *
   * @example
   *
   * ```ts
   * const page = await dataClient.listDataPipelineRuns(
   *   '123abc45-1234-5678-90ab-cdef12345678'
   * );
   * const nextPage = await page.nextPage();
   * ```
   *
   * @returns A page of data pipeline runs
   */
  async nextPage(): Promise<ListDataPipelineRunsPage> {
    if (this.nextPageToken === undefined || this.nextPageToken === '') {
      // empty token means no more runs to list.
      return new ListDataPipelineRunsPage(
        this.dataPipelinesClient,
        this.pipelineId,
        [],
        this.pageSize,
        ''
      );
    }

    const resp = await this.dataPipelinesClient.listDataPipelineRuns({
      id: this.pipelineId,
      pageSize: this.pageSize,
      pageToken: this.nextPageToken,
    });
    return new ListDataPipelineRunsPage(
      this.dataPipelinesClient,
      this.pipelineId,
      resp.runs,
      this.pageSize,
      resp.nextPageToken
    );
  }
}

export {
  type BinaryID,
  type IndexableCollection,
  type Order,
} from '../gen/app/data/v1/data_pb';
export { type UploadMetadata } from '../gen/app/datasync/v1/data_sync_pb';
