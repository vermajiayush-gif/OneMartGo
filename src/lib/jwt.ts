import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-me';
const ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || 'admin-secret-change-me';

export interface TokenPayload {
  userId: string;
  role: string;
  email?: string;
  phone?: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });
}

export function generateAdminToken(payload: TokenPayload): string {
  return jwt.sign(payload, ADMIN_SECRET, { expiresIn: '8h' });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyAdminToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ADMIN_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
