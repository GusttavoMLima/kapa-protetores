import type * as AuthSession from 'expo-auth-session';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

const mockHandleGoogleLogin = jest.fn<Promise<void>, [string]>();
const mockPromptAsync = jest.fn();
const mockParseReturnUrl = jest.fn();
const mockUseIdTokenAuthRequest = jest.fn();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ handleGoogleLogin: mockHandleGoogleLogin }),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'https://kapa.test/oauthredirect'),
}));

jest.mock('expo-auth-session/providers/google', () => ({
  useIdTokenAuthRequest: (...args: unknown[]) =>
    mockUseIdTokenAuthRequest(...args),
}));

type MessageListener = (event: MessageEvent<unknown>) => void;

class BroadcastChannelMock {
  static instances: BroadcastChannelMock[] = [];

  listener?: MessageListener;
  close = jest.fn();

  constructor(readonly name: string) {
    BroadcastChannelMock.instances.push(this);
  }

  addEventListener(_type: string, listener: MessageListener) {
    this.listener = listener;
  }

  emit(data: unknown) {
    this.listener?.({ data } as MessageEvent<unknown>);
  }
}

const successResponse = (token: string): AuthSession.AuthSessionResult => ({
  type: 'success',
  errorCode: null,
  params: { id_token: token },
  authentication: null,
  url: 'https://kapa.test/oauthredirect',
});

describe('useGoogleAuth', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });
    BroadcastChannelMock.instances = [];
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      configurable: true,
      value: BroadcastChannelMock,
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { origin: 'https://kapa.test' } },
    });
    mockHandleGoogleLogin.mockResolvedValue(undefined);
    mockParseReturnUrl.mockReset();
    mockPromptAsync.mockResolvedValue(undefined);
    mockUseIdTokenAuthRequest.mockReturnValue([
      { parseReturnUrl: mockParseReturnUrl },
      null,
      mockPromptAsync,
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends a successful provider response to the backend once', async () => {
    mockUseIdTokenAuthRequest.mockReturnValue([
      { parseReturnUrl: mockParseReturnUrl },
      successResponse('google-token'),
      mockPromptAsync,
    ]);

    const { rerender } = await renderHook(() => useGoogleAuth());

    await waitFor(() =>
      expect(mockHandleGoogleLogin).toHaveBeenCalledWith('google-token'),
    );
    await rerender({});
    expect(mockHandleGoogleLogin).toHaveBeenCalledTimes(1);
  });

  it('accepts a validated callback received through BroadcastChannel', async () => {
    mockParseReturnUrl.mockReturnValue(successResponse('fallback-token'));
    await renderHook(() => useGoogleAuth());

    await act(() => {
      BroadcastChannelMock.instances[0]?.emit({
        type: 'google-oauth-result',
        url: 'https://kapa.test/oauthredirect?id_token=fallback-token',
      });
    });

    await waitFor(() =>
      expect(mockHandleGoogleLogin).toHaveBeenCalledWith('fallback-token'),
    );
  });

  it.each([
    ['invalid URL', 'not a URL', 'URL de autenticação inválida'],
    [
      'foreign origin',
      'https://attacker.example/oauthredirect?id_token=stolen',
      'origem de autenticação inválida',
    ],
    [
      'wrong path',
      'https://kapa.test/other?id_token=stolen',
      'origem de autenticação inválida',
    ],
  ])('rejects a callback with %s', async (_case, url, expectedError) => {
    const { result } = await renderHook(() => useGoogleAuth());

    await act(() => {
      BroadcastChannelMock.instances[0]?.emit({
        type: 'google-oauth-result',
        url,
      });
    });

    await waitFor(() =>
      expect(result.current.googleErrorMessage).toContain(expectedError),
    );
    expect(mockParseReturnUrl).not.toHaveBeenCalled();
    expect(mockHandleGoogleLogin).not.toHaveBeenCalled();
  });

  it('rejects a callback that fails OAuth state validation', async () => {
    mockParseReturnUrl.mockReturnValue({ type: 'error' });
    const { result } = await renderHook(() => useGoogleAuth());

    await act(() => {
      BroadcastChannelMock.instances[0]?.emit({
        type: 'google-oauth-result',
        url: 'https://kapa.test/oauthredirect?state=invalid',
      });
    });

    await waitFor(() =>
      expect(result.current.googleErrorMessage).toContain(
        'validação de segurança',
      ),
    );
    expect(mockHandleGoogleLogin).not.toHaveBeenCalled();
  });

  it('shows the API error returned after Google authentication', async () => {
    mockHandleGoogleLogin.mockRejectedValue({
      response: { data: { message: 'Conta não autorizada.' } },
    });
    mockUseIdTokenAuthRequest.mockReturnValue([
      { parseReturnUrl: mockParseReturnUrl },
      successResponse('rejected-token'),
      mockPromptAsync,
    ]);
    const { result } = await renderHook(() => useGoogleAuth());

    await waitFor(() =>
      expect(result.current.googleErrorMessage).toBe('Conta não autorizada.'),
    );
  });

  it('reports that Google is not configured without a client ID', async () => {
    const { result } = await renderHook(() => useGoogleAuth());

    await act(async () => result.current.signInWithGoogle());

    expect(result.current.googleErrorMessage).toContain('não está configurado');
    expect(mockPromptAsync).not.toHaveBeenCalled();
  });

  it('closes the BroadcastChannel when the hook unmounts', async () => {
    const { unmount } = await renderHook(() => useGoogleAuth());
    const channel = BroadcastChannelMock.instances[0];

    await unmount();

    expect(channel?.close).toHaveBeenCalledTimes(1);
  });
});
