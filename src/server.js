import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import * as dotenv from "dotenv"
import authRoutes from "./api/auth.js"
import userRoutes from "./api/users.js"
import errorHandler from "./middleware/errors.js"
import { CLIENT_PORT, MONGO_DEV_URI, PORT } from "./utils/helperConfig.js"

//////////////////////////////////////////////
/// Setup                                  ///
//////////////////////////////////////////////

dotenv.config()
const app = express()

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET environment variable is not set.")
    console.error("Server cannot start securely without a JWT secret for token validation.")
    process.exit(1)
}
const localClientPort = process.env.CLIENT_PORT || CLIENT_PORT
const localServerPort = process.env.PORT || PORT
const MONGO_URI = process.env.MONGO_URI || MONGO_DEV_URI
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : [`http://localhost:${localClientPort}`]

////////////////////////////////////////////////
/// Configuration                            ///
////////////////////////////////////////////////

app.use(express.json())
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true)
            } else {
                callback(new Error(`Not allowed by CORS: ${origin}`))
            }
        },
        allowedHeaders: ["Content-Type", "Authorization"],
    })
)

//////////////////////////////////////////////////
/// Routes                                     ///
//////////////////////////////////////////////////

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.get("/", (req, res) => {
    res.send("Server Running")
})

//////////////////////////////////////////////////
/// Error Handling                             ///
//////////////////////////////////////////////////

app.use(errorHandler)

//////////////////////////////////////////////////
/// Database Connection                        ///
//////////////////////////////////////////////////

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("*****Connected to database*****")
    })
    .catch((error) => {
        console.log("Error connecting to MongoDB:", error)
    })

//////////////////////////////////////////////////
/// Server Listening                           ///
//////////////////////////////////////////////////

app.listen(localServerPort, () => {
    console.log(`Server running on http://localhost:${localServerPort}`)
})
