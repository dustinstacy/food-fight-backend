import express from 'express'
import User from '../models/User.js'
import requiresAuth from '../middleware/requiresAuth.js'
import { checkForExistingUsername } from '../utils/checkForExistingUsername.js'

const router = express.Router()

// @route GET /api/users/test
// @desc Test the Users route
// @access Public
router.get('/test', (req, res) => {
  res.send('Profile route working')
})

// @route GET /api/users
// @desc Get user
// @access Private
router.get('/current', requiresAuth, async (req, res, next) => {
  try {
    res.json(req.user)
  } catch (error) {
    next(error)
  }
})

// @route POST /api/users
// @desc Create a new user
// @access Private
router.post('/', requiresAuth, async (req, res, next) => {
  try {
    const userAddress = req.user?.address
    if (!userAddress) {
      return res.status(400).json({ error: 'Authenticated user address not found' })
    }

    const existingUser = await User.findOne({ address: userAddress })
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' })
    }

    const newUser = new User({
      username: userAddress, // Default username
      address: userAddress,
    })
    const savedUser = await newUser.save()
    res.status(201).json(savedUser) // Use 201 Created
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'User already exists.' })
    }
    next(error)
  }
})

// @route PUT /api/users/:property
// @desc Update user information
// @access Private
router.put('/:property', requiresAuth, async (req, res, next) => {
  try {
    const { property } = req.params
    const userId = req.user._id
    const value = req.body[property]

    if (value === undefined) {
      return res.status(400).json({
        error: `Missing value for field '${property}' in request body.`,
      })
    }

    let updatedFields = {}

    switch (property) {
      case 'username': {
        const usernameError = await checkForExistingUsername(value)
        if (usernameError) {
          return res.status(400).json(usernameError)
        }
        updatedFields.username = value
        break
      }
      case 'image': {
        updatedFields.image = value
        break
      }
      default:
        return res.status(400).json({ error: 'Invalid property' })
    }

    const updatedUser = await User.findOneAndUpdate({ _id: userId }, updatedFields, {
      new: true,
    }).lean()

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found during update.' }) // Should not happen if auth passed
    }

    res.json(updatedUser)
  } catch (error) {
    next(error)
  }
})

export default router
