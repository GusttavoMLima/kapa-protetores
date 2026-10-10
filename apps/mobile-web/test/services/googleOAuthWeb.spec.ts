import {
  GOOGLE_OAUTH_WEB_CHANNEL,
  isGoogleOAuthWebMessage,
} from '@/services/googleOAuthWeb';

describe('googleOAuthWeb', () => {
  it('uses a stable same-origin channel name', () => {
    expect(GOOGLE_OAUTH_WEB_CHANNEL).toBe('kapa:google-oauth-result');
  });

  it('accepts a valid OAuth result message', () => {
    expect(
      isGoogleOAuthWebMessage({
        type: 'google-oauth-result',
        url: 'https://kapa-web-staging.vercel.app/oauthredirect?code=abc',
      }),
    ).toBe(true);
  });

  it.each([
    null,
    'invalid',
    {},
    { type: 'other', url: 'https://example.com' },
    { type: 'google-oauth-result', url: 123 },
    { type: 'google-oauth-result', url: 'a'.repeat(8193) },
  ])('rejects malformed messages: %p', (message) => {
    expect(isGoogleOAuthWebMessage(message)).toBe(false);
  });
});
