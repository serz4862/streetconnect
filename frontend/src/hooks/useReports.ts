import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Report } from '@/types';

export const useReports = () => {
  const queryClient = useQueryClient();

  const useCreateReport = () => {
    return useMutation({
      mutationFn: (data: any) => apiService.createReport(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['reports'] });
      },
    });
  };

  const useReport = (id: string) => {
    return useQuery({
      queryKey: ['reports', id],
      queryFn: async () => {
        const response: any = await apiService.getReportById(id);
        return response.report as Report;
      },
      enabled: !!id,
    });
  };

  const useNearbyReports = (params: {
    latitude: number;
    longitude: number;
    radius: number;
    type?: string;
    status?: string;
  }) => {
    return useQuery({
      queryKey: ['reports', 'nearby', params],
      queryFn: async () => {
        const response: any = await apiService.getNearbyReports(params);
        return response.reports as Report[];
      },
      enabled: !!params.latitude && !!params.longitude,
    });
  };

  const useMyReports = (params?: { limit?: number; offset?: number }) => {
    return useQuery({
      queryKey: ['reports', 'my-reports', params],
      queryFn: async () => {
        const response: any = await apiService.getMyReports(params);
        return response.reports as Report[];
      },
    });
  };

  const useUpdateReport = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: any }) => apiService.updateReport(id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['reports', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['reports'] });
      },
    });
  };

  const useDeleteReport = () => {
    return useMutation({
      mutationFn: (id: string) => apiService.deleteReport(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['reports'] });
      },
    });
  };

  return {
    useCreateReport,
    useReport,
    useNearbyReports,
    useMyReports,
    useUpdateReport,
    useDeleteReport,
  };
};
