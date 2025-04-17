// src/api/users.ts
import { Router, Request, Response, NextFunction, RequestHandler } from 'express'

import requiresAuth from '../middleware/requiresAuth.js'
import User from '../models/User.js'
import { checkForExistingUsername } from '../utils/checkForExistingUsername.js'

import type { IUser } from '../types/models.types.js'

const router: Router = Router()

/**
 * PUBLIC
 * GET /api/users/test
 * Simple route to test if the users API is reachable.
 */
router.get('/test', (_req: Request, res: Response) => {
  res.send('User Profile route working')
})

/**
 * PRIVATE
 * GET /api/users/current
 * Fetches the current user's profile data.
 */
router.get(
  '/current',
  requiresAuth as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: User not found in session' })
        return
      }

      // Return the current user's profile data
      res.json(req.user)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PRIVATE
 * POST /api/users/
 * Creates a new user profile if it doesn't exist.
 */
router.post(
  '/',
  requiresAuth as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if the user address is available in the session
      const userAddress = req.user?.address
      if (!userAddress) {
        res.status(400).json({ error: 'User address not found in session.' })
        return
      }

      // Check if the user already exists in the database
      const existingUser = await User.findOne({ address: userAddress })
      if (existingUser) {
        res.status(200).json(existingUser)
        return
      }

      // Create a new user if it doesn't exist
      const newUser = new User({ username: userAddress, address: userAddress })
      const savedUser: IUser = await newUser.save()

      // Return the newly created user
      res.status(201).json(savedUser)
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        res.status(409).json({ error: 'User with this address already exists (duplicate key).' })
        return
      }
      next(error)
    }
  }
)

// Define the specific properties that are allowed to be updated via the /api/users/:property route
type UpdatableUserProperty = Extract<keyof IUser, 'username' | 'image'>
const validUpdateProperties: UpdatableUserProperty[] = ['username', 'image']

// Type Guard function to check if a string is an allowed property key
function isValidUpdateProperty(property: string | undefined): property is UpdatableUserProperty {
  return typeof property === 'string' && (validUpdateProperties as string[]).includes(property)
}

/**
 * PRIVATE
 * PUT /api/users/:property
 * Updates a specific property of the user profile.
 */
router.put(
  '/:property',
  requiresAuth as RequestHandler,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request parameters and _id
      const property = req.params.property
      const userId = req.user?._id
      if (!isValidUpdateProperty(property)) {
        res.status(400).json({
          error: `Invalid property specified: ${property}. Allowed: ${validUpdateProperties.join(', ')}`,
        })
        return
      }
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized: User session invalid' })
        return
      }

      // Update the user profile based on the specified property
      let updatedFields: Partial<IUser> = {}
      switch (property) {
        case 'username': {
          // Validate the username
          const value = req.body.username
          if (value === undefined || typeof value !== 'string' || value.trim() === '') {
            return
          }
          // Check if the username is already taken
          const usernameError = await checkForExistingUsername(value)
          if (usernameError) {
            return
          }
          updatedFields.username = value
          break
        }
        case 'image': {
          // Validate the image URL
          const value = req.body.image
          if (value === undefined || typeof value !== 'string' || value.trim() === '') {
            return
          }
          try {
            // Validate the URL format
            new URL(value)
          } catch {
            return
          }
          updatedFields.image = value
          break
        }
      }

      // Perform the update operation
      const updatedUser = await User.findOneAndUpdate({ _id: userId }, updatedFields, {
        new: true,
        runValidators: true,
      }).lean<IUser>()
      if (!updatedUser) {
        res.status(404).json({ error: 'User not found during update attempt.' })
        return
      }

      // Return the updated user profile
      res.json(updatedUser)
    } catch (error) {
      next(error)
    }
  }
)

export default router
