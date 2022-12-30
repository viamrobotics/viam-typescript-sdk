import type { Extra } from '../../types'
import type { sensorApi } from '../../main'

export interface Sensor {
  getReadings(extra?: Extra): Promise<sensorApi.GetReadingsResponse>
}
