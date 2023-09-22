import { FakeTransportBuilder } from "@improbable-eng/grpc-web-fake-transport";
import { beforeEach, describe, expect, test } from "vitest";
import { Filter } from "../gen/app/data/v1/data_pb";
import { DataClient, FilterOptions } from "./data-client";

const serviceHost = 'fakeServiceHost';
const transport = new FakeTransportBuilder().build();

let dataClient: DataClient;

beforeEach(() => {
    dataClient = new DataClient(serviceHost, { transport: transport});
})

describe('createFilter', () => {
    test('create filter', () => {
        const opts: FilterOptions = { componentName: 'camera' };
        const filter: Filter = dataClient.createFilter(opts);
        
        const testFilter = new Filter()
        testFilter.setComponentName('camera');
        console.log('test' + testFilter);
        console.log('actual' + filter);
        expect(filter).toEqual(testFilter);
    })
})