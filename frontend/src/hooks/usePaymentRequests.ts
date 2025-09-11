import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentRequestService } from '../services/paymentRequestService';
import { PaymentRequest, PaymentRequestCreate, PaymentRequestUpdate } from '../types';

// Query keys
export const paymentRequestKeys = {
  all: ['paymentRequests'] as const,
  lists: () => [...paymentRequestKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...paymentRequestKeys.lists(), filters] as const,
  details: () => [...paymentRequestKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentRequestKeys.details(), id] as const,
};

// Hooks for fetching payment requests
export const usePaymentRequests = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: paymentRequestKeys.list(filters || {}),
    queryFn: () => PaymentRequestService.list(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const usePaymentRequest = (id: string) => {
  return useQuery({
    queryKey: paymentRequestKeys.detail(id),
    queryFn: () => PaymentRequestService.getById(id),
    enabled: !!id,
  });
};

// Hooks for mutations
export const useCreatePaymentRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: PaymentRequestCreate) => PaymentRequestService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentRequestKeys.lists() });
    },
  });
};

export const useUpdatePaymentRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentRequestUpdate }) => 
      PaymentRequestService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: paymentRequestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: paymentRequestKeys.lists() });
    },
  });
};

export const useDeletePaymentRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => PaymentRequestService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentRequestKeys.lists() });
    },
  });
};

export const useClassifyPaymentRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, splits, comment }: { id: string; splits: any[]; comment?: string }) => 
      PaymentRequestService.classify(id, splits, comment),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: paymentRequestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: paymentRequestKeys.lists() });
    },
  });
};
