import cors, { CorsOptions } from 'cors'
import * as dotenv from 'dotenv'
import express, { Express, Request, Response } from 'express'
import mongoose from 'mongoose'

import authRoutes from './api/auth.js'
import userRoutes from './api/users.js'
import errorHandler from './middleware/errorHandler.js'
import { PORT, MONGO_DEV_URI, CORS_DEV_ORIGIN } from './utils/defaultsConfig.js'

//////////////////////////////////////////////
/// Environment & Initial Setup            ///
//////////////////////////////////////////////

dotenv.config() // Load .env variables
const JWT_SECRET = process.env.JWT_SECRET
const MONGO_URI = process.env.MONGO_URI || MONGO_DEV_URI
const SERVER_PORT = process.env.PORT || String(PORT)
const CORS_ORIGIN = process.env.CORS_ORIGIN
const allowedOrigins: string[] = CORS_ORIGIN ? CORS_ORIGIN.split(',').map((origin) => origin.trim()) : CORS_DEV_ORIGIN

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set.')
  process.exit(1)
}
if (!MONGO_URI) {
  console.error('FATAL ERROR: MongoDB connection URI (MONGO_URI or default) is missing.')
  process.exit(1)
}
const localServerPort: number = parseInt(SERVER_PORT, 10)
if (isNaN(localServerPort)) {
  console.error(`FATAL ERROR: Invalid PORT environment variable: ${SERVER_PORT}`)
  process.exit(1)
}
console.log('Allowed CORS Origins:', allowedOrigins)

const app: Express = express()

////////////////////////////////////////////////
/// Middleware Configuration                 ///
////////////////////////////////////////////////
app.use(express.json())

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`)
      callback(new Error(`Origin not allowed by CORS: ${origin}`))
    }
  },
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  credentials: true,
}
app.use(cors(corsOptions))

//////////////////////////////////////////////////
/// API Routes                                 ///
//////////////////////////////////////////////////

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)

app.get('/', (_req: Request, res: Response) => {
  res.send('Food Fight Server Running')
})

//////////////////////////////////////////////////
/// Error Handling Middleware                  ///
//////////////////////////////////////////////////

app.use(errorHandler)

//////////////////////////////////////////////////
/// Database Connection & Server Start        ///
//////////////////////////////////////////////////

const connectDBAndStartServer = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('***** Connected to MongoDB Database *****')

    app.listen(localServerPort, () => {
      console.log(`✅ Server running on http://localhost:${localServerPort}`)
    })
  } catch (error) {
    console.error('!!! DATABASE CONNECTION FAILED !!!')
    console.error(error)
    process.exit(1)
  }
}

connectDBAndStartServer()
