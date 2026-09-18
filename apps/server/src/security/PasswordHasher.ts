import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export class PasswordHasher {
  public async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
    return `scrypt$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
  }

  public async verify(password: string, storedHash: string): Promise<boolean> {
    const [algorithm, saltValue, hashValue] = storedHash.split('$');
    if (algorithm !== 'scrypt' || !saltValue || !hashValue) return false;

    try {
      const salt = Buffer.from(saltValue, 'base64url');
      const expected = Buffer.from(hashValue, 'base64url');
      const actual = (await scrypt(password, salt, expected.length)) as Buffer;
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    } catch {
      return false;
    }
  }
}
