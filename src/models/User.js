import { Schema, model } from "mongoose"

const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            default:
                "https://res.cloudinary.com/dhsflmylz/image/upload/v1740621499/Hand-drawn_sketch_chaotic_chef_in_a_food_fight_anime_features_dramatic_cinematic_style_color_sketchnote_style_film-like_composition_and_lighting_s2iydx.jpg",
        },
    },
    {
        timestamps: true,
    }
)

// export the model
const User = model("User", UserSchema)

export default User
