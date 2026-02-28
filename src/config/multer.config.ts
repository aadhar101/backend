import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { BadRequestError } from '../errors/http-error';

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Storage engine
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let folder = 'uploads/misc';

    if (req.baseUrl.includes('hotels')) folder = 'uploads/hotels';
    else if (req.baseUrl.includes('rooms')) folder = 'uploads/rooms';
    else if (req.baseUrl.includes('users')) folder = 'uploads/avatars';
    else if (req.baseUrl.includes('reviews')) folder = 'uploads/reviews';

    ensureDir(folder);
    cb(null, folder);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter - images only
const imageFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only JPEG, PNG, WebP, and GIF images are allowed'));
  }
};

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB

export const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_SIZE },
});

// Helpers
export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount = 10) => upload.array(fieldName, maxCount);
export const uploadFields = (fields: multer.Field[]) => upload.fields(fields);

// Get public URL for uploaded file
export const getFileUrl = (filename: string, folder: string): string => {
  return `/uploads/${folder}/${path.basename(filename)}`;
};

// Delete file from disk
export const deleteFile = (filePath: string): void => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};