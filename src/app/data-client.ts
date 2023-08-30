import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
// import * as fsPromise from 'fs/promises';
import {
  DataRequest,
  Filter,
  TabularData,
  TabularDataByFilterRequest,
  TabularDataByFilterResponse,
} from '../gen/app/data/v1/data_pb';
import { DataServiceClient } from '../gen/app/data/v1/data_pb_service';
import { RobotClient } from '../robot';
import { promisify } from '../utils';

export class DataClient {
  private client: DataServiceClient;

  constructor(client: RobotClient) {
    this.client = client.createServiceClient(DataServiceClient);
  }

  private get service() {
    return this.client;
  }

  async tabularDataByFilter(
    filter: Filter | undefined,
    dest: string | undefined
  ) {
    const { service } = this;

    let last = '';
    const dataArray: TabularData.AsObject[] = [];
    let retrieving = false;

    while (retrieving) {
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
        retrieving = false;
      }
      if (dataList) {
        for (const data of dataList) {
          dataArray.push(data.toObject());
        }
        last = response.getLast();
      }
    }

    if (dest) {
      console.log(dest);
      // await fsPromise.writeFile(dest, `${dataArray.map((x) => { return [x.data, x.metadataIndex, x.timeRequested, x.timeReceived]} )}`)
    }

    return dataArray;
  }
}
