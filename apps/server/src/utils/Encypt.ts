import { hash } from 'node:crypto';

type HashAlgorithms = 'sha1';
type OutPutEncoding = 'base64' | 'base64url' | 'hex' | 'binary';

const SALT_SECRET = process.env.SALT_SECRET ?? '';

export class Encrypt {
  public static hash(
    algorith: HashAlgorithms,
    data: string,
    outputEncoding?: OutPutEncoding,
  ) {
    return hash(algorith, data, outputEncoding);
  }

  public static saltHash() {}
  public static symetric() {}
  public static assymetric() {}
}
