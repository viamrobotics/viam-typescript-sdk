import { type RpcOptions } from '@improbable-eng/grpc-web/dist/typings/client.d';
import * as googleStructPb from 'google-protobuf/google/protobuf/struct_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import pb from '../gen/app/data/v1/data_pb';
import { DataServiceClient } from '../gen/app/data/v1/data_pb_service';
import { promisify } from '../utils';

export interface FilterOptions {
  componentName?: string;
  componentType?: string;
  method?: string;
  robotName?: string;
  robotId?: string;
  partName?: string;
  partId?: string;
  locationIdsList?: Array<string>;
  organizationIdsList?: Array<string>;
  mimeTypeList?: Array<string>;
  startTime?: Date;
  endTime?: Date;
  tags?: Array<string>;
  bboxLabelsList?: Array<string>;
}

type TabularData = {
  data?: googleStructPb.Struct.AsObject;
  metadataIndex: number;
  timeRequested?: Date;
  timeReceived?: Date;
};

export class DataClient {
  private client: DataServiceClient;

  constructor(serviceHost: string, grpcOptions: RpcOptions) {
    this.client = new DataServiceClient(serviceHost, grpcOptions);
  }

  private get service() {
    return this.client;
  }

  async tabularDataByFilter(filter: pb.Filter | undefined) {
    const { service } = this;

    let last = '';
    const dataArray: TabularData[] = [];

    for (;;) {
      const dataReq = new pb.DataRequest();
      if (filter) {
        dataReq.setFilter(filter);
      } else {
        dataReq.setFilter(new pb.Filter());
      }
      dataReq.setLimit(100);
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

  createFilter = (options: FilterOptions): pb.Filter => {
    this.createFilter = this.createFilter.bind(this);

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
    }
    filter.setTagsFilter(tagsFilter);

    return filter;
  };
}
