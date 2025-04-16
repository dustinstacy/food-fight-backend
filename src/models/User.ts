import { Schema, model, Document } from 'mongoose'

///////////////////////////////////////////////////////////////////
/// Interface                                                   ///
///////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////
/// Schema                                             ///
///////////////////////////////////////////////////////////////////

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required.'],
      unique: true,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, 'Wallet address is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    image: {
      type: String,
      trim: true,
      default:
        'https://res.cloudinary.com/dhsflmylz/image/upload/v1740621499/Hand-drawn_sketch_chaotic_chef_in_a_food_fight_anime_features_dramatic_cinematic_style_color_sketchnote_style_film-like_composition_and_lighting_s2iydx.jpg',
    },
  },
  {
    timestamps: true,
  }
)

///////////////////////////////////////////////////////////////////
/// Model                                                       ///
///////////////////////////////////////////////////////////////////

/**
 * Mongoose model for interacting with the User collection in MongoDB.
 * Provides static methods like `findOne`, `findById`, `create`, etc.,
 * and instance methods like `save`. Documents retrieved using this model
 * will conform to the {@link IUser} interface.
 */
const User = model<IUser>('User', UserSchema)
export default User
