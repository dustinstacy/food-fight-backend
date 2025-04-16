import User from '../models/User.js'

export const checkForExistingUsername = async (newUsername) => {
  try {
    const existingUsername = await User.findOne({
      username: new RegExp('^' + newUsername + '$', 'i'), // Case-insensitive check
    })
    if (existingUsername) {
      return { error: 'Username already exists' }
    }
    return null
  } catch (error) {
    console.error('Error checking for existing username', error)
    return { error: 'Error checking for existing username' }
  }
}
