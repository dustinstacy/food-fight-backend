import { Schema, model } from 'mongoose'
import { INonce } from '../types/models.types.ts'

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
    // as we only need `createdAt` for the TTL index
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
