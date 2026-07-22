import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

// Tipos aceitos para imagens
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const multerConfig = {
  storage: memoryStorage(),
  fileFilter: (req: Request, file: Express.Multer.File, callback) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Tipo de arquivo inválido. Apenas JPEG, PNG e WEBP são permitidos',
        ),
        false,
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
};
