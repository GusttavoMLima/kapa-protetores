import { Url } from '../../src/domains/Url';

describe('Url Value Object', () => {
  it('should preserve casing in URL paths, tokens, and query parameters', () => {
    const googleAvatarUrl =
      'https://lh3.googleusercontent.com/a/ACg8ocKj5bUBjtQMPWLDqq3cbn6OOwbxsQODpm_8JArvUfunrRd5xf492Q=s96-c';
    const parsed = Url.create(googleAvatarUrl);

    expect(parsed.toString()).toBe(googleAvatarUrl);
    expect(parsed.getValue()).toBe(googleAvatarUrl);
  });
});
