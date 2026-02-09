import * as ExpoLocation from 'expo-location';
import { Location } from '@/types';

class LocationService {
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  async checkPermission(): Promise<boolean> {
    try {
      const { status } = await ExpoLocation.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<Location | null> {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        return null;
      }

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async geocodeAddress(address: string): Promise<Array<{ latitude: number; longitude: number; name: string }>> {
    try {
      const geocodeAsync = (ExpoLocation as any).geocodeAsync;
      if (typeof geocodeAsync !== 'function') return [];
      const results = await geocodeAsync(address);
      return (results || []).slice(0, 5).map((r: any) => ({
        latitude: r.latitude,
        longitude: r.longitude,
        name: [r.city, r.region, r.country].filter(Boolean).join(', ') || address,
      }));
    } catch (error) {
      console.error('Error geocoding address:', error);
      return [];
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const addresses = await ExpoLocation.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        const parts = [
          address.street,
          address.city,
          address.region,
          address.country,
        ].filter(Boolean);
        return parts.join(', ');
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  watchPosition(callback: (location: Location) => void): { remove: () => void } {
    let subscription: ExpoLocation.LocationSubscription | null = null;

    (async () => {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        return;
      }

      subscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.Balanced,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 50, // 50 meters
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            altitude: location.coords.altitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
          });
        }
      );
    })();

    return {
      remove: () => {
        subscription?.remove();
      },
    };
  }
}

export const locationService = new LocationService();
