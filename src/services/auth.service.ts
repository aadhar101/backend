import crypto from 'crypto';
import { userRepository } from '../repositories';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, sendPasswordResetEmail } from '../config/jwt.config';
import { UnauthorizedError, NotFoundError, ConflictError, BadRequestError } from '../errors/http-error';
import { RegisterDto, LoginDto } from '../dtos/auth.dto';
import { IUser, UserRole, JwtPayload } from '../types/user.type';

export class AuthService {
  async register(dto: RegisterDto): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) throw new ConflictError('Email already registered');

    const user = await userRepository.create({
      ...dto,
      role: UserRole.GUEST,
      isEmailVerified: true, // auto-verify for now; swap for email flow
    });

    const payload: JwtPayload = { id: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await userRepository.updateById(user._id.toString(), { refreshToken });

    return { user, accessToken, refreshToken };
  }

  async login(dto: LoginDto): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await userRepository.findByEmail(dto.email, true);
    if (!user) throw new UnauthorizedError('Invalid email or password');
    if (!user.isActive) throw new UnauthorizedError('Account is deactivated');

    const isMatch = await user.comparePassword(dto.password);
    if (!isMatch) throw new UnauthorizedError('Invalid email or password');

    const payload: JwtPayload = { id: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await userRepository.updateById(user._id.toString(), { refreshToken });

    return { user, accessToken, refreshToken };
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const decoded = verifyRefreshToken(token);
    const user = await userRepository.findById(decoded.id);
    if (!user) throw new UnauthorizedError();

    const payload: JwtPayload = { id: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await userRepository.updateById(user._id.toString(), { refreshToken: newRefreshToken });
    return { accessToken, refreshToken: newRefreshToken };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) return; // Silent fail for security

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await userRepository.updateById(user._id.toString(), {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    await sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await userRepository.findByResetToken(hashedToken);
    if (!user) throw new BadRequestError('Invalid or expired reset token');

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.model.findById(userId).select('+password');
    if (!user) throw new NotFoundError('User not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new BadRequestError('Current password is incorrect');

    user.password = newPassword;
    await user.save();
  }

  async logout(userId: string): Promise<void> {
    await userRepository.updateById(userId, { refreshToken: undefined });
  }
}

export const authService = new AuthService();