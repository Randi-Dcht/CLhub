import { SessionOptions } from 'iron-session'
import { SessionData } from '@/types'

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? 'fallback-secret-please-set-SESSION_SECRET-env-32c',
  cookieName: 'changelog_hub_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export type { SessionData }
