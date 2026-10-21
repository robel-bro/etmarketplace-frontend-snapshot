import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/axios';

const ReturnRequestsPage = () => {
  const queryClient = useQueryClient();
  const { data: returns, isLoading } = useQuery('returnRequests', () =>
    api.get('/return_requests').then(res => res.data)
  );

  const updateMutation = useMutation(
    ({ id, status }: { id: number; status: string }) =>
      api.patch(`/return_requests/${id}`, { return_request: { status } }),
    {
      onSuccess: () => queryClient.invalidateQueries('returnRequests'),
    }
  );

  const handleApprove = (id: number) => updateMutation.mutate({ id, status: 'approved' });
  const handleReject = (id: number) => updateMutation.mutate({ id, status: 'rejected' });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Return Requests</h1>
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50/50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {returns?.map((r: any) => (
              <tr key={r.id} className="hover:bg-white/50">
                <td className="px-6 py-4 text-sm">{r.order_id}</td>
                <td className="px-6 py-4 text-sm">{r.reason}</td>
                <td className="px-6 py-4 text-sm">{r.details}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    r.status === 'approved' ? 'bg-green-100 text-green-700' :
                    r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(r.id)} className="text-green-600 hover:text-green-700">Approve</button>
                      <button onClick={() => handleReject(r.id)} className="text-red-600 hover:text-red-700">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReturnRequestsPage;