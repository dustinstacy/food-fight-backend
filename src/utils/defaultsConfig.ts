/**
 * Set default configuration value for the MongoDB development URI.
 */
export const MONGO_DEV_URI: string =
  'mongodb+srv://devUser:f0W4pZsvTuUwxG4R@development-data.wagd3.mongodb.net/?retryWrites=true&w=majority&appName=Development-Data'

/**
 * Set default configuration value for the localhost server port.
 */
export const PORT: number = 5000

/**
 * Set default configuration value for the localhost client port.
 * Must be the same as the one used in the client application.
 */
export const CLIENT_PORT: number = 3000

/**
 * Set default configuration value for the CORS origin.
 */
export const CORS_ORIGIN: string[] = [`http://localhost:${CLIENT_PORT}`]
