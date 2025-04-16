import jwt from "jsonwebtoken"
import User from "../models/User.js"
import * as dotenv from "dotenv"

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET

const requiresAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization

    // Check if Authorization header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided or invalid format" })
    }

    // Extract the token
    const token = authHeader.split(" ")[1]
    if (!token) {
        return res.status(401).json({ error: "Unauthorized: Token missing after Bearer" })
    }

    // Ensure secret is loaded before trying to verify
    if (!JWT_SECRET) {
        console.error("Authentication check failed: JWT_SECRET not available.")
        return res.status(500).json({ error: "Internal Server Error: Auth configuration" })
    }

    try {
        // Verify the token using the secret key
        // This will throw an error if the token is invalid or expired
        const decoded = jwt.verify(token, JWT_SECRET)

        // Check if the decoded token has the expected structure
        if (!decoded || typeof decoded !== "object" || !decoded.userId) {
            return res.status(401).json({ error: "Unauthorized: Invalid token payload" })
        }

        // Fetch the user from the database using the ID from the token
        const user = await User.findById(decoded.userId).lean() // Use lean() for better performance.

        // Check if user exists in the database
        if (!user) {
            return res.status(401).json({ error: "Unauthorized: User not found" })
        }

        // Attach the user object (without sensitive data if necessary) to the request object
        req.user = user

        // Pass control to the next middleware or route handler
        next()
    } catch (error) {
        // Handle specific JWT errors
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: "Unauthorized: Token expired" })
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: `Unauthorized: Invalid token (${error.message})` })
        }

        // Handle other unexpected errors (e.g., database error during findById)
        console.error("Error during authentication middleware:", error)
        // Pass to the main error handler middleware
        next(error)
    }
}

export default requiresAuth
