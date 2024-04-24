import { type RpcOptions } from '@improbable-eng/grpc-web/dist/typings/client.d';
import * as googleStructPb from 'google-protobuf/google/protobuf/struct_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import dataPb from '../gen/app/data/v1/data_pb';
import dataSyncPb from '../gen/app/datasync/v1/data_sync_pb';
import { DataServiceClient } from '../gen/app/data/v1/data_pb_service';
import { DataSyncServiceClient } from '../gen/app/datasync/v1/data_sync_pb_service';
import { promisify } from '../utils';

export type BinaryID = dataPb.BinaryID.AsObject;
export type UploadMetadata = dataSyncPb.UploadMetadata.AsObject;

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

export class DataClient {
  private dataService: DataServiceClient;
  private dataSyncService: DataSyncServiceClient;

  constructor(serviceHost: string, grpcOptions: RpcOptions) {
    this.dataService = new DataServiceClient(serviceHost, grpcOptions);
    this.dataSyncService = new DataSyncServiceClient(serviceHost, grpcOptions);
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
   * @param filter - Optional `pb.Filter` specifying tabular data to retrieve.
   *   No `filter` implies all tabular data.
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

  async dataCaptureUpload(
    dataList: Record<string, googleStructPb.JavaScriptValue>[],
    partId: string,
    componentType: string,
    componentName: string,
    methodName: string,
    fileName: string,
    tags?: string[],
    dataRequestTimes?: [Date, Date][]
  ) {
    if (dataRequestTimes?.length !== dataList.length) {
      throw new Error('dataRequestTimes and data lengths must be equal.');
    }

    const { dataSyncService: service } = this;

    const metadata = new dataSyncPb.UploadMetadata();
    metadata.setPartId(partId);
    metadata.setComponentType(componentType);
    metadata.setComponentName(componentName);
    metadata.setMethodName(methodName);
    metadata.setType(dataSyncPb.DataType.DATA_TYPE_TABULAR_SENSOR);
    metadata.setFileName(fileName);
    if (tags) {
      metadata.setTagsList(tags);
    }

    const sensorContents: dataSyncPb.SensorData[] = [];
    for (const [i, data] of dataList.entries()) {
      const sensorData = new dataSyncPb.SensorData();

      const sensorMetadata = new dataSyncPb.SensorMetadata();
      const dates = dataRequestTimes[i];
      if (dates) {
        sensorMetadata.setTimeRequested(Timestamp.fromDate(dates[0]));
        sensorMetadata.setTimeReceived(Timestamp.fromDate(dates[1]));
      }
      sensorData.setMetadata(sensorMetadata);
      sensorData.setStruct(googleStructPb.Struct.fromJavaScript(data));

      sensorContents.push(sensorData);
    }

    const req = new dataSyncPb.DataCaptureUploadRequest();
    req.setMetadata(metadata);
    req.setSensorContentsList(sensorContents);

    const response = await promisify<
      dataSyncPb.DataCaptureUploadRequest,
      dataSyncPb.DataCaptureUploadResponse
    >(service.dataCaptureUpload.bind(service), req);
    return response.getFileId();
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
