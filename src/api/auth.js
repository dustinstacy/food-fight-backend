import express from "express"
import { SiweMessage } from "siwe"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import * as dotenv from "dotenv"

dotenv.config()
const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET
const APP_DOMAIN = process.env.APP_DOMAIN || "localhost"
const APP_URI = process.env.APP_URI || "http://localhost:3000"

//!! Temporary Nonce Storage (Replace with Redis/DB in production)
const nonceStore = new Map()

// @route POST /api/auth/challenge
// @desc Generates a nonce and returns a SIWE message for signing
// @access Public
router.post("/challenge", async (req, res, next) => {
    try {
        const { address } = req.body

        if (!address) {
            return res.status(400).json({ error: "Address is required" })
        }

        // Generate a secure nonce
        const nonce = Math.random().toString(36).substring(2, 15) //!! consider crypto lib

        // Store nonce temporarily associated with address
        nonceStore.set(address, { nonce, timestamp: Date.now() })
        //!! Clean up old nonces periodically in production

        // Create SIWE message object
        const message = new SiweMessage({
            domain: APP_DOMAIN,
            address: address,
            statement: "Sign in with Ethereum to Food Fight.",
            uri: APP_URI,
            version: "1",
            chainId: 31337, //!! Make this dynamic if production is multi-chain
            nonce: nonce,
            issuedAt: new Date().toISOString(), // Optional
            expirationTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Optional: 5 min expiry
        })

        // Prepare the message for signing
        const preparedMessage = message.prepareMessage()

        // Return the message to be signed
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

        // Retrieve and validate stored nonce
        const storedNonceData = nonceStore.get(address)
        nonceStore.delete(address) // Nonce should be used only once

        //!! Add timestamp check in production
        if (!storedNonceData || storedNonceData.nonce !== new SiweMessage(message).nonce) {
            return res.status(401).json({ error: "Invalid or expired nonce." })
        }

        // Verify signature using siwe library
        const siweMessage = new SiweMessage(message)
        const fields = await siweMessage.verify({ signature })

        // Check if signature verification was successful and address matches
        if (fields.data.address !== address) {
            return res
                .status(401)
                .json({ error: "Signature verification failed: Address mismatch." })
        }

        let user = await User.findOne({ address: address }).lean()

        // If user doesn't exist, create them
        if (!user) {
            console.log(`User not found for ${address}, creating new user...`)
            const newUser = new User({
                username: address, // Default username = address
                address: address,
            })
            user = await newUser.save()
        }

        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured on the server.") // Should have exited earlier, but safety check
        }

        const tokenPayload = {
            userId: user._id.toString(), // Use user's DB ID
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
