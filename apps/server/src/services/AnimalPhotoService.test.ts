import assert from 'node:assert/strict';
import test from 'node:test';
import { isAllowedImageContent } from './AnimalPhotoService';

test('accepts image content whose signature matches its MIME type', () => {
  assert.equal(isAllowedImageContent(Buffer.from([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg'), true);
  assert.equal(isAllowedImageContent(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/png'), true);
  assert.equal(isAllowedImageContent(Buffer.from('RIFF0000WEBP'), 'image/webp'), true);
});

test('rejects spoofed and unsupported image content', () => {
  assert.equal(isAllowedImageContent(Buffer.from('not an image'), 'image/png'), false);
  assert.equal(isAllowedImageContent(Buffer.from([0xff, 0xd8, 0xff]), 'image/gif'), false);
});
