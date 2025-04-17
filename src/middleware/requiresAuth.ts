import * as dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

import User from '../models/User.js'

import type { AuthTokenPayload } from '../types/middleware.types.js'
import type { IUser } from '../types/models.types.js'
import type { Request, Response, NextFunction } from 'express'

dotenv.config()

const { JsonWebTokenError, TokenExpiredError } = jwt
const JWT_SECRET = process.env.JWT_SECRET as string

/**
 * Express middleware to verify a JWT Bearer token from the Authorization header.
 *
 * @remarks
 * - Reads the JWT secret from the `JWT_SECRET` environment variable.
 * - Handles missing tokens, invalid formats, expired tokens, invalid signatures,
 * and cases where the user ID in the token doesn't match a database user.
 * - Attaches the full Mongoose user document (as a lean object) to `req.user`.
 */
const requiresAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization

  // Check for header and 'Bearer ' prefix
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided or invalid format' })
    return
  }

  // Extract token
  const token = authHeader.split(' ')[1]
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Token missing after Bearer' })
    return
  }

  try {
    // Verify the token and type the decoded payload
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload

    // Validate the structure of the decoded payload
    if (typeof decoded.userId !== 'string') {
      res.status(401).json({ error: 'Unauthorized: Invalid token payload (missing userId)' })
      return
    }

    // Fetch user from DB using the validated userId from the token
    // Using .lean<IUser>() tells Mongoose to return a plain JS object typed as IUser
    const user = await User.findById(decoded.userId).lean<IUser>()

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User associated with token not found' })
      return
    }

    // Attach the user object to the request for use in subsequent middleware or route handlers
    req.user = user

    // Authentication successful, pass control to the next handler
    next()
  } catch (error: unknown) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({ error: 'Unauthorized: Token expired' })
      return
    }
    if (error instanceof JsonWebTokenError) {
      res.status(401).json({ error: `Unauthorized: Invalid token (${error.message})` })
      return
    }
    console.error('Unexpected error during authentication middleware:', error)
    next(error)
  }
}

export default requiresAuth
