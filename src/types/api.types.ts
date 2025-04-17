import { IUser } from '../types/models.types.js'

/**
 * Interface for the request body of the challenge endpoint.
 */
export interface ChallengeRequestBody {
  /**
   * The wallet address of the user.
   */
  address?: string

  /**
   * The chain ID of the wallet.
   */
  chainId?: number | string // Allow string from JSON, parse later
}

/**
 * Interface for the request body of the verify endpoint.
 */
export interface VerifyRequestBody {
  /**
   * The signed message from the user.
   */
  message?: string

  /**
   * The signature of the signed message.
   */
  signature?: string

  /**
   * The wallet address of the user.
   */
  address?: string
}

/**
 * Type for the updatable user properties.
 */
export type UpdatableUserProperty = Extract<keyof IUser, 'username' | 'image'>

/**
 * Interface for the request parameters of the update user endpoint.
 */
export interface UpdateUserParams {
  /**
   * The property of the user to update.
   */
  property: UpdatableUserProperty
}

/**
 * Interface for the request body of the update user endpoint.
 */
// Body can contain the corresponding value, assumed string for username/image
export interface UpdateUserBody {
  /**
   * The new value for the user property.
   */
  username?: string
  /**
   * The new image URL for the user.
   */
  image?: string
}
