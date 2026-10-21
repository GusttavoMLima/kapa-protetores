import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../errors';
import { allowedImages, detectImageContent } from './AnimalPhotoService';
import {
  buildUserCountsCacheKey,
  buildUserProfileCacheKey,
} from './UserService';
import type { CacheProvider } from './RedisService';

export class UserPhotoService {
  private readonly client: S3Client;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly bucket: string,
    private readonly publicUrl: string,
    endpoint: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string,
    private readonly cache?: CacheProvider,
  ) {
    this.client = new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  public async upload(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundError('Usuário não encontrado.');

    const detectedMimeType = detectImageContent(file.buffer);
    if (!detectedMimeType) {
      throw new BadRequestError(
        'A foto deve ser um arquivo JPEG, PNG ou WebP válido.',
      );
    }

    const image = allowedImages[detectedMimeType];
    const key = `avatars/${userId}/${randomUUID()}.${image.extension}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: detectedMimeType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    const base = this.publicUrl.replace(/\/+$/, '');
    const avatarUrl = base.endsWith(`/${this.bucket}`)
      ? `${base}/${key}`
      : `${base}/${this.bucket}/${key}`;

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
      });
      if (this.cache) {
        await Promise.all([
          this.cache.deleteCache(buildUserProfileCacheKey(userId)),
          this.cache.deleteCache(buildUserCountsCacheKey(userId)),
        ]);
      }

      return { avatarUrl };
    } catch (error) {
      await this.client
        .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
        .catch(() => undefined);
      throw error;
    }
  }
}
