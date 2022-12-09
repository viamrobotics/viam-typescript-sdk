import type { commonApi } from "../../main"

export interface Base {
    moveStraight(distanceMm: number, mmPerSec: number):Promise<object>
    
    spin(angleDeg:number, degsPerSec:number):Promise<object>

	setPower(linear:commonApi.Vector3, angular:commonApi.Vector3):Promise<object>

	setVelocity(linear:commonApi.Vector3, angular:commonApi.Vector3):Promise<object>

	stop():Promise<object>
}
