import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express'

/**
 * Express error handling middleware (must be registered LAST with `app.use`).
 *
 * @remarks
 * - Determines HTTP status code, preferring `error.statusCode` if present and valid (400-599), otherwise defaults to 500.
 * - Determines error message, preferring `error.message` if available, otherwise uses a default fallback.
 * - Logs the full error object to `console.error` (consider a structured logger in production).
 */
const errorHandler: ErrorRequestHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  let statusCode: number = 500
  let errorMessage: string = 'An unexpected error occurred'
  let stack: string | undefined = undefined

  if (error instanceof Error) {
    errorMessage = error.message || errorMessage
    stack = error.stack

    // Check if the error has a statusCode property
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      typeof error.statusCode === 'number' &&
      error.statusCode >= 400 &&
      error.statusCode < 600
    ) {
      statusCode = error.statusCode
    }
  }

  console.error(`[ErrorHandler] Status: ${statusCode}, Path: ${_req.path}, Error:`, error)

  // Prepare the response based on the environment
  if (process.env.NODE_ENV === 'production') {
    // In production, return the error message only
    res.status(statusCode).json({ error: errorMessage })
  } else {
    // In development, return the full error object for debugging
    const errorResponse: { error: string; stack?: string } = {
      error: errorMessage,
      stack: stack,
    }
    res.status(statusCode).json(errorResponse)
  }
}

export default errorHandler
