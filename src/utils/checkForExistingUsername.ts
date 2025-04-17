import User from '../models/User.js'

/**
 * Type for the result of the checkForExistingUsername function.
 */
type CheckUsernameResult = { error: string } | null

/**
 * Checks if a username already exists in the User collection.
 * @param username - The username string to check (case-insensitive).
 * @returns A promise resolving to an error object if username exists or DB error occurs, otherwise null.
 */
export const checkForExistingUsername = async (username: string): Promise<CheckUsernameResult> => {
  try {
    // Check if the username already exists (case-insensitive)
    const existingUsername = await User.findOne({
      // eslint-disable-next-line security/detect-non-literal-regexp
      username: new RegExp('^' + username + '$', 'i'),
    })
    // If a user with the same username exists, return an error
    if (existingUsername) {
      return { error: 'Username already exists' }
    }
    // If no user with the same username exists, return null
    return null
  } catch (error: unknown) {
    console.error('Error checking for existing username', error)
    return { error: 'Error checking for existing username' }
  }
}
