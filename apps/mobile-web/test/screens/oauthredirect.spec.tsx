import { render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import OAuthRedirectScreen from '../../app/oauthredirect';
import { GOOGLE_OAUTH_WEB_CHANNEL } from '@/services/googleOAuthWeb';

const mockMaybeCompleteAuthSession = jest.fn();

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: (...args: unknown[]) =>
    mockMaybeCompleteAuthSession(...args),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  Stack: { Screen: () => null },
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isLogged: false, isReady: true }),
}));

jest.mock('@/../assets/Logo 2.svg', () => () => null);

class BroadcastChannelMock {
  static instances: BroadcastChannelMock[] = [];

  postMessage = jest.fn();
  close = jest.fn();

  constructor(readonly name: string) {
    BroadcastChannelMock.instances.push(this);
  }
}

describe('OAuthRedirectScreen on web', () => {
  const close = jest.fn();
  const setTimeoutMock = jest.fn(() => 1);
  const clearTimeoutMock = jest.fn();

  beforeEach(() => {
    BroadcastChannelMock.instances = [];
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      configurable: true,
      value: BroadcastChannelMock,
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: {
          href: 'https://kapa.test/oauthredirect?id_token=google-token',
        },
        setTimeout: setTimeoutMock,
        clearTimeout: clearTimeoutMock,
        close,
      },
    });
  });

  it('keeps the standard Expo completion flow when the opener is available', async () => {
    mockMaybeCompleteAuthSession.mockReturnValue({ type: 'success' });

    await render(<OAuthRedirectScreen />);

    expect(mockMaybeCompleteAuthSession).toHaveBeenCalledTimes(1);
    expect(BroadcastChannelMock.instances).toHaveLength(0);
  });

  it('sends the callback through a same-origin channel when Expo cannot complete it', async () => {
    mockMaybeCompleteAuthSession.mockReturnValue({ type: 'failed' });

    const screen = await render(<OAuthRedirectScreen />);
    const channel = BroadcastChannelMock.instances[0];

    expect(channel?.name).toBe(GOOGLE_OAUTH_WEB_CHANNEL);
    expect(channel?.postMessage).toHaveBeenCalledWith({
      type: 'google-oauth-result',
      url: 'https://kapa.test/oauthredirect?id_token=google-token',
    });
    expect(channel?.close).toHaveBeenCalledTimes(1);
    expect(setTimeoutMock).toHaveBeenCalledWith(expect.any(Function), 250);

    await screen.unmount();
    expect(clearTimeoutMock).toHaveBeenCalledWith(1);
  });

  it('also uses the fallback when Expo throws because window.opener was removed', async () => {
    mockMaybeCompleteAuthSession.mockImplementation(() => {
      throw new Error('ERR_WEB_BROWSER_REDIRECT');
    });

    await render(<OAuthRedirectScreen />);

    await waitFor(() =>
      expect(BroadcastChannelMock.instances[0]?.postMessage).toHaveBeenCalled(),
    );
  });
});
