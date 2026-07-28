// Augment Express Request to ensure body/params/query are typed
import { JwtPayload } from './index'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
      apiUser?: { userId: string; keyId: string }
    }
  }
}

export {}
