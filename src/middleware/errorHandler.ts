// src/middleware/errors.ts
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express'

//////////////////////////////////////////////////////////////
/// Interface                                              ///
//////////////////////////////////////////////////////////////

/**
 * Custom error interface extending the standard Error object.
 * Allows for an optional statusCode property to indicate HTTP status.
 */
interface HttpError extends Error {
  /**
   * Optional HTTP status code for the error.
   * Should be in the range of 400-599 for client and server errors respectively.
   */
  statusCode?: number
}

//////////////////////////////////////////////////////////////
/// Error Handling Middleware                              ///
//////////////////////////////////////////////////////////////

/**
 * Express error handling middleware (must be registered LAST with `app.use`).
 *
 * @remarks
 * - Determines HTTP status code, preferring `error.statusCode` if present and valid (400-599), otherwise defaults to 500.
 * - Determines error message, preferring `error.message` if available, otherwise uses a default fallback.
 * - Logs the full error object to `console.error` (consider a structured logger in production).
 *
 * @param error - The error object. Can be a standard Error, HttpError, or other value.
 * @param req - The Express request object (unused).
 * @param res - The Express response object (used to send the error response).
 * @param _next - The Express next function (required in signature for error handlers, but unused here).
 */
const errorHandler: ErrorRequestHandler = (
  error: HttpError | Error | any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Determine the status code from the error object or default to 500
  const statusCode: number =
    typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500

  // Determine the error message from the error object or default to a generic message
  let errorMessage: string = 'An unexpected error occurred'
  if (error instanceof Error && error.message) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  }

  // Log the error details to the console
  console.error(`[ErrorHandler] Status: ${statusCode}, Path: ${_req.path}, Error:`, error)

  // Prepare the response based on the environment
  if (process.env.NODE_ENV === 'production') {
    // In production, return the error message only
    res.status(statusCode).json({ error: errorMessage })
  } else {
    // In development, return the full error object for debugging
    const errorResponse: { error: string; stack?: string } = {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    }
    res.status(statusCode).json(errorResponse)
  }
}

export default errorHandler
