import * as ExpoLocation from 'expo-location';
import { Location } from '../types';

export const locationService = {
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  },

  async getCurrentLocation(): Promise<Location | null> {
    try {
      const { status } = await ExpoLocation.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          return null;
        }
      }

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    }
  },

  async reverseGeocode(lat: number, lon: number): Promise<string | null> {
    try {
      const results = await ExpoLocation.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });

      if (results && results.length > 0) {
        const result = results[0];
        const parts = [
          result.name,
          result.street,
          result.city,
          result.region,
        ].filter(Boolean);
        return parts.join(', ') || 'Unknown location';
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return 'Unknown location';
    }
  },

  watchPosition(callback: (location: Location) => void): { remove: () => void } {
    let subscription: ExpoLocation.LocationSubscription | null = null;

    ExpoLocation.watchPositionAsync(
      {
        accuracy: ExpoLocation.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    ).then((sub) => {
      subscription = sub;
    });

    return {
      remove: () => {
        if (subscription) {
          subscription.remove();
        }
      },
    };
  },
};
