import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/api';

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const pickImage = async (options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }): Promise<ImagePicker.ImagePickerAsset | null> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Permission to access media library denied');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        // Use new API – array of MediaType strings to avoid deprecation warning
        mediaTypes: ['images'],
        allowsEditing: options?.allowsEditing ?? true,
        aspect: options?.aspect ?? [4, 3],
        quality: options?.quality ?? 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        return result.assets[0];
      }

      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      throw error;
    }
  };

  const takePhoto = async (options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }): Promise<ImagePicker.ImagePickerAsset | null> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Permission to access camera denied');
      }

      const result = await ImagePicker.launchCameraAsync({
        // Explicitly restrict to images to match picker behaviour
        mediaTypes: ['images'],
        allowsEditing: options?.allowsEditing ?? true,
        aspect: options?.aspect ?? [4, 3],
        quality: options?.quality ?? 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        return result.assets[0];
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  };

  const uploadImage = async (
    imageUri: string,
    folder: 'dogs' | 'reports' | 'feed' | 'chat' | 'qr' | 'avatars'
  ): Promise<string> => {
    setIsUploading(true);
    setProgress(0);

    try {
      // Get file type from URI
      const fileType = imageUri.endsWith('.png') ? 'image/png' : 'image/jpeg';

      // Get signed upload URL
      const uploadData: any = await apiService.getSignedUploadUrl(fileType, folder);
      const { upload_url, file_url } = uploadData;

      // Fetch the image as blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to S3
      await apiService.uploadToS3(upload_url, blob);

      setProgress(100);
      setIsUploading(false);

      return file_url;
    } catch (error) {
      setIsUploading(false);
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  return {
    pickImage,
    takePhoto,
    uploadImage,
    isUploading,
    progress,
  };
};
