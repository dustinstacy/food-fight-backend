import express from "express"
import { SiweMessage } from "siwe"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import User from "../models/User.js"
import * as dotenv from "dotenv"
import Nonce from "../models/Nonce.js"

dotenv.config()
const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET
const APP_DOMAIN = process.env.APP_DOMAIN || "localhost"
const APP_URI = process.env.APP_URI || "http://localhost:3000"

// @route POST /api/auth/challenge
// @desc Generates a nonce and returns a SIWE message for signing
// @access Public
router.post("/challenge", async (req, res, next) => {
    try {
        const { address } = req.body
        if (!address) {
            return res.status(400).json({ error: "Address is required" })
        }

        // Clean up the previous nonce for the address
        await Nonce.deleteOne({ address: address.toLowerCase() })

        // Generate a new nonce
        const nonce = crypto.randomBytes(16).toString("hex")

        // Create a new nonce entry in the database
        const newNonce = new Nonce({
            address: address.toLowerCase(),
            nonce: nonce,
        })
        await newNonce.save()
        console.log(`[Auth Challenge] Nonce stored for ${address}: ${nonce}`)

        // Create SIWE message object
        const message = new SiweMessage({
            domain: APP_DOMAIN,
            address: address,
            statement: "Sign in with Ethereum to Food Fight.",
            uri: APP_URI,
            version: "1",
            chainId: 31337, //!! Make this dynamic if production is multi-chain
            nonce: nonce,
            issuedAt: new Date().toISOString(),
            expirationTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })

        // Prepare the message for signing and send it to the client
        const preparedMessage = message.prepareMessage()
        res.json({ message: preparedMessage })
    } catch (error) {
        next(error)
    }
})

// @route POST /api/auth/verify
// @desc Verify the signed message and generate a JWT
// @access Public
router.post("/verify", async (req, res, next) => {
    try {
        const { message, signature, address } = req.body

        if (!message || !signature || !address) {
            return res.status(400).json({ error: "Message, signature, and address are required" })
        }

        // Extract nonce from the message provided by the client
        const siweMessage = new SiweMessage(message)
        const messageNonce = siweMessage.nonce

        if (!messageNonce) {
            return res.status(400).json({ error: "Nonce missing from message" })
        }

        // Find and delete the nonce from the database
        const storedNonceDoc = await Nonce.findOneAndDelete({
            address: address.toLowerCase(),
            nonce: messageNonce,
        })

        console.log(
            `[Auth Verify] Looked for nonce "${messageNonce}" for address ${address}. Found:`,
            storedNonceDoc ? "Yes" : "No"
        )

        if (!storedNonceDoc) {
            return res.status(401).json({ error: "Invalid, expired, or already used nonce." })
        }

        // Verify signature using siwe library
        const fields = await siweMessage.verify({ signature })

        // Check if signature verification was successful and address matches
        if (fields.data.address.toLowerCase() !== address.toLowerCase()) {
            return res
                .status(401)
                .json({ error: "Signature verification failed: Address mismatch." })
        }

        // Check if the user already exists in the database
        let user = await User.findOne({ address: address }).lean()

        // If the user doesn't exist, create a new user
        if (!user) {
            console.log(`User not found for ${address}, creating new user...`)
            const newUser = new User({
                username: address, // Default username = address
                address: address,
            })
            user = await newUser.save()
        }

        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured on the server.") // Safety check
        }

        const tokenPayload = {
            userId: user._id.toString(), // User's DB ID
            address: user.address,
        }
        const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1d" })

        res.json({ accessToken })
    } catch (error) {
        console.error("Verification error:", error)
        // Send specific errors from siweMessage.verify
        if (error instanceof Error && error.message.includes("Signature")) {
            return res
                .status(401)
                .json({ error: `Signature verification failed: ${error.message}` })
        }
        next(error) // Pass other errors to error handler middleware
    }
})

export default router
