import { Request, Response, NextFunction } from 'express'
import { validationResult, body, param, query } from 'express-validator'
import { badRequest } from '../utils/response'

/** Run after validation chains — returns 400 if any errors */
export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formatted: Record<string, string> = {}
    errors.array().forEach(err => {
      if (err.type === 'field') formatted[err.path] = err.msg
    })
    badRequest(res, 'Validation failed', formatted)
    return
  }
  next()
}

// ─── Reusable validation chains ──────────────────────────────

export const v = {
  email: () =>
    body('email')
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage('Enter a valid email address'),

  phone: () =>
    body('phone')
      .trim()
      .matches(/^(0[789][01]\d{8}|(\+234)[789][01]\d{8})$/)
      .withMessage('Enter a valid Nigerian phone number'),

  password: () =>
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),

  pin: () =>
    body('pin')
      .matches(/^\d{4}$/)
      .withMessage('PIN must be exactly 4 digits'),

  otp: () =>
    body('otp')
      .matches(/^\d{6}$/)
      .withMessage('OTP must be 6 digits'),

  amount: (field = 'amount', min = 100) =>
    body(field)
      .isFloat({ min })
      .withMessage(`Amount must be at least ₦${min}`),

  network: () =>
    body('network')
      .isIn(['MTN', 'AIRTEL', 'GLO', 'ETISALAT'])
      .withMessage('Network must be one of: MTN, AIRTEL, GLO, ETISALAT'),

  required: (field: string, label?: string) =>
    body(field)
      .trim()
      .notEmpty()
      .withMessage(`${label || field} is required`),

  positiveInt: (field: string, label?: string) =>
    body(field)
      .isInt({ min: 1 })
      .withMessage(`${label || field} must be a positive integer`),
}
