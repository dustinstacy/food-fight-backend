import type { JwtPayload } from 'jsonwebtoken'

/**
 * Interface for the JWT payload.
 */
export interface AuthTokenPayload extends JwtPayload {
  /**
   * The ID of the user associated with the token.
   */
  userId: string

  /**
   * The wallet address of the user associated with the token.
   */
  address?: string
}

/**
 * Custom error interface extending the standard Error object.
 * Allows for an optional statusCode property to indicate HTTP status.
 */
export interface HttpError extends Error {
  /**
   * Optional HTTP status code for the error.
   * Should be in the range of 400-599 for client and server errors respectively.
   */
  statusCode?: number
}
