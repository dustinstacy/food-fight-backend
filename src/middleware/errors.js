// Provides error handling middleware for routes
const errorHandler = (error, req, res, next) => {
    // Set status code to 500 if none is provided
    const statusCode = error.statusCode || 500

    // Set default error message
    let errorMessage = error.message || "An error occurred"

    // Set specific error messages based on status code
    switch (statusCode) {
        case 400:
            errorMessage = error.message || "Bad Request"
            break
        case 401:
            errorMessage = error.message || "Unauthorized"
            break
        case 403:
            errorMessage = error.message || "Forbidden"
            break
        case 404:
            errorMessage = error.message || "Not Found"
            break
        case 500:
            errorMessage = error.message || "Internal Server Error"
            break
        default:
            errorMessage = error.message || "An error occurred"
    }

    // Log the error for debugging purposes
    console.error("Error:", error)

    // Return an error response to the client
    if (process.env.NODE_ENV === "production") {
        // In production, send minimal information to the client
        res.status(statusCode).json({ error: errorMessage })
    } else {
        // In development, include the stack trace for debugging
        const errorResponse = {
            error: errorMessage,
            stack: error.stack || "No stack trace available",
        }
        res.status(statusCode).json(errorResponse)
    }
}

export default errorHandler
