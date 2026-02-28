import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/user.type';

// ─── JWT Helpers ──────────────────────────────────────────────────────────────

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;
};

// ─── Email (dynamic import of nodemailer so missing types don't break compile) ─

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodemailer = require('nodemailer') as typeof import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: `"Hotel App" <${process.env.EMAIL_FROM}>`,
    ...options,
  });
};

export const sendBookingConfirmationEmail = async (
  email: string,
  bookingRef: string,
  guestName: string,
  checkIn: Date,
  checkOut: Date,
  hotelName: string,
  totalAmount: number
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: `Booking Confirmed - ${bookingRef}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#2563eb;">Booking Confirmed! 🎉</h2>
        <p>Dear ${guestName},</p>
        <p>Your booking has been confirmed:</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Reference</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${bookingRef}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Hotel</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${hotelName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Check-in</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${new Date(checkIn).toDateString()}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Check-out</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${new Date(checkOut).toDateString()}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Total</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">$${totalAmount}</td></tr>
        </table>
        <p>Thank you for choosing us!</p>
      </div>`,
  });
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family:Arial,sans-serif;">
        <h2>Password Reset</h2>
        <p>Click below to reset your password (valid 1 hour):</p>
        <a href="${resetUrl}" style="background:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a>
        <p>If you didn't request this, ignore this email.</p>
      </div>`,
  });
};