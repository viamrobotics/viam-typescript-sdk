import { type RpcOptions } from '@improbable-eng/grpc-web/dist/typings/client.d';
import {
  DataRequest,
  Filter,
  TabularData,
  TabularDataByFilterRequest,
  TabularDataByFilterResponse,
} from '../gen/app/data/v1/data_pb';
import { DataServiceClient } from '../gen/app/data/v1/data_pb_service';
import { promisify } from '../utils';

export class DataClient {
  private client: DataServiceClient;

  constructor(serviceHost: string, grpcOptions: RpcOptions) {
    this.client = new DataServiceClient(serviceHost, grpcOptions);
  }

  private get service() {
    return this.client;
  }

  async tabularDataByFilter(filter: Filter | undefined) {
    const { service } = this;

    let last = '';
    const dataArray: TabularData.AsObject[] = [];

    for (;;) {
      const dataReq = new DataRequest();
      if (filter) {
        dataReq.setFilter(filter);
      } else {
        dataReq.setFilter(new Filter());
      }
      dataReq.setLimit(100);
      dataReq.setLast(last);

      const req = new TabularDataByFilterRequest();
      req.setDataRequest(dataReq);
      req.setCountOnly(false);

      // eslint-disable-next-line no-await-in-loop
      const response = await promisify<
        TabularDataByFilterRequest,
        TabularDataByFilterResponse
      >(service.tabularDataByFilter.bind(service), req);
      const dataList = response.getDataList();
      if (!dataList || dataList.length === 0) {
        break;
      }
      dataArray.push(...dataList.map((data) => data.toObject()));
      last = response.getLast();
    }

    return dataArray;
  }
}
