import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types/user.type';

export class AuthController {
  async register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, accessToken, refreshToken } = await authService.register(req.body);
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000 });
      res.status(201).json({ success: true, message: 'Registration successful', data: { user, accessToken } });
    } catch (error) { next(error); }
  }

  async login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, accessToken, refreshToken } = await authService.login(req.body);
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000 });
      res.json({ success: true, message: 'Login successful', data: { user, accessToken } });
    } catch (error) { next(error); }
  }

  async refreshToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body.refreshToken;
      if (!token) { res.status(401).json({ success: false, message: 'No refresh token' }); return; }
      const tokens = await authService.refreshToken(token);
      res.json({ success: true, data: tokens });
    } catch (error) { next(error); }
  }

  async forgotPassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.forgotPassword(req.body.email);
      res.json({ success: true, message: 'If email exists, a reset link has been sent' });
    } catch (error) { next(error); }
  }

  async resetPassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.body.token, req.body.password);
      res.json({ success: true, message: 'Password reset successful' });
    } catch (error) { next(error); }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.changePassword(req.user!._id.toString(), req.body.currentPassword, req.body.newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) { next(error); }
  }

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(req.user!._id.toString());
      res.clearCookie('refreshToken');
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) { next(error); }
  }

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.json({ success: true, data: req.user });
  }
}

export const authController = new AuthController();