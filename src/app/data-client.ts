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

type TabularData = {
  data?: googleStructPb.Struct.AsObject;
  metadataIndex: number;
  timeRequested?: Date;
  timeReceived?: Date;
};

export class DataClient {
  private service: DataServiceClient;

  constructor(serviceHost: string, grpcOptions: RpcOptions) {
    this.service = new DataServiceClient(serviceHost, grpcOptions);
  }

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
      if (!dataList || dataList.length === 0) {
        break;
      }
      dataArray.push(
        ...dataList.map((data) => ({
          ...data.toObject(),
          timeRequested: data.getTimeRequested()?.toDate(),
          timeReceived: data.getTimeReceived()?.toDate(),
        }))
      );
      last = response.getLast();
    }

    return dataArray;
  }

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
      if (!dataList || dataList.length === 0) {
        break;
      }
      dataArray.push(...dataList.map((data) => data.toObject()));
      last = response.getLast();
    }

    return dataArray;
  }

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

    if (options.startTime || options.endTime) {
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
