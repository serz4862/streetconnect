import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@streetconnect:token',
  USER: '@streetconnect:user',
  ONBOARDING_COMPLETE: '@streetconnect:onboarding_complete',
  LOCATION_PERMISSION: '@streetconnect:location_permission',
};

class StorageService {
  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  }

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.TOKEN);
  }

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.TOKEN);
  }

  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  }

  async getUser(): Promise<any | null> {
    const user = await AsyncStorage.getItem(KEYS.USER);
    return user ? JSON.parse(user) : null;
  }

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER);
  }

  async setOnboardingComplete(complete: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, JSON.stringify(complete));
  }

  async getOnboardingComplete(): Promise<boolean> {
    const complete = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
    return complete ? JSON.parse(complete) : false;
  }

  async setLocationPermission(granted: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.LOCATION_PERMISSION, JSON.stringify(granted));
  }

  async getLocationPermission(): Promise<boolean> {
    const granted = await AsyncStorage.getItem(KEYS.LOCATION_PERMISSION);
    return granted ? JSON.parse(granted) : false;
  }

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER]);
  }
}

export const storage = new StorageService();
