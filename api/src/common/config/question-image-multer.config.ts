import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

// Tipos aceitos para imagens de questões
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (maior que avatar para suportar imagens mais detalhadas)

export const questionImageMulterConfig = {
  storage: diskStorage({
    destination: './public/question-images',
    filename: (req: Request, file: Express.Multer.File, callback) => {
      // Gera nome único: timestamp-random-extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `question-${uniqueSuffix}${ext}`;
      callback(null, filename);
    },
  }),
  fileFilter: (req: Request, file: Express.Multer.File, callback) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Tipo de arquivo inválido. Apenas JPEG, PNG, WEBP e GIF são permitidos',
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
