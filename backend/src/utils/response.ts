import { Response } from 'express'

export const ok = <T>(
  res: Response,
  message: string,
  data?: T,
  meta?: Record<string, unknown>,
  status = 200
) =>
  res.status(status).json({ success: true, message, data, meta })

export const created = <T>(res: Response, message: string, data?: T) =>
  ok(res, message, data, undefined, 201)

export const badRequest = (
  res: Response,
  message: string,
  errors?: Record<string, string>
) => res.status(400).json({ success: false, message, errors })

export const unauthorized = (res: Response, message = 'Unauthorized') =>
  res.status(401).json({ success: false, message })

export const forbidden = (res: Response, message = 'Forbidden') =>
  res.status(403).json({ success: false, message })

export const notFound = (res: Response, message = 'Resource not found') =>
  res.status(404).json({ success: false, message })

export const conflict = (res: Response, message: string) =>
  res.status(409).json({ success: false, message })

export const tooMany = (res: Response, message = 'Too many requests') =>
  res.status(429).json({ success: false, message })

export const serverError = (res: Response, message = 'Internal server error') =>
  res.status(500).json({ success: false, message })
