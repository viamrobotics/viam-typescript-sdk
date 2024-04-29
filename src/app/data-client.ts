import { type RpcOptions } from '@improbable-eng/grpc-web/dist/typings/client.d';
import * as googleStructPb from 'google-protobuf/google/protobuf/struct_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import pb from '../gen/app/data/v1/data_pb';
import { DataServiceClient } from '../gen/app/data/v1/data_pb_service';
import { promisify } from '../utils';

export type BinaryID = pb.BinaryID.AsObject;

export type FilterOptions = Partial<pb.Filter.AsObject> & {
  endTime?: Date;
  startTime?: Date;
  tags?: string[];
};

interface TabularData {
  data?: Record<string, googleStructPb.JavaScriptValue>;
  metadata?: pb.CaptureMetadata.AsObject;
  timeRequested?: Date;
  timeReceived?: Date;
}

export class DataClient {
  private service: DataServiceClient;

  constructor(serviceHost: string, grpcOptions: RpcOptions) {
    this.service = new DataServiceClient(serviceHost, grpcOptions);
  }

  /**
   * Obtain unified tabular data and metadata, queried with SQL.
   *
   * @param organizationId The ID of the organization that owns the data
   * @param query The SQL query to run
   * @returns An array of data objects
   */
  async tabularDataBySQL(organizationId: string, query: string) {
    const { service } = this;

    const req = new pb.TabularDataBySQLRequest();
    req.setOrganizationId(organizationId);
    req.setSqlQuery(query);

    const response = await promisify<
      pb.TabularDataBySQLRequest,
      pb.TabularDataBySQLResponse
    >(service.tabularDataBySQL.bind(service), req);
    const dataList = response.getDataList();
    return dataList.map((struct) => struct.toJavaScript());
  }

  /**
   * Obtain unified tabular data and metadata, queried with MQL.
   *
   * @param organizationId The ID of the organization that owns the data
   * @param query The MQL query to run as a list of BSON documents
   * @returns An array of data objects
   */
  async tabularDataByMQL(organizationId: string, query: Uint8Array[]) {
    const { service } = this;

    const req = new pb.TabularDataByMQLRequest();
    req.setOrganizationId(organizationId);
    req.setMqlBinaryList(query);

    const response = await promisify<
      pb.TabularDataByMQLRequest,
      pb.TabularDataByMQLResponse
    >(service.tabularDataByMQL.bind(service), req);
    const dataList = response.getDataList();
    return dataList.map((struct) => struct.toJavaScript());
  }

  /**
   * Filter and download tabular data. The returned metadata might be empty if
   * the metadata index of the data is out of the bounds of the returned
   * metadata list.
   *
   * @param filter Optional `pb.Filter` specifying tabular data to retrieve. No
   *   `filter` implies all tabular data.
   * @returns An array of data objects
   */
  async tabularDataByFilter(filter?: pb.Filter) {
    const { service } = this;

    let last = '';
    const dataArray: TabularData[] = [];
    const dataReq = new pb.DataRequest();
    dataReq.setFilter(filter ?? new pb.Filter());
    dataReq.setLimit(100);

    for (;;) {
      dataReq.setLast(last);

      const req = new pb.TabularDataByFilterRequest();
      req.setDataRequest(dataReq);
      req.setCountOnly(false);

      // eslint-disable-next-line no-await-in-loop
      const response = await promisify<
        pb.TabularDataByFilterRequest,
        pb.TabularDataByFilterResponse
      >(service.tabularDataByFilter.bind(service), req);
      const dataList = response.getDataList();
      if (dataList.length === 0) {
        break;
      }
      const mdListLength = response.getMetadataList().length;

      dataArray.push(
        ...dataList.map((data) => {
          const mdIndex = data.getMetadataIndex();
          const metadata =
            mdListLength !== 0 && mdIndex >= mdListLength
              ? new pb.CaptureMetadata().toObject()
              : response.getMetadataList()[mdIndex]?.toObject();
          return {
            data: data.getData()?.toJavaScript(),
            metadata,
            timeRequested: data.getTimeRequested()?.toDate(),
            timeReceived: data.getTimeReceived()?.toDate(),
          };
        })
      );
      last = response.getLast();
    }

    return dataArray;
  }

