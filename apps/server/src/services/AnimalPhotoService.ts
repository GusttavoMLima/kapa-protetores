import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../errors/AppError';

const allowedImages = {
  'image/jpeg': { extension: 'jpg', matches: (data: Buffer) => data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff },
  'image/png': { extension: 'png', matches: (data: Buffer) => data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/webp': { extension: 'webp', matches: (data: Buffer) => data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP' },
} as const;

export type AllowedImageMime = keyof typeof allowedImages;

export function isAllowedImageContent(data: Buffer, mimeType: string): mimeType is AllowedImageMime {
  const image = allowedImages[mimeType as AllowedImageMime];
  return Boolean(image?.matches(data));
}

function detectImageContent(data: Buffer): AllowedImageMime | undefined {
  return (Object.keys(allowedImages) as AllowedImageMime[])
    .find((mimeType) => allowedImages[mimeType].matches(data));
}

export type UploadedAnimalPhoto = {
  id: string;
  photoUrl: string;
  animalId: string | null;
  uploadedAt: string;
};

export class AnimalPhotoService {
  private readonly client: S3Client;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly bucket: string,
    private readonly publicUrl: string,
    endpoint: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string,
  ) {
    this.client = new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  public async upload(animalId: string, file: Express.Multer.File): Promise<UploadedAnimalPhoto> {
    const animal = await this.prisma.animal.findUnique({ where: { id: animalId }, select: { id: true } });
    if (!animal) throw AppError.notFound('Animal não encontrado.');
    const detectedMimeType = detectImageContent(file.buffer);
    if (!detectedMimeType) {
      throw AppError.badRequest('A foto deve ser um arquivo JPEG, PNG ou WebP válido.');
    }

    const image = allowedImages[detectedMimeType];
    const key = `animals/${animalId}/${randomUUID()}.${image.extension}`;
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: detectedMimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));

    const photoUrl = `${this.publicUrl.replace(/\/$/, '')}/${this.bucket}/${key}`;
    try {
      const photo = await this.prisma.animalPhotos.create({
        data: { animal_id: animalId, photo_url: photoUrl },
      });
      return { id: photo.id, photoUrl: photo.photo_url, animalId: photo.animal_id, uploadedAt: photo.uploaded_at.toISOString() };
    } catch (error) {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })).catch(() => undefined);
      throw error;
    }
  }
}
