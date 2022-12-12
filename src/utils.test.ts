import { expect, test } from 'vitest'
import { promisify } from './utils'

test('promisify', () => {
  const failedCallback = ((error, response)) => {
    return error
  }

  const succeededCallback = ((error, response)) => {
    return response
  }

  const serviceFunc = (request, metadata, callback) => {
  }
})
