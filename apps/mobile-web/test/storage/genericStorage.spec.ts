import AsyncStorage from '@react-native-async-storage/async-storage';
import { genericStorage } from '../../src/storage/genericStorage';

describe('genericStorage with AsyncStorage Mock', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('should store and retrieve data correctly', async () => {
    const user = { id: 'u1', name: 'John Doe', email: 'john@example.com' };

    await genericStorage.set('@test:user', user);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@test:user',
      JSON.stringify(user),
    );

    const retrieved = await genericStorage.get<typeof user>('@test:user');
    expect(retrieved).toEqual(user);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@test:user');
  });

  it('should return null when key does not exist', async () => {
    const retrieved = await genericStorage.get<string>('@test:non_existent');
    expect(retrieved).toBeNull();
  });

  it('should remove item from storage', async () => {
    await genericStorage.set('@test:temp', 'value');
    expect(await genericStorage.get<string>('@test:temp')).toBe('value');

    await genericStorage.remove('@test:temp');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@test:temp');

    expect(await genericStorage.get<string>('@test:temp')).toBeNull();
  });

  it('should handle JSON parse errors gracefully and return null', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await AsyncStorage.setItem('@test:corrupt', 'invalid{json');

    const result = await genericStorage.get('@test:corrupt');
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should store arrays and boolean values', async () => {
    const permissions = ['user:read', 'user:write'];
    await genericStorage.set('@test:permissions', permissions);
    expect(await genericStorage.get<string[]>('@test:permissions')).toEqual(permissions);

    await genericStorage.set('@test:flag', true);
    expect(await genericStorage.get<boolean>('@test:flag')).toBe(true);
  });
});
