import { Request, Response, NextFunction } from 'express'
import jwt, { JwtPayload, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken'
import User, { IUser } from '../models/User.ts'
import * as dotenv from 'dotenv'

dotenv.config()

//////////////////////////////////////////////////////////////
/// Interfaces                                             ///
//////////////////////////////////////////////////////////////

/**
 * Declare global augmentation for Express Request object
 * to include an optional user property of type IUser.
 * This allows us to attach the user object to the request
 */
declare global {
  namespace Express {
    export interface Request {
      user?: IUser
    }
  }
}

/**
 * Interface for the JWT payload.
 */
interface AuthTokenPayload extends JwtPayload {
  /**
   * The ID of the user associated with the token.
   */
  userId: string

  /**
   * The wallet address of the user associated with the token.
   */
  address?: string
}

//////////////////////////////////////////////////////////////
/// Constants                                              ///
//////////////////////////////////////////////////////////////

const JWT_SECRET = process.env.JWT_SECRET as string

//////////////////////////////////////////////////////////////
/// Authorization Middleware                               ///
//////////////////////////////////////////////////////////////

/**
 * Express middleware to verify a JWT Bearer token from the Authorization header.
 *
 * @remarks
 * - Reads the JWT secret from the `JWT_SECRET` environment variable.
 * - Handles missing tokens, invalid formats, expired tokens, invalid signatures,
 * and cases where the user ID in the token doesn't match a database user.
 * - Attaches the full Mongoose user document (as a lean object) to `req.user`.
 *
 * @see {@link AuthTokenPayload} - Expected structure of the JWT payload.
 * @see {@link IUser} - Interface for the attached `req.user` object.
 *
 * @param req - Express request object. Modified to add `req.user` on success.
 * @param res - Express response object. Used to send 401 responses on auth failure.
 * @param next - Express next function. Called on success or to pass non-auth errors down.
 * @returns Returns a promise that resolves when the middleware completes.
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
