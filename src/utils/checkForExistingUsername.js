import User from "../models/User.js"

export const checkForExistingUsername = async (req) => {
    try {
        const existingUsername = await User.findOne({
            username: new RegExp("^" + req.body.username + "$", "i"),
        })
        if (existingUsername) {
            return { error: "Username already exists" }
        }
        return null
    } catch (error) {
        return { error: "Error checking for existing username" }
    }
}