  /**
   * Filter and download binary data. The returned metadata might be empty if
   * the metadata index of the data is out of the bounds of the returned
   * metadata list.
   *
   * @param filter Optional `pb.Filter` specifying binary data to retrieve. No
   *   `filter` implies all tabular data.
   * @returns An array of data objects
   */
  async binaryDataByFilter(filter?: pb.Filter) {
    const { service } = this;

    let last = '';
    const dataArray: pb.BinaryData.AsObject[] = [];
    const dataReq = new pb.DataRequest();
    dataReq.setFilter(filter ?? new pb.Filter());
    dataReq.setLimit(100);

    for (;;) {
      dataReq.setLast(last);

      const req = new pb.BinaryDataByFilterRequest();
      req.setDataRequest(dataReq);
      req.setCountOnly(false);

      // eslint-disable-next-line no-await-in-loop
      const response = await promisify<
        pb.BinaryDataByFilterRequest,
        pb.BinaryDataByFilterResponse
      >(service.binaryDataByFilter.bind(service), req);
      const dataList = response.getDataList();
      if (dataList.length === 0) {
        break;
      }
      dataArray.push(...dataList.map((data) => data.toObject()));
      last = response.getLast();
    }

    return dataArray;
  }

  /**
   * Get binary data using the BinaryID.
   *
   * @param ids The IDs of the requested binary data
   * @returns An array of data objects
   */
  async binaryDataByIds(ids: BinaryID[]) {
    const { service } = this;

    const binaryIds: pb.BinaryID[] = ids.map(
      ({ fileId, organizationId, locationId }) => {
        const binaryId = new pb.BinaryID();
        binaryId.setFileId(fileId);
        binaryId.setOrganizationId(organizationId);
        binaryId.setLocationId(locationId);
        return binaryId;
      }
    );

    const req = new pb.BinaryDataByIDsRequest();
    req.setBinaryIdsList(binaryIds);
    req.setIncludeBinary(true);

    const response = await promisify<
      pb.BinaryDataByIDsRequest,
      pb.BinaryDataByIDsResponse
    >(service.binaryDataByIDs.bind(service), req);
    return response.toObject().dataList;
  }

  /**
   * Delete tabular data older than a specified number of days.
   *
   * @param orgId The ID of organization to delete data from
   * @param deleteOlderThanDays Delete data that was captured more than this
   *   many days ago. For example if `deleteOlderThanDays` is 10, this deletes
   *   any data that was captured more than 10 days ago. If it is 0, all
   *   existing data is deleted.
   * @returns The number of items deleted
   */
  async deleteTabularData(orgId: string, deleteOlderThanDays: number) {
    const { service } = this;

    const req = new pb.DeleteTabularDataRequest();
    req.setOrganizationId(orgId);
    req.setDeleteOlderThanDays(deleteOlderThanDays);

    const response = await promisify<
      pb.DeleteTabularDataRequest,
      pb.DeleteTabularDataResponse
    >(service.deleteTabularData.bind(service), req);
    return response.getDeletedCount();
  }

  /**
   * Filter and delete binary data.
   *
   * @param filter Optional `pb.Filter` specifying binary data to delete. No
   *   `filter` implies all binary data.
   * @param includeInternalData Whether or not to delete internal data. Default
   *   is true
   * @returns The number of items deleted
   */
  async deleteBinaryDataByFilter(
    filter?: pb.Filter,
    includeInternalData = true
  ) {
    const { service } = this;

    const req = new pb.DeleteBinaryDataByFilterRequest();
    req.setFilter(filter ?? new pb.Filter());
    req.setIncludeInternalData(includeInternalData);
    const response = await promisify<
      pb.DeleteBinaryDataByFilterRequest,
      pb.DeleteTabularDataResponse
    >(service.deleteBinaryDataByFilter.bind(service), req);
    return response.getDeletedCount();
  }

