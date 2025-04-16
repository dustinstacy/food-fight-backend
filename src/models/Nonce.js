import { Schema, model } from 'mongoose'

const NonceSchema = new Schema({
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
})

NonceSchema.index({ address: 1, nonce: 1 })

const Nonce = model('Nonce', NonceSchema)

export default Nonce
