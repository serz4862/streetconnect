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

  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number; name: string }[]> {
    try {
      const results = await ExpoLocation.geocodeAsync(address);
      const named = await Promise.all(
        results.slice(0, 5).map(async (r) => {
          const rev = await ExpoLocation.reverseGeocodeAsync({ latitude: r.latitude, longitude: r.longitude });
          const parts = [rev[0]?.name, rev[0]?.street, rev[0]?.city].filter(Boolean);
          return { latitude: r.latitude, longitude: r.longitude, name: parts.join(', ') || address };
        })
      );
      return named;
    } catch {
      return [];
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
