import type {Base} from './base'
import { BaseServiceClient } from '../../gen/component/base/v1/base_pb_service.esm'
import { Promisify } from '../ComponentUtils';
import { commonApi, baseApi } from '../../main';
import { rcLogConditionally } from '../ComponentUtils';

export class BaseClient implements Base {
    private bc: BaseServiceClient
    private name: string;

    constructor(serviceHost: string, name:string){
        this.bc = new BaseServiceClient(serviceHost);
        this.name = name;
    }
    
    async moveStraight(distanceMm: number, mmPerSec: number){
        const req = new baseApi.MoveStraightRequest();
        req.setName(this.name);
        req.setMmPerSec(mmPerSec);
        req.setDistanceMm(distanceMm);
        rcLogConditionally(req);
        let resultProm = await Promisify
        <baseApi.MoveStraightRequest,baseApi.MoveStraightResponse>
        (this.bc.moveStraight,req)

        return await resultProm.toObject()
    }

    async spin(angleDeg:number, degsPerSec:number){
        const req = new baseApi.SpinRequest();
        req.setName(this.name);
        req.setAngleDeg(angleDeg);
        req.setDegsPerSec(degsPerSec);
        rcLogConditionally(req);
        let resultProm = await Promisify
        <baseApi.SpinRequest,baseApi.SpinResponse>
        (this.bc.spin,req)

        return resultProm.toObject()
    }
	async setPower(linear:commonApi.Vector3, angular:commonApi.Vector3){
        const req = new baseApi.SetPowerRequest();
        req.setName(this.name);
        req.setLinear(linear);
        req.setAngular(angular);
        rcLogConditionally(req);

        let resultProm = await Promisify
        <baseApi.SetPowerRequest,baseApi.SetPowerResponse>
        (this.bc.setPower,req)

        return resultProm.toObject()

    }

	async setVelocity(linear:commonApi.Vector3, angular:commonApi.Vector3){
        const req = new baseApi.SetVelocityRequest();
        req.setName(this.name);
        req.setLinear(linear);
        req.setAngular(angular);
        rcLogConditionally(req);
        let resultProm = await Promisify
        <baseApi.SetVelocityRequest,baseApi.SetVelocityResponse>
        (this.bc.setVelocity,req)

        return resultProm.toObject()
    }

	async stop(){
        const req = new baseApi.StopRequest();
        req.setName(this.name);
        rcLogConditionally(req);

        let resultProm = await Promisify
        <baseApi.StopRequest,baseApi.StopResponse>
        (this.bc.stop,req)

        return resultProm.toObject()
    }

}