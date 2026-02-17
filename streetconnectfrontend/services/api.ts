/**
 * API service – uses storage for auth token so it matches login flow.
 */

import { storage } from './storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000/api/v1';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  const token = await storage.getToken();

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (body && method !== 'GET') options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  if (!res.ok) {
    const err: any = new Error(res.statusText);
    err.status = res.status;
    err.error = await res.json().catch(() => ({}));
    throw err;
  }
  return res.json().catch(() => ({} as T));
}

export const apiService = {
  // Auth
  phoneLogin: (data: any) => request<any>('POST', '/auth/phone-login', data),
  login: (data: { phone: string; firebase_token: string }) =>
    request<any>('POST', '/auth/login', data),
  signup: (data: any) => request<any>('POST', '/auth/signup', data),
  logout: () => request<void>('POST', '/auth/logout'),
  updateLocation: (data: { latitude: number; longitude: number; location_name?: string }) =>
    request<any>('PUT', '/users/profile', data),
  completeOnboarding: () =>
    request<any>('PUT', '/users/profile', { onboarding_completed: true }),
  updateRole: (role: string) =>
    request<any>('PUT', '/users/profile', { role }),
  getAllUsers: (params?: any) =>
    request<{ users: any[] }>('GET', `/users${params ? '?' + new URLSearchParams(params) : ''}`),

  // Dogs
  getNearbyDogs: (params: any) =>
    request<{ dogs: any[] }>('GET', `/dogs/nearby?${new URLSearchParams(params as any)}`),
  getMyDogs: () => request<{ dogs: any[] }>('GET', '/dogs/my-dogs'),
  getDogById: (id: string) => request<{ dog: any }>('GET', `/dogs/${id}`),
  createDog: (data: any) => request<any>('POST', '/dogs', data),
  updateDog: (id: string, data: any) => request<any>('PUT', `/dogs/${id}`, data),
  deleteDog: (id: string) => request<void>('DELETE', `/dogs/${id}`),
  scanQRCode: (qrData: string) => request<any>('POST', '/dogs/scan-qr', { qr_data: qrData }),
  addCaretaker: (dogId: string, caretakerType: string) =>
    request<any>('POST', `/dogs/${dogId}/caretaker`, { caretaker_type: caretakerType }),

  // Chat
  getConversations: () => request<{ conversations: any[] }>('GET', '/chat/conversations'),
  getOrCreateConversation: (receiverId: string) =>
    request<{ conversation_id: string; conversation: any; messages: any[] }>(
      'GET',
      `/chat/conversations/or-create?receiver_id=${encodeURIComponent(receiverId)}`
    ),
  getMessages: (conversationId: string, params?: any) =>
    request<{ messages: any[] }>('GET', `/chat/conversations/${conversationId}/messages?${params ? new URLSearchParams(params) : ''}`),
  sendMessage: (data: any) => request<any>('POST', '/chat/send', data),
  markMessageAsRead: (messageId: string) =>
    request<void>('PUT', `/chat/messages/${messageId}/read`),
  getUnreadMessageCount: () => request<{ unread_count: number }>('GET', '/chat/unread-count'),

  // Upload (Supabase signed URL flow)
  getSignedUploadUrl: (fileType: string, folder: string) =>
    request<any>('POST', '/upload/signed-url', { file_type: fileType, folder }),
  uploadToS3: (uploadUrl: string, blob: Blob) =>
    fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': blob.type } }),

  // Reports
  createReport: (data: any) => request<any>('POST', '/reports', data),
  getReportById: (id: string) => request<{ report: any }>('GET', `/reports/${id}`),
  getNearbyReports: (params: any) =>
    request<{ reports: any[] }>('GET', `/reports/nearby?${new URLSearchParams(params as any)}`),
  getMyReports: (params?: any) =>
    request<{ reports: any[] }>('GET', `/reports/my-reports?${params ? new URLSearchParams(params) : ''}`),
  updateReport: (id: string, data: any) => request<any>('PUT', `/reports/${id}`, data),
  deleteReport: (id: string) => request<void>('DELETE', `/reports/${id}`),

  // Notifications
  getNotifications: (params?: any) =>
    request<{ notifications: any[]; total?: number; unread_count?: number }>(
      'GET',
      `/notifications?${params ? new URLSearchParams(params) : ''}`
    ),
  markNotificationAsRead: (id: string) =>
    request<void>('PUT', `/notifications/${id}/read`),
  markAllNotificationsAsRead: () => request<void>('PUT', '/notifications/mark-all-read'),
  deleteNotification: (id: string) => request<void>('DELETE', `/notifications/${id}`),
  getUnreadNotificationCount: () =>
    request<{ unread_count: number }>('GET', '/notifications/unread-count'),

  // Feed
  logFeed: (data: any) => request<any>('POST', '/feed/log', data),
  getMyFeedLogs: (params?: any) =>
    request<{ feed_logs: any[] }>('GET', `/feed/my-logs?${params ? new URLSearchParams(params) : ''}`),
  getDogFeedHistory: (dogId: string, params?: any) =>
    request<{ feed_logs: any[] }>(
      'GET',
      `/feed/dog/${dogId}?${params ? new URLSearchParams(params) : ''}`
    ),
  getUnfedDogs: () => request<{ unfed_dogs: any[] }>('GET', '/feed/unfed-dogs'),
};
