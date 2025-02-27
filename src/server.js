import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import * as dotenv from "dotenv"
import userRoutes from "./api/users.js"
import errorHandler from "./middleware/errors.js"
import { CLIENT_PORT, MONGO_DEV_URI, PORT } from "./utils/helperConfig.js"

dotenv.config()

const app = express()

const localClientPort = process.env.CLIENT_PORT || CLIENT_PORT

app.use(express.json())
app.use(errorHandler)
app.use(
    cors({
        origin: [`http://localhost:${localClientPort}`],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
)

// Routes
app.use("/api/users", userRoutes)

const MONGO_URI = process.env.MONGO_URI || MONGO_DEV_URI

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("*****Connected to database*****")
    })
    .catch((error) => {
        console.log("Error connecting to MongoDB:", error)
    })

app.get("/", (req, res) => {
    res.send("Server Running")
})

const localServerPort = process.env.PORT || PORT

// Start the server
app.listen(localServerPort, () => {
    console.log(`Server running on http://localhost:${localServerPort}`)
})
