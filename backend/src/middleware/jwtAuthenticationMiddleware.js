import { verifyToken } from '../services/userAuthenticationService.js';
import { AppError } from '../utils/index.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError(401, 'Authentication required.'));
  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError(401, 'Authentication required.'));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, `This action requires the ${roles.join('/')} role.`));
    }
    return next();
  };
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      req.user = null;
    }
  }
  return next();
}