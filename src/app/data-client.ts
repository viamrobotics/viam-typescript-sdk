import { type RpcOptions } from '@improbable-eng/grpc-web/dist/typings/client.d';
import * as googleStructPb from 'google-protobuf/google/protobuf/struct_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import dataPb from '../gen/app/data/v1/data_pb';
import datasetPb from '../gen/app/dataset/v1/dataset_pb';
import { DataServiceClient } from '../gen/app/data/v1/data_pb_service';
import { DatasetServiceClient } from '../gen/app/dataset/v1/dataset_pb_service';
import { promisify } from '../utils';

export type BinaryID = dataPb.BinaryID.AsObject;

export type FilterOptions = Partial<dataPb.Filter.AsObject> & {
  endTime?: Date;
  startTime?: Date;
  tags?: string[];
};

interface TabularData {
  data?: Record<string, googleStructPb.JavaScriptValue>;
  metadata?: dataPb.CaptureMetadata.AsObject;
  timeRequested?: Date;
  timeReceived?: Date;
}

type Dataset = Partial<datasetPb.Dataset.AsObject> & {
  created?: Date;
};

export class DataClient {
  private dataService: DataServiceClient;
  private datasetService: DatasetServiceClient;

  constructor(serviceHost: string, grpcOptions: RpcOptions) {
    this.dataService = new DataServiceClient(serviceHost, grpcOptions);
    this.datasetService = new DatasetServiceClient(serviceHost, grpcOptions);
  }

