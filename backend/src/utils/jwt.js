import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signJwt(payload, options = {}) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d', ...options });
}

export function verifyJwt(token) {
  return jwt.verify(token, env.jwtSecret);
}


