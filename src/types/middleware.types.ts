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
