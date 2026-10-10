export const GOOGLE_OAUTH_WEB_CHANNEL = 'kapa:google-oauth-result';

export type GoogleOAuthWebMessage = {
  type: 'google-oauth-result';
  url: string;
};

export function isGoogleOAuthWebMessage(
  value: unknown,
): value is GoogleOAuthWebMessage {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Record<string, unknown>;
  return (
    candidate.type === 'google-oauth-result' &&
    typeof candidate.url === 'string' &&
    candidate.url.length <= 8192
  );
}
