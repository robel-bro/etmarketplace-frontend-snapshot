import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../lib/axios';

const PromotionPage = () => {
  const { slug } = useParams();
  // Example: fetch promotion details by slug (if you have an endpoint)
  // const { data } = useQuery(['promotion', slug], () => api.get(`/api/v1/promotions/${slug}`).then(res => res.data));
  // For now, just display the slug
  return (
    <div className="px-4 md:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-4">Promotion: {slug}</h1>
      <p>Products in this promotion will be displayed here.</p>
    </div>
  );
};

export default PromotionPage;