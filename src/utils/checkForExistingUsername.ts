import User from '../models/User.ts'

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
    const existingUsername = await User.findOne({
      username: new RegExp('^' + username + '$', 'i'),
    })
    if (existingUsername) {
      return { error: 'Username already exists' }
    }
    return null
  } catch (error: unknown) {
    console.error('Error checking for existing username', error)
    return { error: 'Error checking for existing username' }
  }
}
