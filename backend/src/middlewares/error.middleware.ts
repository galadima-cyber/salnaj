import { Request, Response, NextFunction, RequestHandler } from 'express'
import { logger }      from '../config/logger'
import { serverError } from '../utils/response'

/** Wrap async route handlers — eliminates try/catch boilerplate */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => fn(req, res, next).catch(next)
}

/** 404 handler — mount after all routes */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  })
}

/** Global error handler — mount last */
export function globalErrorHandler(
  err: Error & { statusCode?: number; isOperational?: boolean },
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500

  logger.error('Unhandled error', {
    message:    err.message,
    stack:      err.stack,
    path:       req.path,
    method:     req.method,
    statusCode,
  })

  if (statusCode < 500) {
    // Operational / expected error — safe to show message
    res.status(statusCode).json({ success: false, message: err.message })
    return
  }

  // Programming error — hide internal details from client
  serverError(res, 'Something went wrong. Our team has been notified.')
}

/** Custom operational error class */
export class AppError extends Error {
  statusCode:    number
  isOperational: boolean

  constructor(message: string, statusCode = 400) {
    super(message)
    this.statusCode    = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}