  /**
   * Delete binary data, specified by ID.
   *
   * @param ids The IDs of the data to be deleted. Must be non-empty.
   * @returns The number of items deleted
   */
  async deleteBinaryDataByIds(ids: BinaryID[]) {
    const { service } = this;

    const binaryIds: pb.BinaryID[] = ids.map(
      ({ fileId, organizationId, locationId }) => {
        const binaryId = new pb.BinaryID();
        binaryId.setFileId(fileId);
        binaryId.setOrganizationId(organizationId);
        binaryId.setLocationId(locationId);
        return binaryId;
      }
    );

    const req = new pb.DeleteBinaryDataByIDsRequest();
    req.setBinaryIdsList(binaryIds);

    const response = await promisify<
      pb.DeleteBinaryDataByIDsRequest,
      pb.DeleteBinaryDataByIDsResponse
    >(service.deleteBinaryDataByIDs.bind(service), req);
    return response.getDeletedCount();
  }

  /**
   * Add tags to binary data, specified by ID.
   *
   * @param tags The list of tags to add to specified binary data. Must be
   *   non-empty.
   * @param ids The IDs of the data to be tagged. Must be non-empty.
   */
  async addTagsToBinaryDataByIds(tags: string[], ids: BinaryID[]) {
    const { service } = this;

    const binaryIds: pb.BinaryID[] = ids.map(
      ({ fileId, organizationId, locationId }) => {
        const binaryId = new pb.BinaryID();
        binaryId.setFileId(fileId);
        binaryId.setOrganizationId(organizationId);
        binaryId.setLocationId(locationId);
        return binaryId;
      }
    );

    const req = new pb.AddTagsToBinaryDataByIDsRequest();
    req.setBinaryIdsList(binaryIds);
    req.setTagsList(tags);

    await promisify<
      pb.AddTagsToBinaryDataByIDsRequest,
      pb.AddTagsToBinaryDataByIDsResponse
    >(service.addTagsToBinaryDataByIDs.bind(service), req);
  }

  /**
   * Add tags to binary data, specified by filter.
   *
   * @param tags The tags to add to the data
   * @param filter Optional `pb.Filter` specifying binary data to add tags to.
   *   No `filter` implies all binary data.
   */
  async addTagsToBinaryDataByFilter(tags: string[], filter?: pb.Filter) {
    const { service } = this;

    const req = new pb.AddTagsToBinaryDataByFilterRequest();
    req.setTagsList(tags);
    req.setFilter(filter ?? new pb.Filter());

    await promisify<
      pb.AddTagsToBinaryDataByFilterRequest,
      pb.AddTagsToBinaryDataByFilterResponse
    >(service.addTagsToBinaryDataByFilter.bind(service), req);
  }

  /**
   * Remove tags from binary data, specified by ID.
   *
   * @param tags List of tags to remove from specified binary data. Must be
   *   non-empty.
   * @param ids The IDs of the data to be edited. Must be non-empty.
   * @returns The number of items deleted
   */
  async removeTagsFromBinaryDataByIds(tags: string[], ids: BinaryID[]) {
    const { service } = this;

    const binaryIds: pb.BinaryID[] = ids.map(
      ({ fileId, organizationId, locationId }) => {
        const binaryId = new pb.BinaryID();
        binaryId.setFileId(fileId);
        binaryId.setOrganizationId(organizationId);
        binaryId.setLocationId(locationId);
        return binaryId;
      }
    );

    const req = new pb.RemoveTagsFromBinaryDataByIDsRequest();
    req.setBinaryIdsList(binaryIds);
    req.setTagsList(tags);

    const response = await promisify<
      pb.RemoveTagsFromBinaryDataByIDsRequest,
      pb.RemoveTagsFromBinaryDataByIDsResponse
    >(service.removeTagsFromBinaryDataByIDs.bind(service), req);
    return response.getDeletedCount();
  }

  /**
   * Remove tags from binary data, specified by filter.
   *
   * @param tags List of tags to remove from specified binary data. Must be
   *   non-empty.
   * @param filter Optional `pb.Filter` specifying binary data to add tags to.
   *   No `filter` implies all binary data.
   */
  async removeTagsFromBinaryDataByFilter(tags: string[], filter?: pb.Filter) {
    const { service } = this;

    const req = new pb.RemoveTagsFromBinaryDataByFilterRequest();
    req.setTagsList(tags);
    req.setFilter(filter ?? new pb.Filter());

    const response = await promisify<
      pb.RemoveTagsFromBinaryDataByFilterRequest,
      pb.RemoveTagsFromBinaryDataByFilterResponse
    >(service.removeTagsFromBinaryDataByFilter.bind(service), req);
    return response.getDeletedCount();
  }

