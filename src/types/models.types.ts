import { Document } from 'mongoose'

/**
 * Represents the structure of a Nonce document in MongoDB.
 * Nonces are used for Sign-In with Ethereum (SIWE) challenge verification
 * and include automatic expiration via a MongoDB TTL index.
 *
 * @see {@link https://docs.mongodb.com/manual/core/index-ttl/|MongoDB TTL Indexes}
 */
export interface INonce extends Document {
  /** The user's wallet address (stored lowercase) associated with this nonce. */
  address: string
  /** The unique, randomly generated nonce string provided in the SIWE challenge. */
  nonce: string
  /** Timestamp indicating when the nonce document was created (used by the TTL index). */
  createdAt: Date
}

/**
 * Represents the structure of a User document in MongoDB.
 * This interface extends Mongoose's Document interface to include
 * Mongoose-specific properties and methods.
 */
export interface IUser extends Document {
  /** Unique blockchain wallet address. Primary identifier. */
  address: string
  /** User's chosen display name. */
  username: string
  /** URL for the user's profile avatar image. Includes a default value. */
  image: string
  /** Timestamp indicating when the document was created. */
  createdAt: Date
  /** Timestamp indicating when the document was last updated. */
  updatedAt: Date
}
