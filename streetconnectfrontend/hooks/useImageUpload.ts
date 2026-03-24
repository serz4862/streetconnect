import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { storage } from '../services/storage';
import Constants from 'expo-constants';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://localhost:3000/api/v1';

/**
 * Upload a local image URI directly to the backend via multipart/form-data.
 * The backend then uploads to Supabase, bypassing ISP DNS issues with direct
 * Supabase storage connections from the device.
 */
async function uploadToBackend(
  imageUri: string,
  folder: string,
  fileType: string,
): Promise<string> {
  const token = await storage.getToken();

  // Build multipart FormData — React Native's FormData accepts a file-like object
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: fileType,
    name: `upload.${fileType.split('/')[1] || 'jpg'}`,
  } as unknown as Blob);
  formData.append('folder', folder);

  const response = await fetch(`${BASE_URL}/upload/from-device`, {
    method: 'POST',
    headers: {
      // Do NOT set Content-Type manually — fetch sets it with boundary for FormData
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error((errBody as any)?.error?.error || (errBody as any)?.message || `Upload failed: ${response.status}`);
  }

  const data = await response.json();
  return data.file_url as string;
}

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const pickImage = async (options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }): Promise<ImagePicker.ImagePickerAsset | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') throw new Error('Permission to access media library denied');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: options?.allowsEditing ?? true,
      aspect: options?.aspect ?? [4, 3],
      quality: options?.quality ?? 0.8,
    });

    return result.canceled || result.assets.length === 0 ? null : result.assets[0];
  };

  const takePhoto = async (options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }): Promise<ImagePicker.ImagePickerAsset | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') throw new Error('Permission to access camera denied');

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: options?.allowsEditing ?? true,
      aspect: options?.aspect ?? [4, 3],
      quality: options?.quality ?? 0.8,
    });

    return result.canceled || result.assets.length === 0 ? null : result.assets[0];
  };

  const uploadImage = async (
    imageUri: string,
    folder: 'dogs' | 'reports' | 'feed' | 'chat' | 'qr' | 'avatars',
  ): Promise<string> => {
    setIsUploading(true);
    setProgress(10);
    try {
      const fileType = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      const url = await uploadToBackend(imageUri, folder, fileType);
      setProgress(100);
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { pickImage, takePhoto, uploadImage, isUploading, progress };
};
