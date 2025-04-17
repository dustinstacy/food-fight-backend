import { Schema, model } from 'mongoose'
import { IUser } from '../types/models.types.ts'

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
