import '../config/env';
import crypto from 'node:crypto';

type HashAlgorithms = 'sha1';
type OutPutEncoding = 'base64' | 'base64url' | 'hex' | 'binary';

function getSaltSecret(): string {
  const secret = process.env.SALT_SECRET || process.env.ENCRYPT_SALT;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Encrypt] SALT_SECRET must be defined in production');
    }
    return 'kapa_default_dev_salt_secret_2026';
  }
  return secret;
}

export class Encrypt {
  public static hash(
    algorith: HashAlgorithms,
    data: string,
    outputEncoding?: OutPutEncoding,
  ) {
    return crypto.hash(algorith, data, outputEncoding);
  }

  public static saltHash(data: string) {
    return crypto.pbkdf2Sync(data, getSaltSecret(), 100000, 64, 'sha512');
  }

  public static verifySaltHash(data: string, hashed: string) {
    const verifyHash = this.saltHash(data).toString('hex');

    return verifyHash === hashed;
  }

  public static symetric() {}
  public static assymetric() {}
}
