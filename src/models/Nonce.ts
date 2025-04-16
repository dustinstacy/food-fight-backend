import { Schema, model, Document } from 'mongoose'

///////////////////////////////////////////////////////////////////
/// Interface                                                   ///
///////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////
/// Schema                                                      ///
///////////////////////////////////////////////////////////////////

const NonceSchema = new Schema<INonce>(
  {
    address: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    nonce: {
      type: String,
      required: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '5m',
    },
  },
  {
    // Disable Mongoose's default `createdAt` and `updatedAt` fields,
    // as we only need `createdAt` for the TTL index.
    timestamps: false,
  }
)

// Compound index to optimize the findOneAndDelete query used in the /verify route
NonceSchema.index({ address: 1, nonce: 1 })

///////////////////////////////////////////////////////////////////
/// Model                                                       ///
///////////////////////////////////////////////////////////////////

/**
 * Mongoose model for interacting with the 'nonces' collection in MongoDB.
 * Provides methods for creating, finding, and deleting SIWE nonces,
 * leveraging automatic expiration via a TTL index defined in the schema.
 * Documents conform to the {@link INonce} interface.
 */
const Nonce = model<INonce>('Nonce', NonceSchema)

export default Nonce
