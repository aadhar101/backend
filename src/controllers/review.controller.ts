import { Response, NextFunction } from 'express';
import { reviewService, userService } from '../services';
import { AuthenticatedRequest } from '../types/user.type';

// ─── Review Controller ────────────────────────────────────────────────────────

export class ReviewController {
  async createReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      const images = files.map((f) => f.path);
      const review = await reviewService.createReview(req.user!._id.toString(), req.body, images);
      res.status(201).json({ success: true, message: 'Review submitted', data: review });
    } catch (error) { next(error); }
  }

  async getHotelReviews(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query;
      const result = await reviewService.getHotelReviews(req.params.hotelId, Number(page) || 1, Number(limit) || 10);
      res.json({ success: true, data: result.data, pagination: { ...result, data: undefined } });
    } catch (error) { next(error); }
  }

  async getAllReviews(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, approved } = req.query;
      const result = await reviewService.getAllReviews(Number(page) || 1, Number(limit) || 10, approved as string);
      res.json({ success: true, data: result.data, pagination: { ...result, data: undefined } });
    } catch (error) { next(error); }
  }

  async approveReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const review = await reviewService.approveReview(req.params.id, req.body.approved);
      res.json({ success: true, data: review });
    } catch (error) { next(error); }
  }

  async respondToReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const review = await reviewService.respondToReview(req.params.id, req.body, req.user!._id.toString());
      res.json({ success: true, data: review });
    } catch (error) { next(error); }
  }

  async deleteReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await reviewService.deleteReview(req.params.id);
      res.json({ success: true, message: 'Review deleted' });
    } catch (error) { next(error); }
  }
}

export const reviewController = new ReviewController();

// ─── User Controller ──────────────────────────────────────────────────────────

export class UserController {
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getProfile(req.user!._id.toString());
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // single file upload — req.file is set by multer
      const avatar = (req.file as Express.Multer.File | undefined)?.path;
      const user = await userService.updateProfile(req.user!._id.toString(), req.body, avatar);
      res.json({ success: true, message: 'Profile updated', data: user });
    } catch (error) { next(error); }
  }

  async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query;
      const result = await userService.getAllUsers(Number(page) || 1, Number(limit) || 10);
      res.json({ success: true, data: result.data, pagination: { ...result, data: undefined } });
    } catch (error) { next(error); }
  }

  async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getUserById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  async toggleUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.toggleUserStatus(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateUserRole(req.params.id, req.body.role);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.deleteUser(req.params.id);
      res.json({ success: true, message: 'User deleted' });
    } catch (error) { next(error); }
  }
}

export const userController = new UserController();
