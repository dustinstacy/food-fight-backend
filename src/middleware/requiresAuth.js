import User from "../models/User.js"

// Middleware to check if the user is authenticated
const requiresAuth = async (req, res, next) => {
    const address = req.params.address

    if (!address) {
        return res.status(401).send("Unauthorized")
    }

    let isAuthed = false
    try {
        const user = await User.findOne({ address })

        if (user) {
            const userToReturn = { ...user.toJSON() }
            req.user = userToReturn
            isAuthed = true
        }
    } catch (error) {
        console.error("Error verifying address:", error)
        isAuthed = false
    }

    if (!isAuthed) {
        return res.status(401).send("Unauthorized")
    }

    return next()
}

export default requiresAuth
