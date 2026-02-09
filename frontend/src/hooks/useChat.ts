import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Conversation, Message } from '@/types';

export const useChat = () => {
  const queryClient = useQueryClient();

  const useSendMessage = () => {
    return useMutation({
      mutationFn: (data: { receiver_id: string; content: string; image_url?: string }) =>
        apiService.sendMessage(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      },
    });
  };

  const useConversations = () => {
    return useQuery({
      queryKey: ['chat', 'conversations'],
      queryFn: async () => {
        const response: any = await apiService.getConversations();
        return response.conversations as Conversation[];
      },
      refetchInterval: 30000, // Refetch every 30 seconds
    });
  };

  const useMessages = (conversationId: string, params?: { limit?: number; offset?: number }) => {
    return useQuery({
      queryKey: ['chat', 'messages', conversationId, params],
      queryFn: async () => {
        const response: any = await apiService.getMessages(conversationId, params);
        return response.messages as Message[];
      },
      enabled: !!conversationId,
      refetchInterval: 5000, // Refetch every 5 seconds for real-time feel
    });
  };

  const useMarkAsRead = () => {
    return useMutation({
      mutationFn: (messageId: string) => apiService.markMessageAsRead(messageId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['chat'] });
      },
    });
  };

  const useUnreadCount = () => {
    return useQuery({
      queryKey: ['chat', 'unread-count'],
      queryFn: async () => {
        const response: any = await apiService.getUnreadMessageCount();
        return response.unread_count as number;
      },
      refetchInterval: 30000,
    });
  };

  return {
    useSendMessage,
    useConversations,
    useMessages,
    useMarkAsRead,
    useUnreadCount,
  };
};
