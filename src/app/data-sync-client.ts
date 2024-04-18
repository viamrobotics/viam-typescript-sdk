import { type RpcOptions } from '@improbable-eng/grpc-web/dist/typings/client.d';
import { DataSyncServiceClient } from '../gen/app/datasync/v1/data_sync_pb_service';
import pb from '../gen/app/datasync/v1/data_sync_pb';
import { promisify } from '../utils';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import { type StructType } from '../types';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

type ValueOf<T> = T[keyof T];
export const { DataType } = pb;
export type DataType = ValueOf<typeof pb.DataType>;
export type UploadMetadata = pb.UploadMetadata.AsObject;
export type FileData = pb.FileData.AsObject;

export interface SensorMetadata {
  timeRequested?: Date;
  timeReceived?: Date;
}

export interface SensorData {
  metadata?: SensorMetadata;
  struct?: StructType;
  binary: Uint8Array | string;
}

export interface DataCaptureUploadMetadata {
  uploadMetadata?: UploadMetadata;
  sensorMetadata?: SensorMetadata;
}

/** Convert a UploadMetadata to a Protobuf UploadMetadata */
const encodeUploadMetadata = (
  obj: pb.UploadMetadata.AsObject
): pb.UploadMetadata => {
  const proto = new pb.UploadMetadata();

  proto.setPartId(obj.partId);
  proto.setComponentType(obj.componentType);
  proto.setComponentName(obj.componentName);
  proto.setMethodName(obj.methodName);
  proto.setType(obj.type);
  proto.setFileName(obj.fileName);
  proto.setFileExtension(obj.fileExtension);
  proto.setTagsList(obj.tagsList);

  return proto;
};

/** Convert SensorMetadata to a Protobuf SensorMetadata */
const encodeSensorMetadata = (obj: SensorMetadata): pb.SensorMetadata => {
  const proto = new pb.SensorMetadata();
  if (obj.timeRequested !== undefined) {
    proto.setTimeRequested(Timestamp.fromDate(obj.timeRequested));
  }
  if (obj.timeReceived !== undefined) {
    proto.setTimeReceived(Timestamp.fromDate(obj.timeReceived));
  }
  return proto;
};

/** Convert SensorData to a Protobuf SensorData */
const encodeSensorData = (obj: SensorData): pb.SensorData => {
  const proto = new pb.SensorData();
  if (obj.metadata !== undefined) {
    proto.setMetadata(encodeSensorMetadata(obj.metadata));
  }
  if (obj.struct !== undefined) {
    proto.setStruct(Struct.fromJavaScript(obj.struct));
  }
  proto.setBinary(obj.binary);
  return proto;
};

/** Convert DataCaptureUploadMetadata to a Protobuf DataCaptureUploadMetadata */
const encodeDataCaptureUploadMetadata = (
  obj: DataCaptureUploadMetadata
): pb.DataCaptureUploadMetadata => {
  const proto = new pb.DataCaptureUploadMetadata();
  if (obj.uploadMetadata) {
    proto.setUploadMetadata(encodeUploadMetadata(obj.uploadMetadata));
  }
  if (obj.sensorMetadata) {
    proto.setSensorMetadata(encodeSensorMetadata(obj.sensorMetadata));
  }
  return proto;
};

export class DataSyncClient {
  private service: DataSyncServiceClient;

  constructor(serviceHost: string, grpcOptions: RpcOptions) {
    this.service = new DataSyncServiceClient(serviceHost, grpcOptions);
  }

  async dataCaptureUpload(
    sensorContentsList: SensorData[],
    metadata?: UploadMetadata
  ) {
    const { service } = this;

    const req = new pb.DataCaptureUploadRequest();
    req.setSensorContentsList(
      sensorContentsList.map((sensorData) => encodeSensorData(sensorData))
    );
    if (metadata) {
      req.setMetadata(encodeUploadMetadata(metadata));
    }

    const response = await promisify<
      pb.DataCaptureUploadRequest,
      pb.DataCaptureUploadResponse
    >(service.dataCaptureUpload.bind(service), req);
    return response.getFileId();
  }

  async fileUpload(metadata?: UploadMetadata, fileData?: FileData) {
    const { service } = this;

    const req = new pb.FileUploadRequest();
    if (metadata) {
      req.setMetadata(encodeUploadMetadata(metadata));
    }
    if (fileData) {
      const proto = new pb.FileData();
      proto.setData(fileData.data);
      req.setFileContents(proto);
    }

    const response = await promisify<
      pb.FileUploadRequest,
      pb.FileUploadResponse
    >(service.fileUpload.bind(service), req);
    return response.getFileId();
  }

  async streamingDataCaptureUpload(
    data: Uint8Array | string,
    metadata?: DataCaptureUploadMetadata
  ) {
    const { service } = this;

    const req = new pb.StreamingDataCaptureUploadRequest();
    req.setData(data);
    if (metadata !== undefined) {
      req.setMetadata(encodeDataCaptureUploadMetadata(metadata));
    }

    const response = await promisify<
      pb.StreamingDataCaptureUploadRequest,
      pb.StreamingDataCaptureUploadResponse
    >(service.streamingDataCaptureUpload.bind(service), req);
    return response.getFileId();
  }
}
