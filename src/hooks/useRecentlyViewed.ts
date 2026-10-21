import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../lib/axios';

export const useRecentlyViewed = () => {
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery(
    'recentlyViewed',
    () => api.get('/recently_viewed').then(res => res.data),
    { staleTime: 5 * 60 * 1000 }
  );

  const { mutate: addToRecentlyViewed } = useMutation(
    (product: any) => api.post('/recently_viewed', { product_id: product.id }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('recentlyViewed');
      },
    }
  );

  return { products: products || [], loading: isLoading, addToRecentlyViewed };
};