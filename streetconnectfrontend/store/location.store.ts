import { create } from 'zustand';
import { Location, SavedLocation } from '../types';
import { locationService } from '../services/location';
import { apiService } from '../services/api';

interface LocationState {
  currentLocation: Location | null;
  locationName: string | null;
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  savedLocations: SavedLocation[];
  savedLocationsLoaded: boolean;

  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<void>;
  updateLocation: (location: Location) => void;
  watchLocation: () => { remove: () => void };
  loadSavedLocations: () => Promise<void>;
  saveLocation: (data: { label: string; latitude: number; longitude: number; location_name?: string }) => Promise<void>;
  deleteSavedLocation: (id: string) => Promise<void>;
  setDefaultLocation: (id: string) => Promise<void>;
  useLocation: (loc: SavedLocation) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  locationName: null,
  hasPermission: false,
  isLoading: false,
  error: null,
  savedLocations: [],
  savedLocationsLoaded: false,

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

  loadSavedLocations: async () => {
    try {
      const res: any = await apiService.getSavedLocations();
      set({ savedLocations: res.locations ?? [], savedLocationsLoaded: true });
    } catch {
      set({ savedLocationsLoaded: true });
    }
  },

  saveLocation: async (data) => {
    const res: any = await apiService.saveLocation(data);
    set((s) => ({ savedLocations: [res.location, ...s.savedLocations] }));
  },

  deleteSavedLocation: async (id) => {
    await apiService.deleteSavedLocation(id);
    set((s) => ({ savedLocations: s.savedLocations.filter((l) => l.id !== id) }));
  },

  setDefaultLocation: async (id) => {
    await apiService.setDefaultLocation(id);
    set((s) => ({
      savedLocations: s.savedLocations.map((l) => ({ ...l, is_default: l.id === id })),
    }));
  },

  useLocation: (loc) => {
    set({
      currentLocation: { latitude: loc.latitude, longitude: loc.longitude },
      locationName: loc.location_name ?? loc.label,
    });
  },
}));
