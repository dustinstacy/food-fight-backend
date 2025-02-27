import express from "express"
import User from "../models/User.js"
import requiresAuth from "../middleware/requiresAuth.js"
import { hasUser } from "../utils/hasUser.js"
import { checkForExistingUsername } from "../utils/checkForExistingUsername.js"

const router = express.Router()

// @route GET /api/users/test
// @desc Test the Users route
// @access Public
router.get("/test", (req, res) => {
    res.send("Profile route working")
})

// @route Get /api/users
// @desc Get user
// @access Private
router.get("/:address", requiresAuth, async (req, res, next) => {
    try {
        if (!hasUser(req)) {
            return res.status(400).json({ error: "No user found" })
        }

        res.json(req.user)
    } catch (error) {
        next(error)
    }
})

router.post("/", async (req, res, next) => {
    try {
        req.body.address = req.body.address

        const newUser = new User({
            username: req.body.address,
            address: req.body.address,
        })

        const savedUser = await newUser.save()
        res.json(savedUser)
    } catch (error) {
        next(error)
    }
})

// @route GET /api/users/:action
// @desc Get user's data
// @access Private
router.get("/:action", requiresAuth, async (req, res, next) => {
    try {
        if (!hasUser(req)) {
            return res.status(400).json({ error: "No user found" })
        }

        const user = req.user

        switch (req.params.action) {
            case "username":
                res.json({
                    username: user.username,
                })
                break
            case "image":
                res.json({
                    image: user.image,
                })
                break
            default:
                res.status(400).json({ error: "Invalid action" })
                return
        }
    } catch (error) {
        next(error)
    }
})

// @route PUT /api/users/:action
// @desc Update user's profile
// @access Private
router.put("/:action", requiresAuth, async (req, res, next) => {
    try {
        if (!hasUser(req)) {
            return res.status(400).json({ error: "No user found" })
        }

        let updatedFields = {}

        switch (req.params.action) {
            case "username": {
                const usernameError = await checkForExistingUsername(req)
                if (usernameError) {
                    return res.status(400).json(usernameError)
                }
                updatedFields.username = req.body.username
                break
            }
            case "image": {
                updatedFields.image = req.body.image
                break
            }
            default:
                res.status(400).json({ error: "Invalid action" })
                return
        }

        const updatedUser = await User.findOneAndUpdate({ _id: req.user._id }, updatedFields, { new: true })
        res.json(updatedUser)
    } catch (error) {
        next(error)
    }
})

export default router
