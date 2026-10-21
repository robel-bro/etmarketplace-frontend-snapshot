import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../lib/axios';

const PriceAlertsPage = () => {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery('priceAlerts', () =>
    api.get('/price_alerts').then(res => res.data)
  );

  const deleteAlert = useMutation(
    (id: number) => api.delete(`/price_alerts/${id}`),
    { onSuccess: () => queryClient.invalidateQueries('priceAlerts') }
  );

  if (isLoading) {
    return (
      <div className="text-center py-6 text-text-muted text-xs">Loading alerts…</div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link to="/profile" className="text-text-muted hover:text-text-primary">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h2 className="text-lg font-semibold text-text-primary">My Price Alerts</h2>
      </div>

      {!alerts || alerts.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-text-secondary">No active price alerts.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert: any) => (
            <div key={alert.id} className="card-product flex items-center gap-3 p-3">
              <img
                src={alert.product?.image_urls?.[0] || '/placeholder.jpg'}
                alt={alert.product?.title}
                className="w-10 h-10 rounded object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {alert.product?.title}
                </p>
                <p className="text-xs text-text-muted">
                  Target: ETB {alert.target_price} · Current: ETB {alert.product?.price}
                </p>
              </div>
              <button
                onClick={() => deleteAlert.mutate(alert.id)}
                className="text-text-muted hover:text-red-500 p-1"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PriceAlertsPage;