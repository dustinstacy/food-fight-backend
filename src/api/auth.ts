import crypto from 'crypto'

import * as dotenv from 'dotenv'
import express, { Router } from 'express'
import jwt from 'jsonwebtoken'
import { SiweMessage } from 'siwe'

import Nonce from '../models/Nonce.js'
import User from '../models/User.js'

import type { ChallengeRequestBody, VerifyRequestBody } from '../types/api.types.js'
import type { AuthTokenPayload } from '../types/middleware.types.js'
import type { INonce, IUser } from '../types/models.types.js'
import type { Request, Response, NextFunction } from 'express'

dotenv.config()
const router: Router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET as string
const APP_DOMAIN = process.env.APP_DOMAIN || 'localhost'
const APP_URI = process.env.APP_URI || 'http://localhost:3000'
const NONCE_EXPIRY_MS = parseInt(process.env.NONCE_EXPIRY_MS || '300000', 10)
const SUPPORTED_CHAIN_IDS_STR = process.env.SUPPORTED_CHAIN_IDS || '1,11155111,31337'
const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAIN_IDS_STR.split(',')
  .map((id) => parseInt(id.trim(), 10))
  .filter((id) => !isNaN(id))

console.log('Supported Chain IDs for Sign-In:', SUPPORTED_CHAIN_IDS)

/**
 * PUBLIC
 * GET /api/auth/test
 * Simple route to test if the auth API is reachable.
 */
router.get('/test', (_req: Request, res: Response) => {
  res.send('User Profile route working')
})

/**
 * PUBLIC
 * POST /api/auth/challenge
 * This endpoint generates a nonce and returns a signed message for the user to sign.
 * It is used for the SIWE (Sign-In with Ethereum) challenge.
 */
router.post('/challenge', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate request body
    const { address, chainId } = req.body as ChallengeRequestBody
    if (!address || chainId === undefined) {
      res.status(400).json({ error: 'Address and chainId are required' })
      return
    }

    // Parse chainId and validate
    const numericChainId = parseInt(String(chainId), 10)
    if (isNaN(numericChainId)) {
      res.status(400).json({ error: 'Invalid chainId format' })
      return
    }
    if (!SUPPORTED_CHAIN_IDS.includes(numericChainId)) {
      res.status(400).json({ error: 'Unsupported chainId' })
      return
    }

    // Remove any existing nonce for the address, then create a new one, and save it
    await Nonce.deleteOne({ address: address.toLowerCase() })
    const nonce: string = crypto.randomBytes(16).toString('hex')
    const newNonce = new Nonce({ address: address.toLowerCase(), nonce })
    await newNonce.save()
    console.log(`[Auth Challenge] Nonce stored for ${address}: ${nonce}`)

    // Create the message to be signed
    const message = new SiweMessage({
      domain: APP_DOMAIN,
      address,
      statement: 'Sign...',
      uri: APP_URI,
      version: '1',
      chainId: numericChainId,
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + NONCE_EXPIRY_MS).toISOString(),
    })

    // Prepare the message for signing
    const preparedMessage: string = message.prepareMessage()

    // Return the message to the client
    res.json({ message: preparedMessage })
  } catch (error) {
    next(error)
  }
})

/**
 * PUBLIC
 * POST /api/auth/verify
 * This endpoint verifies the signed message and nonce.
 * If valid, it creates a JWT token for the user.
 */
router.post('/verify', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate request body
    const { message, signature, address } = req.body as VerifyRequestBody
    if (!message || !signature || !address) {
      res.status(400).json({ error: 'Message, signature, and address are required' })
      return
    }

    // Validate the message properties
    const siweMessage = new SiweMessage(message)
    const messageNonce = siweMessage.nonce
    const messageChainId = siweMessage.chainId
    if (!messageNonce) {
      res.status(400).json({ error: 'Nonce not found' })
      return
    }
    if (!messageChainId || !SUPPORTED_CHAIN_IDS.includes(messageChainId)) {
      res.status(400).json({ error: 'Unsupported chainId' })
      return
    }

    // Check if the nonce exists and is not expired
    const fiveMinutesAgo = new Date(Date.now() - NONCE_EXPIRY_MS)
    const storedNonceDoc: INonce | null = await Nonce.findOneAndDelete({
      address: address.toLowerCase(),
      nonce: messageNonce,
      createdAt: { $gte: fiveMinutesAgo },
    })
    console.log(`[Auth Verify] ... Found:`, storedNonceDoc ? 'Yes' : 'No')
    if (!storedNonceDoc) {
      res.status(401).json({ error: 'Nonce expired or not found' })
      return
    }

    // Verify the signature and extract fields
    const fields = await siweMessage.verify({ signature })
    if (fields.data.address.toLowerCase() !== address.toLowerCase()) {
      res.status(401).json({ error: 'Invalid address' })
      return
    }

    // Check if the address matches the one in the message, if not create a new user
    let user: IUser | null = await User.findOne({ address: address.toLowerCase() }).lean<IUser>()
    if (!user) {
      const newUser = new User({ username: address, address: address.toLowerCase() })
      const savedUser = await newUser.save()
      user = savedUser.toObject() as IUser
    }

    // Check if the user object is valid and contains the _id field
    if (!user?._id) {
      console.error('User object or _id missing unexpectedly before JWT generation for address:', address)
      throw new Error('Failed to retrieve valid user data after verification.')
    }

    // Define type for payload based on IUser
    const tokenPayload: AuthTokenPayload = {
      userId: user._id.toString(),
      address: user.address,
    }

    // Create the JWT token
    if (!JWT_SECRET) throw new Error('JWT_SECRET missing')
    const accessToken: string = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' })

    // Return the JWT token to the client
    res.json({ accessToken })
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Signature')) {
      res.status(401).json({ error: 'Invalid signature' })
      return
    }
    next(error)
  }
})

export default router
