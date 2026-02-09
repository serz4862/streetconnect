import { initializeApp } from 'firebase/app';
import {
  getAuth,
} from 'firebase/auth';
import { config } from '@/constants';

const firebaseConfig = config.firebase;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

class FirebaseService {
  async sendOTP(phoneNumber: string): Promise<void> {
    try {
      // For React Native, we'll use Firebase Admin SDK on backend
      // This is a placeholder - actual implementation would use Firebase Phone Auth
      // For now, we'll simulate the flow
      console.log('Sending OTP to:', phoneNumber);
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  async verifyOTP(_verificationId: string, code: string): Promise<string> {
    try {
      // Verify OTP and get Firebase token
      // This is a placeholder - actual implementation would verify the OTP
      console.log('Verifying OTP:', code);
      
      // Return mock token for now
      return 'firebase_token_placeholder';
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  async getIdToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