  /**
   * Get a list of tags using a filter.
   *
   * @param filter Optional `pb.Filter` specifying what data to get tags from.
   *   No `filter` implies all data.
   * @returns The list of tags
   */
  async tagsByFilter(filter?: pb.Filter) {
    const { service } = this;

    const req = new pb.TagsByFilterRequest();
    req.setFilter(filter);

    const response = await promisify<
      pb.TagsByFilterRequest,
      pb.TagsByFilterResponse
    >(service.tagsByFilter.bind(service), req);
    return response.getTagsList();
  }

  /**
   * Add bounding box to an image.
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
    id: BinaryID,
    label: string,
    xMinNormalized: number,
    yMinNormalized: number,
    xMaxNormalized: number,
    yMaxNormalized: number
  ) {
    const { service } = this;

    const binaryId = new pb.BinaryID();
    binaryId.setFileId(id.fileId);
    binaryId.setOrganizationId(id.organizationId);
    binaryId.setLocationId(id.locationId);

    const req = new pb.AddBoundingBoxToImageByIDRequest();
    req.setBinaryId(binaryId);
    req.setLabel(label);
    req.setXMinNormalized(xMinNormalized);
    req.setYMinNormalized(yMinNormalized);
    req.setXMaxNormalized(xMaxNormalized);
    req.setYMaxNormalized(yMaxNormalized);

    const response = await promisify<
      pb.AddBoundingBoxToImageByIDRequest,
      pb.AddBoundingBoxToImageByIDResponse
    >(service.addBoundingBoxToImageByID.bind(service), req);
    return response.getBboxId();
  }

  /**
   * Remove a bounding box from an image.
   *
   * @param binId The ID of the image to remove the bounding box from
   * @param bboxId The ID of the bounding box to remove
   */
  async removeBoundingBoxFromImageById(binId: BinaryID, bboxId: string) {
    const { service } = this;

    const binaryId = new pb.BinaryID();
    binaryId.setFileId(binId.fileId);
    binaryId.setOrganizationId(binId.organizationId);
    binaryId.setLocationId(binId.locationId);

    const req = new pb.RemoveBoundingBoxFromImageByIDRequest();
    req.setBinaryId(binaryId);
    req.setBboxId(bboxId);

    await promisify<
      pb.RemoveBoundingBoxFromImageByIDRequest,
      pb.RemoveBoundingBoxFromImageByIDResponse
    >(service.removeBoundingBoxFromImageByID.bind(service), req);
  }

  /**
   * Get a list of bounding box labels using a Filter.
   *
   * @param filter Optional `pb.Filter` specifying what data to get tags from.
   *   No `filter` implies all labels.
   * @returns The list of bounding box labels
   */
  async boundingBoxLabelsByFilter(filter?: pb.Filter) {
    const { service } = this;

    const req = new pb.BoundingBoxLabelsByFilterRequest();
    req.setFilter(filter ?? new pb.Filter());

    const response = await promisify<
      pb.BoundingBoxLabelsByFilterRequest,
      pb.BoundingBoxLabelsByFilterResponse
    >(service.boundingBoxLabelsByFilter.bind(service), req);
    return response.getLabelsList();
  }

  /**
   * Configure a database user for the Viam organization's MongoDB Atlas Data
   * Federation instance. It can also be used to reset the password of the
   * existing database user.
   *
   * @param orgId The ID of the organization
   * @param password The password of the user
   */
  async configureDatabaseUser(orgId: string, password: string) {
    const { service } = this;

    const req = new pb.ConfigureDatabaseUserRequest();
    req.setOrganizationId(orgId);
    req.setPassword(password);

    await promisify<
      pb.ConfigureDatabaseUserRequest,
      pb.ConfigureDatabaseUserResponse
    >(service.configureDatabaseUser.bind(service), req);
  }

