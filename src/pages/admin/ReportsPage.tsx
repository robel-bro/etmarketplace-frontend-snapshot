import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/axios';

const ReportsPage = () => {
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery('adminReports', () =>
    api.get('/admin/reports').then(res => res.data)
  );

  const updateStatus = useMutation(
    ({ id, status }: { id: number; status: string }) =>
      api.patch(`/admin/reports/${id}`, { status }),
    { onSuccess: () => queryClient.invalidateQueries('adminReports') }
  );

  if (isLoading) return <div className="text-center py-10 text-text-muted text-sm">Loading reports…</div>;

  return (
    <div className="space-y-3">
      <h1 className="text-product-title font-semibold text-text-primary">Reports</h1>

      <div className="card-product overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-hover border-b border-border-light">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Product</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Reported By</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Reason</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Status</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-text-muted uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {reports?.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-text-muted">
                  No reports yet.
                </td>
              </tr>
            ) : (
              reports?.map((r: any) => (
                <tr key={r.id} className="hover:bg-surface-hover transition">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">
                    {r.product?.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {r.user?.full_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{r.reason}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        r.status === 'resolved'
                          ? 'bg-green-100 text-green-700'
                          : r.status === 'reviewed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {r.status === 'pending' && (
                        <>
                          <button
                            onClick={() =>
                              updateStatus.mutate({ id: r.id, status: 'reviewed' })
                            }
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            Mark Reviewed
                          </button>
                          <button
                            onClick={() =>
                              updateStatus.mutate({ id: r.id, status: 'resolved' })
                            }
                            className="text-xs font-medium text-green-600 hover:text-green-700"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                      {r.status === 'reviewed' && (
                        <button
                          onClick={() =>
                            updateStatus.mutate({ id: r.id, status: 'resolved' })
                          }
                          className="text-xs font-medium text-green-600 hover:text-green-700"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsPage;