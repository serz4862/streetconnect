import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const KEYS = {
  token: '@streetconnect:token',
  user: '@streetconnect:user',
} as const;

export const storage = {
  async setToken(token: string | null): Promise<void> {
    if (token) await AsyncStorage.setItem(KEYS.token, token);
    else await AsyncStorage.removeItem(KEYS.token);
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.token);
  },

  async setUser(user: User | null): Promise<void> {
    if (user) await AsyncStorage.setItem(KEYS.user, JSON.stringify(user));
    else await AsyncStorage.removeItem(KEYS.user);
  },

  async getUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(KEYS.user);
    return raw ? (JSON.parse(raw) as User) : null;
  },

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.token, KEYS.user]);
  },
};
