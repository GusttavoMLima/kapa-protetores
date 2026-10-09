import { isAllowedImageContent } from '../../src/services/AnimalPhotoService';

describe('AnimalPhotoService', () => {
  it('accepts image content whose signature matches its MIME type', () => {
    expect(isAllowedImageContent(Buffer.from([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg')).toBe(true);
    expect(isAllowedImageContent(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/png')).toBe(true);
    expect(isAllowedImageContent(Buffer.from('RIFF0000WEBP'), 'image/webp')).toBe(true);
  });

  it('rejects spoofed and unsupported image content', () => {
    expect(isAllowedImageContent(Buffer.from('not an image'), 'image/png')).toBe(false);
    expect(isAllowedImageContent(Buffer.from([0xff, 0xd8, 0xff]), 'image/gif')).toBe(false);
  });
});
