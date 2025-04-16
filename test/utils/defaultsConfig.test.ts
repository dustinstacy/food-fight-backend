import { describe, it, expect } from 'vitest'

// Import the constants to test (adjust path if needed)
import { CLIENT_PORT, CORS_ORIGIN, MONGO_DEV_URI, PORT } from '../../src/utils/defaultsConfig'

describe('Defaults Configuration (defaultsConfig.ts)', () => {
  it('should have the correct client port', () => {
    const expectedPort = 3000
    expect(CLIENT_PORT).toBe(expectedPort)
  })

  it('should have the correct CORS origin', () => {
    const expectedOrigin = `http://localhost:${CLIENT_PORT}`
    expect(CORS_ORIGIN).toContain(expectedOrigin)
  })

  it('should have the correct MongoDB URI for development', () => {
    const expectedURI =
      'mongodb+srv://devUser:f0W4pZsvTuUwxG4R@development-data.wagd3.mongodb.net/?retryWrites=true&w=majority&appName=Development-Data'
    expect(MONGO_DEV_URI).toBe(expectedURI)
  })

  it('should have the correct server port', () => {
    const expectedPort = 5000
    expect(PORT).toBe(expectedPort)
  })
})
