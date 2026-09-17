import AsyncStorage from '@react-native-async-storage/async-storage';

async function getItem<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);

    if (!raw) return null;

    return JSON.parse(raw) satisfies T;
  } catch (err) {
    console.error('Error on getting item from async storage: ', err);

    // show error toast

    return null;
  }
}

async function setItem<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Error on setting item on async storage: ', err);

    // show error toast
  }
}

export const genericStorage = {
  set: setItem,
  get: getItem,
};