  /**
   * Get a connection to access a MongoDB Atlas Data federation instance.
   *
   * @param orId Organization to retrieve connection for
   * @returns Hostname of the federated database
   */
  async getDatabaseConnection(orgId: string) {
    const { service } = this;

    const req = new pb.GetDatabaseConnectionRequest();
    req.setOrganizationId(orgId);

    const response = await promisify<
      pb.GetDatabaseConnectionRequest,
      pb.GetDatabaseConnectionResponse
    >(service.getDatabaseConnection.bind(service), req);
    return response.getHostname();
  }

  /**
   * Add BinaryData to the provided dataset.
   *
   * @param ids The IDs of binary data to add to dataset
   * @param datasetId The ID of the dataset to be added to
   */
  async addBinaryDataToDatasetByIds(ids: BinaryID[], datasetId: string) {
    const { service } = this;

    const binaryIds: pb.BinaryID[] = ids.map(
      ({ fileId, organizationId, locationId }) => {
        const binaryId = new pb.BinaryID();
        binaryId.setFileId(fileId);
        binaryId.setOrganizationId(organizationId);
        binaryId.setLocationId(locationId);
        return binaryId;
      }
    );

    const req = new pb.AddBinaryDataToDatasetByIDsRequest();
    req.setBinaryIdsList(binaryIds);
    req.setDatasetId(datasetId);

    await promisify<
      pb.AddBinaryDataToDatasetByIDsRequest,
      pb.AddBinaryDataToDatasetByIDsResponse
    >(service.addBinaryDataToDatasetByIDs.bind(service), req);
  }

  /**
   * Remove BinaryData from the provided dataset.
   *
   * @param ids The IDs of the binary data to remove from dataset
   * @param datasetId The ID of the dataset to be removed from
   */
  async removeBinaryDataFromDatasetByIds(ids: BinaryID[], datasetId: string) {
    const { service } = this;

    const binaryIds: pb.BinaryID[] = ids.map(
      ({ fileId, organizationId, locationId }) => {
        const binaryId = new pb.BinaryID();
        binaryId.setFileId(fileId);
        binaryId.setOrganizationId(organizationId);
        binaryId.setLocationId(locationId);
        return binaryId;
      }
    );

    const req = new pb.RemoveBinaryDataFromDatasetByIDsRequest();
    req.setBinaryIdsList(binaryIds);
    req.setDatasetId(datasetId);

    await promisify<
      pb.RemoveBinaryDataFromDatasetByIDsRequest,
      pb.RemoveBinaryDataFromDatasetByIDsResponse
    >(service.removeBinaryDataFromDatasetByIDs.bind(service), req);
  }

  // eslint-disable-next-line class-methods-use-this
  createFilter(options: FilterOptions): pb.Filter {
    const filter = new pb.Filter();
    if (options.componentName) {
      filter.setComponentName(options.componentName);
    }
    if (options.componentType) {
      filter.setComponentType(options.componentType);
    }
    if (options.method) {
      filter.setMethod(options.method);
    }
    if (options.robotName) {
      filter.setRobotName(options.robotName);
    }
    if (options.robotId) {
      filter.setRobotId(options.robotId);
    }
    if (options.partName) {
      filter.setPartName(options.partName);
    }
    if (options.partId) {
      filter.setPartId(options.partId);
    }
    if (options.locationIdsList) {
      filter.setLocationIdsList(options.locationIdsList);
    }
    if (options.organizationIdsList) {
      filter.setOrganizationIdsList(options.organizationIdsList);
    }
    if (options.mimeTypeList) {
      filter.setMimeTypeList(options.mimeTypeList);
    }
    if (options.bboxLabelsList) {
      filter.setBboxLabelsList(options.bboxLabelsList);
    }

    if (options.startTime ?? options.endTime) {
      const interval = new pb.CaptureInterval();
      if (options.startTime) {
        interval.setStart(Timestamp.fromDate(options.startTime));
      }
      if (options.endTime) {
        interval.setEnd(Timestamp.fromDate(options.endTime));
      }
      filter.setInterval(interval);
    }

    const tagsFilter = new pb.TagsFilter();
    if (options.tags) {
      tagsFilter.setTagsList(options.tags);
      filter.setTagsFilter(tagsFilter);
    }

    return filter;
  }
}
