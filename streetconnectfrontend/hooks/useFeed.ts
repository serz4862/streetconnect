import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { FeedLog } from '../types';

export const useFeed = () => {
  const queryClient = useQueryClient();

  const useLogFeed = () => {
    return useMutation({
      mutationFn: (data: any) => apiService.logFeed(data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['feed', 'dog', variables.dog_id] });
        queryClient.invalidateQueries({ queryKey: ['feed', 'my-logs'] });
        queryClient.invalidateQueries({ queryKey: ['dogs', variables.dog_id] });
        queryClient.invalidateQueries({ queryKey: ['feed', 'unfed'] });
      },
    });
  };

  const useMyFeedLogs = (params?: { limit?: number; offset?: number }) => {
    return useQuery({
      queryKey: ['feed', 'my-logs', params],
      queryFn: async () => {
        const response: any = await apiService.getMyFeedLogs(params);
        return response.feed_logs as FeedLog[];
      },
    });
  };

  const useDogFeedHistory = (dogId: string, params?: { limit?: number; offset?: number }) => {
    return useQuery({
      queryKey: ['feed', 'dog', dogId, params],
      queryFn: async () => {
        const response: any = await apiService.getDogFeedHistory(dogId, params);
        return response.feed_logs as FeedLog[];
      },
      enabled: !!dogId,
    });
  };

  const useUnfedDogs = () => {
    return useQuery({
      queryKey: ['feed', 'unfed'],
      queryFn: async () => {
        const response: any = await apiService.getUnfedDogs();
        return response.unfed_dogs;
      },
      refetchInterval: 300000, // Refetch every 5 minutes
    });
  };

  return {
    useLogFeed,
    useMyFeedLogs,
    useDogFeedHistory,
    useUnfedDogs,
  };
};
