import type { IUser } from '../models/User.ts'

/**
 * Declare global augmentation for Express Request object
 * to include an optional user property of type IUser.
 * This allows us to attach the user object to the request.
 */
declare global {
  namespace Express {
    export interface Request {
      user?: IUser
    }
  }
}
