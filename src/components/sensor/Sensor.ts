import type { Extra } from '../../types'
import type { sensorApi } from '../../main'

export interface Sensor {
    GetReadings(extra?: Extra): Promise<sensorApi.GetReadingsResponse>;
}
