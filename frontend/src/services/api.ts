import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '@/constants';
import { storage } from './storage';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: config.apiUrl,
      timeout: config.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        const token = await storage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, logout user
          await storage.removeToken();
          // You could also navigate to login here if needed
        }
        return Promise.reject(error.response?.data || error.message);
      }
    );
  }

  // Auth endpoints
  async phoneLogin(data: { phone: string; country_code: string; otp: string; name?: string; pincode?: string }) {
    return this.api.post('/auth/phone-login', data);
  }

  async signup(data: any) {
    return this.api.post('/auth/signup', data);
  }

  async login(data: any) {
    return this.api.post('/auth/login', data);
  }

  async logout() {
    return this.api.post('/auth/logout');
  }

  // User endpoints
  async getProfile() {
    return this.api.get('/users/profile');
  }

  async updateProfile(data: any) {
    return this.api.put('/users/profile', data);
  }

  async updateRole(role: string) {
    return this.api.put('/users/role', { role });
  }

  async updateLocation(data: { latitude: number; longitude: number; location_name?: string }) {
    return this.api.put('/users/location', data);
  }

  async completeOnboarding() {
    return this.api.post('/users/complete-onboarding');
  }

  async getUserById(id: string) {
    return this.api.get(`/users/${id}`);
  }

  async getNearbyUsers(radius: number) {
    return this.api.get('/users/nearby', { params: { radius } });
  }

  // Dog endpoints
  async createDog(data: any) {
    return this.api.post('/dogs', data);
  }

  async getDogById(id: string) {
    return this.api.get(`/dogs/${id}`);
  }

  async updateDog(id: string, data: any) {
    return this.api.put(`/dogs/${id}`, data);
  }

  async deleteDog(id: string) {
    return this.api.delete(`/dogs/${id}`);
  }

  async getNearbyDogs(params: {
    latitude: number;
    longitude: number;
    radius: number;
    gender?: string;
    color?: string;
    is_sterilized?: boolean;
  }) {
    return this.api.get('/dogs/nearby', { params });
  }

  async getMyDogs() {
    return this.api.get('/dogs/my-dogs');
  }

  async scanQRCode(qrData: string) {
    return this.api.post('/dogs/scan-qr', { qr_data: qrData });
  }

  async addCaretaker(dogId: string, caretakerType: string) {
    return this.api.post(`/dogs/${dogId}/caretaker`, { caretaker_type: caretakerType });
  }

  async generateDogReport(dogId: string) {
    return this.api.get(`/dogs/${dogId}/report`);
  }

  // Feed endpoints
  async logFeed(data: any) {
    return this.api.post('/feed/log', data);
  }

  async getMyFeedLogs(params?: { limit?: number; offset?: number }) {
    return this.api.get('/feed/my-logs', { params });
  }

  async getDogFeedHistory(dogId: string, params?: { limit?: number; offset?: number }) {
    return this.api.get(`/feed/dog/${dogId}`, { params });
  }

  async getUnfedDogs() {
    return this.api.get('/feed/unfed-dogs');
  }

  // Report endpoints
  async createReport(data: any) {
    return this.api.post('/reports', data);
  }

  async getReportById(id: string) {
    return this.api.get(`/reports/${id}`);
  }

  async updateReport(id: string, data: any) {
    return this.api.put(`/reports/${id}`, data);
  }

  async deleteReport(id: string) {
    return this.api.delete(`/reports/${id}`);
  }

  async getNearbyReports(params: {
    latitude: number;
    longitude: number;
    radius: number;
    type?: string;
    status?: string;
  }) {
    return this.api.get('/reports/nearby', { params });
  }

  async getMyReports(params?: { limit?: number; offset?: number }) {
    return this.api.get('/reports/my-reports', { params });
  }

  async getDogReports(dogId: string, params?: { limit?: number; offset?: number }) {
    return this.api.get(`/reports/dog/${dogId}`, { params });
  }

  // Chat endpoints
  async sendMessage(data: { receiver_id: string; content: string; image_url?: string }) {
    return this.api.post('/chat/send', data);
  }

  async getConversations() {
    return this.api.get('/chat/conversations');
  }

  async getMessages(conversationId: string, params?: { limit?: number; offset?: number }) {
    return this.api.get(`/chat/conversations/${conversationId}/messages`, { params });
  }

  async markMessageAsRead(messageId: string) {
    return this.api.put(`/chat/messages/${messageId}/read`);
  }

  async sendTypingIndicator(conversationId: string, isTyping: boolean) {
    return this.api.post(`/chat/conversations/${conversationId}/typing`, { is_typing: isTyping });
  }

  async getUnreadMessageCount() {
    return this.api.get('/chat/unread-count');
  }

  // Notification endpoints
  async getNotifications(params?: { limit?: number; offset?: number; unread_only?: boolean }) {
    return this.api.get('/notifications', { params });
  }

  async markNotificationAsRead(id: string) {
    return this.api.put(`/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead() {
    return this.api.put('/notifications/mark-all-read');
  }

  async deleteNotification(id: string) {
    return this.api.delete(`/notifications/${id}`);
  }

  async getUnreadNotificationCount() {
    return this.api.get('/notifications/unread-count');
  }

  // Upload endpoints
  async getSignedUploadUrl(fileType: string, folder: string) {
    return this.api.post('/upload/signed-url', { file_type: fileType, folder });
  }

  async uploadToS3(uploadUrl: string, file: Blob | File) {
    return axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  }
}

export const apiService = new ApiService();
