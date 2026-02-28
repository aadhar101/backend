import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt.config';
import { UserModel } from '../models/user.model';
import { UnauthorizedError, ForbiddenError, AppError } from '../errors/http-error';
import { AuthenticatedRequest, UserRole } from '../types/user.type';

// ─── Auth Middleware ──────────────────────────────────────────────────────────

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await UserModel.findById(decoded.id).select('+refreshToken');
    if (!user || !user.isActive) throw new UnauthorizedError('User not found or inactive');
    req.user = user;
    next();
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'JsonWebTokenError') next(new UnauthorizedError('Invalid token'));
    else if (err.name === 'TokenExpiredError') next(new UnauthorizedError('Token expired'));
    else next(error);
  }
};

// ─── Role Authorization ───────────────────────────────────────────────────────

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) { next(new UnauthorizedError()); return; }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('You do not have permission to perform this action'));
      return;
    }
    next();
  };
};

export const adminOnly = authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN);
export const superAdminOnly = authorize(UserRole.SUPER_ADMIN);

// ─── Validate Request (manual, no express-validator dependency) ───────────────

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Placeholder — validation is done inline in services/DTOs
  next();
};

// ─── Global Error Handler ─────────────────────────────────────────────────────

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const error = err as Record<string, any>;
  console.error(`[Error] ${error?.message}`, error?.stack);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // Mongoose validation error
  if (error?.name === 'ValidationError') {
    const messages = Object.values(error.errors || {}).map((e: any) => e.message);
    res.status(400).json({ success: false, message: messages.join(', ') });
    return;
  }

  // Mongoose duplicate key
  if (error?.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0];
    res.status(409).json({ success: false, message: `${field} already exists` });
    return;
  }

  // Mongoose cast error
  if (error?.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid ID format' });
    return;
  }

  // Multer errors
  if (error?.name === 'MulterError') {
    res.status(400).json({ success: false, message: `Upload error: ${error.message}` });
    return;
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error?.message || 'Unknown error'),
  });
};

// ─── 404 Handler ─────────────────────────────────────────────────────────────

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

// ─── Simple In-Memory Rate Limiter ────────────────────────────────────────────

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const record = requestCounts.get(ip);

    if (!record || now > record.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }
    record.count++;
    if (record.count > maxRequests) {
      res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
      return;
    }
    next();
  };
};
