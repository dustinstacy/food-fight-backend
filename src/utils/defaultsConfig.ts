// Set default protected mongo uri for development branch
export const MONGO_DEV_URI: string =
  'mongodb+srv://devUser:f0W4pZsvTuUwxG4R@development-data.wagd3.mongodb.net/?retryWrites=true&w=majority&appName=Development-Data'

// Set default localhost server port
export const PORT: number = 5000

// Set default localhost client port (Must match the port in the client app)
export const CLIENT_PORT: number = 3000

// Set default cors origin
export const CORS_ORIGIN: string[] = [`http://localhost:${CLIENT_PORT}`]
