import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Dog } from '../types';

export const useDogs = () => {
  const queryClient = useQueryClient();

  const useNearbyDogs = (params: {
    latitude: number;
    longitude: number;
    radius: number;
    gender?: string;
    color?: string;
    is_sterilized?: boolean;
  }) => {
    return useQuery({
      queryKey: ['dogs', 'nearby', params],
      queryFn: async () => {
        const response: any = await apiService.getNearbyDogs(params);
        return response.dogs as Dog[];
      },
      staleTime: 60000, // 1 minute
      enabled: !!params.latitude && !!params.longitude,
    });
  };

  const useMyDogs = () => {
    return useQuery({
      queryKey: ['dogs', 'my-dogs'],
      queryFn: async () => {
        const response: any = await apiService.getMyDogs();
        return response.dogs as Dog[];
      },
      staleTime: 300000, // 5 minutes
    });
  };

  const useDog = (id: string) => {
    return useQuery({
      queryKey: ['dogs', id],
      queryFn: async () => {
        const response: any = await apiService.getDogById(id);
        return response.dog as Dog;
      },
      enabled: !!id,
    });
  };

  const useCreateDog = () => {
    return useMutation({
      mutationFn: (data: any) => apiService.createDog(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['dogs'] });
      },
    });
  };

  const useUpdateDog = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: any }) => apiService.updateDog(id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['dogs', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['dogs', 'nearby'] });
        queryClient.invalidateQueries({ queryKey: ['dogs', 'my-dogs'] });
      },
    });
  };

  const useDeleteDog = () => {
    return useMutation({
      mutationFn: (id: string) => apiService.deleteDog(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['dogs'] });
      },
    });
  };

  const useScanQR = () => {
    return useMutation({
      mutationFn: (qrData: string) => apiService.scanQRCode(qrData),
    });
  };

  const useAddCaretaker = () => {
    return useMutation({
      mutationFn: ({ dogId, caretakerType }: { dogId: string; caretakerType: string }) =>
        apiService.addCaretaker(dogId, caretakerType),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['dogs', variables.dogId] });
        queryClient.invalidateQueries({ queryKey: ['dogs', 'my-dogs'] });
      },
    });
  };

  return {
    useNearbyDogs,
    useMyDogs,
    useDog,
    useCreateDog,
    useUpdateDog,
    useDeleteDog,
    useScanQR,
    useAddCaretaker,
  };
};
