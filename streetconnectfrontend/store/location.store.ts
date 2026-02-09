import { create } from 'zustand';
import { Location } from '../types';
import { locationService } from '../services/location';

interface LocationState {
  currentLocation: Location | null;
  locationName: string | null;
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<void>;
  updateLocation: (location: Location) => void;
  watchLocation: () => { remove: () => void };
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  locationName: null,
  hasPermission: false,
  isLoading: false,
  error: null,

  requestPermission: async () => {
    set({ isLoading: true, error: null });
    try {
      const granted = await locationService.requestPermission();
      set({ hasPermission: granted, isLoading: false });
      return granted;
    } catch (error: any) {
      set({
        error: error.message || 'Permission request failed',
        isLoading: false,
      });
      return false;
    }
  },

  getCurrentLocation: async () => {
    set({ isLoading: true, error: null });
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        const locationName = await locationService.reverseGeocode(
          location.latitude,
          location.longitude
        );
        set({
          currentLocation: location,
          locationName,
          isLoading: false,
        });
      } else {
        set({
          error: 'Unable to get location',
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to get location',
        isLoading: false,
      });
    }
  },

  updateLocation: (location) => {
    set({ currentLocation: location });
  },

  watchLocation: () => {
    return locationService.watchPosition((location) => {
      set({ currentLocation: location });
    });
  },
}));
