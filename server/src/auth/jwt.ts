import jwt from "jsonwebtoken";

const SECRET: string = process.env.JWT_SECRET ?? throwMissingSecret();

function throwMissingSecret(): never {
  throw new Error("JWT_SECRET is not set");
}

export interface AuthTokenPayload {
  userId: string;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}