  /**
   * Obtain unified tabular data and metadata, queried with SQL.
   *
   * @param organizationId The ID of the organization that owns the data
   * @param query The SQL query to run
   * @returns An array of data objects
   */
  async tabularDataBySQL(organizationId: string, query: string) {
    const { dataService: service } = this;

    const req = new dataPb.TabularDataBySQLRequest();
    req.setOrganizationId(organizationId);
    req.setSqlQuery(query);

    const response = await promisify<
      dataPb.TabularDataBySQLRequest,
      dataPb.TabularDataBySQLResponse
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
    const { dataService: service } = this;

    const req = new dataPb.TabularDataByMQLRequest();
    req.setOrganizationId(organizationId);
    req.setMqlBinaryList(query);

    const response = await promisify<
      dataPb.TabularDataByMQLRequest,
      dataPb.TabularDataByMQLResponse
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
  async tabularDataByFilter(filter?: dataPb.Filter) {
    const { dataService: service } = this;

    let last = '';
    const dataArray: TabularData[] = [];
    const dataReq = new dataPb.DataRequest();
    dataReq.setFilter(filter ?? new dataPb.Filter());
    dataReq.setLimit(100);

    for (;;) {
      dataReq.setLast(last);

      const req = new dataPb.TabularDataByFilterRequest();
      req.setDataRequest(dataReq);
      req.setCountOnly(false);

      // eslint-disable-next-line no-await-in-loop
      const response = await promisify<
        dataPb.TabularDataByFilterRequest,
        dataPb.TabularDataByFilterResponse
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
              ? new dataPb.CaptureMetadata().toObject()
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
  async binaryDataByFilter(filter?: dataPb.Filter) {
    const { dataService: service } = this;

    let last = '';
    const dataArray: dataPb.BinaryData.AsObject[] = [];
    const dataReq = new dataPb.DataRequest();
    dataReq.setFilter(filter ?? new dataPb.Filter());
    dataReq.setLimit(100);

    for (;;) {
      dataReq.setLast(last);

      const req = new dataPb.BinaryDataByFilterRequest();
      req.setDataRequest(dataReq);
      req.setCountOnly(false);

      // eslint-disable-next-line no-await-in-loop
      const response = await promisify<
        dataPb.BinaryDataByFilterRequest,
        dataPb.BinaryDataByFilterResponse
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
    const { dataService: service } = this;

    const binaryIds: dataPb.BinaryID[] = ids.map(
      ({ fileId, organizationId, locationId }) => {
        const binaryId = new dataPb.BinaryID();
        binaryId.setFileId(fileId);
        binaryId.setOrganizationId(organizationId);
        binaryId.setLocationId(locationId);
        return binaryId;
      }
    );

    const req = new dataPb.BinaryDataByIDsRequest();
    req.setBinaryIdsList(binaryIds);
    req.setIncludeBinary(true);

    const response = await promisify<
      dataPb.BinaryDataByIDsRequest,
      dataPb.BinaryDataByIDsResponse
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
    const { dataService: service } = this;

    const req = new dataPb.DeleteTabularDataRequest();
    req.setOrganizationId(orgId);
    req.setDeleteOlderThanDays(deleteOlderThanDays);

    const response = await promisify<
      dataPb.DeleteTabularDataRequest,
      dataPb.DeleteTabularDataResponse
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
    filter?: dataPb.Filter,
    includeInternalData = true
  ) {
    const { dataService: service } = this;

    const req = new dataPb.DeleteBinaryDataByFilterRequest();
    req.setFilter(filter ?? new dataPb.Filter());
    req.setIncludeInternalData(includeInternalData);
    const response = await promisify<
      dataPb.DeleteBinaryDataByFilterRequest,
      dataPb.DeleteTabularDataResponse
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
    const { dataService: service } = this;

    const binaryIds: dataPb.BinaryID[] = ids.map(
      ({ fileId, organizationId, locationId }) => {
        const binaryId = new dataPb.BinaryID();
        binaryId.setFileId(fileId);
        binaryId.setOrganizationId(organizationId);
        binaryId.setLocationId(locationId);
        return binaryId;
      }
    );

    const req = new dataPb.DeleteBinaryDataByIDsRequest();
    req.setBinaryIdsList(binaryIds);

    const response = await promisify<
      dataPb.DeleteBinaryDataByIDsRequest,
      dataPb.DeleteBinaryDataByIDsResponse
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
    const { dataService: service } = this;

    const binaryIds: dataPb.BinaryID[] = ids.map(
      ({ fileId, organizationId, locationId }) => {
        const binaryId = new dataPb.BinaryID();
        binaryId.setFileId(fileId);
        binaryId.setOrganizationId(organizationId);
        binaryId.setLocationId(locationId);
        return binaryId;
      }
    );

    const req = new dataPb.AddTagsToBinaryDataByIDsRequest();
    req.setBinaryIdsList(binaryIds);
    req.setTagsList(tags);

    await promisify<
      dataPb.AddTagsToBinaryDataByIDsRequest,
      dataPb.AddTagsToBinaryDataByIDsResponse
    >(service.addTagsToBinaryDataByIDs.bind(service), req);
  }

  /**
   * Add tags to binary data, specified by filter.
   *
   * @param tags The tags to add to the data
   * @param filter Optional `pb.Filter` specifying binary data to add tags to.
   *   No `filter` implies all binary data.
   */
  async addTagsToBinaryDataByFilter(tags: string[], filter?: dataPb.Filter) {
    const { dataService: service } = this;

    const req = new dataPb.AddTagsToBinaryDataByFilterRequest();
    req.setTagsList(tags);
    req.setFilter(filter ?? new dataPb.Filter());

    await promisify<
      dataPb.AddTagsToBinaryDataByFilterRequest,
      dataPb.AddTagsToBinaryDataByFilterResponse
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
    const { dataService: service } = this;

    const binaryIds: dataPb.BinaryID[] = ids.map(
      ({ fileId, organizationId, locationId }) => {
        const binaryId = new dataPb.BinaryID();
        binaryId.setFileId(fileId);
        binaryId.setOrganizationId(organizationId);
        binaryId.setLocationId(locationId);
        return binaryId;
      }
    );

    const req = new dataPb.RemoveTagsFromBinaryDataByIDsRequest();
    req.setBinaryIdsList(binaryIds);
    req.setTagsList(tags);

    const response = await promisify<
      dataPb.RemoveTagsFromBinaryDataByIDsRequest,
      dataPb.RemoveTagsFromBinaryDataByIDsResponse
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
   * @returns The number of items deleted
   */
  async removeTagsFromBinaryDataByFilter(
    tags: string[],
    filter?: dataPb.Filter
  ) {
    const { dataService: service } = this;

    const req = new dataPb.RemoveTagsFromBinaryDataByFilterRequest();
    req.setTagsList(tags);
    req.setFilter(filter ?? new dataPb.Filter());

    const response = await promisify<
      dataPb.RemoveTagsFromBinaryDataByFilterRequest,
      dataPb.RemoveTagsFromBinaryDataByFilterResponse
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
  async tagsByFilter(filter?: dataPb.Filter) {
    const { dataService: service } = this;

    const req = new dataPb.TagsByFilterRequest();
    req.setFilter(filter);

    const response = await promisify<
      dataPb.TagsByFilterRequest,
      dataPb.TagsByFilterResponse
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
    const { dataService: service } = this;

    const binaryId = new dataPb.BinaryID();
    binaryId.setFileId(id.fileId);
    binaryId.setOrganizationId(id.organizationId);
    binaryId.setLocationId(id.locationId);

    const req = new dataPb.AddBoundingBoxToImageByIDRequest();
    req.setBinaryId(binaryId);
    req.setLabel(label);
    req.setXMinNormalized(xMinNormalized);
    req.setYMinNormalized(yMinNormalized);
    req.setXMaxNormalized(xMaxNormalized);
    req.setYMaxNormalized(yMaxNormalized);

    const response = await promisify<
      dataPb.AddBoundingBoxToImageByIDRequest,
      dataPb.AddBoundingBoxToImageByIDResponse
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
    const { dataService: service } = this;

    const binaryId = new dataPb.BinaryID();
    binaryId.setFileId(binId.fileId);
    binaryId.setOrganizationId(binId.organizationId);
    binaryId.setLocationId(binId.locationId);

    const req = new dataPb.RemoveBoundingBoxFromImageByIDRequest();
    req.setBinaryId(binaryId);
    req.setBboxId(bboxId);

    await promisify<
      dataPb.RemoveBoundingBoxFromImageByIDRequest,
      dataPb.RemoveBoundingBoxFromImageByIDResponse
    >(service.removeBoundingBoxFromImageByID.bind(service), req);
  }

  /**
   * Get a list of bounding box labels using a Filter.
   *
   * @param filter Optional `pb.Filter` specifying what data to get tags from.
   *   No `filter` implies all labels.
   * @returns The list of bounding box labels
   */
  async boundingBoxLabelsByFilter(filter?: dataPb.Filter) {
    const { dataService: service } = this;

    const req = new dataPb.BoundingBoxLabelsByFilterRequest();
    req.setFilter(filter ?? new dataPb.Filter());

    const response = await promisify<
      dataPb.BoundingBoxLabelsByFilterRequest,
      dataPb.BoundingBoxLabelsByFilterResponse
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
    const { dataService: service } = this;

    const req = new dataPb.ConfigureDatabaseUserRequest();
    req.setOrganizationId(orgId);
    req.setPassword(password);

    await promisify<
      dataPb.ConfigureDatabaseUserRequest,
      dataPb.ConfigureDatabaseUserResponse
    >(service.configureDatabaseUser.bind(service), req);
  }

  /**
   * Get a connection to access a MongoDB Atlas Data federation instance.
   *
   * @param orId Organization to retrieve connection for
   * @returns Hostname of the federated database
   */
  async getDatabaseConnection(orgId: string) {
    const { dataService: service } = this;

    const req = new dataPb.GetDatabaseConnectionRequest();
    req.setOrganizationId(orgId);

    const response = await promisify<
      dataPb.GetDatabaseConnectionRequest,
      dataPb.GetDatabaseConnectionResponse
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
    const { dataService: service } = this;

    const binaryIds: dataPb.BinaryID[] = ids.map(
      ({ fileId, organizationId, locationId }) => {
        const binaryId = new dataPb.BinaryID();
        binaryId.setFileId(fileId);
        binaryId.setOrganizationId(organizationId);
        binaryId.setLocationId(locationId);
        return binaryId;
      }
    );

    const req = new dataPb.AddBinaryDataToDatasetByIDsRequest();
    req.setBinaryIdsList(binaryIds);
    req.setDatasetId(datasetId);

    await promisify<
      dataPb.AddBinaryDataToDatasetByIDsRequest,
      dataPb.AddBinaryDataToDatasetByIDsResponse
    >(service.addBinaryDataToDatasetByIDs.bind(service), req);
  }

  /**
   * Remove BinaryData from the provided dataset.
   *
   * @param ids The IDs of the binary data to remove from dataset
   * @param datasetId The ID of the dataset to be removed from
   */
  async removeBinaryDataFromDatasetByIds(ids: BinaryID[], datasetId: string) {
    const { dataService: service } = this;

    const binaryIds: dataPb.BinaryID[] = ids.map(
      ({ fileId, organizationId, locationId }) => {
        const binaryId = new dataPb.BinaryID();
        binaryId.setFileId(fileId);
        binaryId.setOrganizationId(organizationId);
        binaryId.setLocationId(locationId);
        return binaryId;
      }
    );

    const req = new dataPb.RemoveBinaryDataFromDatasetByIDsRequest();
    req.setBinaryIdsList(binaryIds);
    req.setDatasetId(datasetId);

    await promisify<
      dataPb.RemoveBinaryDataFromDatasetByIDsRequest,
      dataPb.RemoveBinaryDataFromDatasetByIDsResponse
    >(service.removeBinaryDataFromDatasetByIDs.bind(service), req);
  }

  /**
   * Create a new dataset.
   *
   * @param name The name of the new dataset
   * @param orgId The ID of the organization the dataset is being created in
   * @returns The ID of the dataset
   */
  async createDataset(name: string, orgId: string) {
    const { datasetService: service } = this;

    const req = new datasetPb.CreateDatasetRequest();
    req.setName(name);
    req.setOrganizationId(orgId);

    const response = await promisify<
      datasetPb.CreateDatasetRequest,
      datasetPb.CreateDatasetResponse
    >(service.createDataset.bind(service), req);
    return response.getId();
  }

  /**
   * Delete a dataset.
   *
   * @param id The ID of the dataset.
   */
  async deleteDataset(id: string) {
    const { datasetService: service } = this;

    const req = new datasetPb.DeleteDatasetRequest();
    req.setId(id);

    await promisify<
      datasetPb.DeleteDatasetRequest,
      datasetPb.DeleteDatasetResponse
    >(service.deleteDataset.bind(service), req);
  }

  /**
   * Rename a dataset.
   *
   * @param id The ID of the dataset
   * @param name The new name of the dataset
   */
  async renameDataset(id: string, name: string) {
    const { datasetService: service } = this;

    const req = new datasetPb.RenameDatasetRequest();
    req.setId(id);
    req.setName(name);

    await promisify<
      datasetPb.RenameDatasetRequest,
      datasetPb.RenameDatasetResponse
    >(service.renameDataset.bind(service), req);
  }

  /**
   * List all of the datasets for an organization.
   *
   * @param orgId The ID of the organization
   * @returns The list of datasets in the organization
   */
  async listDatasetsByOrganizationID(orgId: string) {
    const { datasetService: service } = this;

    const req = new datasetPb.ListDatasetsByOrganizationIDRequest();
    req.setOrganizationId(orgId);

    const response = await promisify<
      datasetPb.ListDatasetsByOrganizationIDRequest,
      datasetPb.ListDatasetsByOrganizationIDResponse
    >(service.listDatasetsByOrganizationID.bind(service), req);

    const datasets: Dataset[] = [];
    for (const set of response.getDatasetsList()) {
      const dataset: Dataset = set.toObject();
      dataset.created = set.getTimeCreated()?.toDate();
      datasets.push(dataset);
    }
    return datasets;
  }

  /**
   * List all of the datasets specified by the given dataset IDs.
   *
   * @param ids The list of IDs of the datasets
   * @returns The list of datasets
   */
  async listDatasetsByIds(ids: string[]) {
    const { datasetService: service } = this;

    const req = new datasetPb.ListDatasetsByIDsRequest();
    req.setIdsList(ids);

    const response = await promisify<
      datasetPb.ListDatasetsByIDsRequest,
      datasetPb.ListDatasetsByIDsResponse
    >(service.listDatasetsByIDs.bind(service), req);

    const datasets: Dataset[] = [];
    for (const set of response.getDatasetsList()) {
      const dataset: Dataset = set.toObject();
      dataset.created = set.getTimeCreated()?.toDate();
      datasets.push(dataset);
    }
    return datasets;
  }

  // eslint-disable-next-line class-methods-use-this
  createFilter(options: FilterOptions): dataPb.Filter {
    const filter = new dataPb.Filter();
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
      const interval = new dataPb.CaptureInterval();
      if (options.startTime) {
        interval.setStart(Timestamp.fromDate(options.startTime));
      }
      if (options.endTime) {
        interval.setEnd(Timestamp.fromDate(options.endTime));
      }
      filter.setInterval(interval);
    }

    const tagsFilter = new dataPb.TagsFilter();
    if (options.tags) {
      tagsFilter.setTagsList(options.tags);
      filter.setTagsFilter(tagsFilter);
    }

    return filter;
  }
}
