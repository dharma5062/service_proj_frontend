import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceReopenApi } from '@/pages/serviceAPI/ServiceReopenAPI';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/table/datatable';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/AuthContext';

export const ReopenRequestsTab = ({ onSwitchBack }: { onSwitchBack?: () => void }) => {
    const navigate = useNavigate();
    const { isShopOwner, isSuperAdmin } = useAuth();
    const canApprove = isShopOwner || isSuperAdmin;
    const { useGetReopenRequests, useApproveReopenRequest, useRejectReopenRequest } = useServiceReopenApi();
    const { data: requestsData, isLoading, refetch } = useGetReopenRequests();
    const requests = requestsData?.data || [];

    const approveMutation = useApproveReopenRequest();
    const rejectMutation = useRejectReopenRequest();

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [shopOwnerNote, setShopOwnerNote] = useState('');

    const handleView = (record: any) => {
        setSelectedRequest(record);
        setShopOwnerNote('');
        setViewModalOpen(true);
    };

    const handleApprove = async (id: number) => {
        try {
            const res = await approveMutation.mutateAsync({ id, note: shopOwnerNote });
            if (res.status) {
                toast.success('Reopen request approved.');
                refetch();
                setViewModalOpen(false);
            } else {
                toast.error(res.message || 'Failed to approve.');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error approving request.');
        }
    };

    const handleReject = async (id: number) => {
        if (!shopOwnerNote.trim()) {
            toast.error('A note is required to reject the request.');
            return;
        }
        try {
            const res = await rejectMutation.mutateAsync({ id, note: shopOwnerNote });
            if (res.status) {
                toast.success('Reopen request rejected.');
                refetch();
                setViewModalOpen(false);
            } else {
                toast.error(res.message || 'Failed to reject.');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error rejecting request.');
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'reopen_number',
            title: 'Cycle #',
            dataIndex: 'reopen_number',
            render: (val) => <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">#{val}</span>
        },
        {
            key: 'service_id',
            title: 'Service Ref',
            dataIndex: 'service_id',
            render: (val) => <span className="font-semibold text-gray-900 text-[11px]">SR#{val}</span>
        },
        {
            key: 'customer',
            title: 'Customer Info',
            dataIndex: 'customer',
            render: (val) => (
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-900">{val?.name || '-'}</span>
                    <span className="text-[9px] text-gray-500">{val?.phone || val?.mobile || '-'}</span>
                </div>
            )
        },
        {
            key: 'technician',
            title: 'Technician',
            dataIndex: 'service',
            render: (service) => {
                const tech = service?.assigned_technician || service?.assignedTechnician;
                if (!tech) return <span className="text-xs text-gray-400 italic">Unassigned</span>;
                return (
                    <div className="flex flex-col">
                        <span className="text-[11px] text-gray-900 font-bold">{tech.name}</span>
                        <span className="text-[9px] text-gray-500">{tech.phone || '-'}</span>
                    </div>
                );
            }
        },
        {
            key: 'issue',
            title: 'Issue / Reason',
            dataIndex: 'reason',
            render: (val, record) => (
                <div className="flex flex-col">
                    {record.issue_type && <span className="text-[11px] font-bold text-gray-900 capitalize">{record.issue_type}</span>}
                    <span className="text-[10px] text-gray-600 truncate max-w-[160px] block" title={val}>{val}</span>
                </div>
            )
        },
        {
            key: 'status',
            title: 'Status',
            dataIndex: 'status',
            render: (val, record) => {
                const isReworkInvoicePaid = (record.newInvoice?.status === 'paid') || ((record as any).new_invoice?.status === 'paid');
                const isCompleted = val === 'approved' && isReworkInvoicePaid;
                const displayVal = isCompleted ? 'completed' : val;
                const styles: Record<string, string> = {
                    pending: 'bg-amber-100 text-amber-700 border-amber-200',
                    approved: 'bg-green-50 text-green-700 border-green-200',
                    completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    rejected: 'bg-red-100 text-red-700 border-red-200',
                };
                const style = styles[displayVal] || 'bg-gray-100 text-gray-700';
                return <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${style}`}>{displayVal}</span>;
            }
        },
        {
            key: 'created_at',
            title: 'Requested On',
            dataIndex: 'created_at',
            render: (val) => <span className="text-xs text-gray-500">{new Date(val).toLocaleDateString()}</span>
        },
        {
            key: 'actions',
            title: 'Actions',
            dataIndex: 'id',
            align: 'center',
            render: (_, record) => (
                <div className="flex items-center gap-1.5 justify-center">
                    <Button size="icon" variant="ghost" onClick={() => handleView(record)} className="w-6 h-6 rounded-full hover:bg-blue-50" title="View Details">
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => navigate(`/dashboard/services/view/${record.service_id}`)} className="w-6 h-6 rounded-full hover:bg-gray-100" title="View Service">
                        <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="w-full relative">
            <DataTable
                title={
                    <div className="flex gap-4 items-center">
                        {onSwitchBack && (
                            <button
                                className="text-sm font-bold text-muted-foreground hover:text-foreground px-1 pb-1 transition-colors"
                                onClick={onSwitchBack}
                            >
                                Active Service Requests
                            </button>
                        )}
                        <button className="text-sm font-bold border-b-2 border-primary text-primary px-1 pb-1">Reopen Requests</button>
                    </div>
                }
                columns={columns}
                data={requests}
                loading={isLoading}
                showActions={false}
                searchable={true}
                searchKey="reason"
                density="compact"
                bordered
                hoverable
            />

            <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent className="sm:max-w-[550px] p-3">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold">Reopen Request Details</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Review the customer's reported issue and approve or reject the request.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-3 py-1">
                            <div className="bg-gray-50 border rounded-md p-2.5 grid grid-cols-3 gap-y-2.5 gap-x-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-semibold text-gray-500 capitalize tracking-wider">Service Ref</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-gray-900">SR#{selectedRequest.service_id}</span>
                                        <button
                                            className="flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                            onClick={() => { setViewModalOpen(false); navigate(`/dashboard/services/view/${selectedRequest.service_id}`); }}
                                        >
                                            <ExternalLink className="w-3 h-3" /> View
                                        </button>
                                    </div>
                                </div>
                                {selectedRequest.customer?.name && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-semibold text-gray-500 capitalize tracking-wider">Customer</span>
                                        <span className="text-xs font-bold text-gray-900 truncate" title={selectedRequest.customer.name}>
                                            {selectedRequest.customer.name}
                                        </span>
                                    </div>
                                )}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-semibold text-gray-500 capitalize tracking-wider">Reopen Cycle</span>
                                    <span className="text-xs font-bold text-gray-900">#{selectedRequest.reopen_number}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-semibold text-gray-500 capitalize tracking-wider">Requested On</span>
                                    <span className="text-xs font-bold text-gray-900 truncate">
                                        {new Date(selectedRequest.created_at).toLocaleDateString()} {new Date(selectedRequest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-semibold text-gray-500 capitalize tracking-wider">Issue Type</span>
                                    <span className="text-xs font-bold text-gray-900 truncate" title={selectedRequest.issue_type || '-'}>{selectedRequest.issue_type || '-'}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-semibold text-gray-500 capitalize tracking-wider">Status</span>
                                    <span className="text-xs font-bold text-yellow-600 capitalize">{selectedRequest.status}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-semibold text-gray-700 capitalize tracking-wider">Reported Issue</h4>
                                    <p className="text-xs text-gray-800 bg-gray-50 border rounded p-2 whitespace-pre-wrap leading-relaxed min-h-[46px]">
                                        {selectedRequest.reason}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-semibold text-gray-700 capitalize tracking-wider">Evidence / Images</h4>
                                    {selectedRequest.images && selectedRequest.images.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 pt-0.5">
                                            {selectedRequest.images.map((url: string, i: number) => (
                                                <a key={i} href={url} target="_blank" rel="noreferrer" className="relative w-10 h-10 border border-gray-200 rounded shadow-sm overflow-hidden group hover:border-blue-300 transition-colors">
                                                    <img src={url} alt="Evidence" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-gray-400 italic py-1">No images</div>
                                    )}
                                </div>

                                {selectedRequest.shop_owner_note && selectedRequest.status !== 'pending' && (
                                    <div className="space-y-1 col-span-2">
                                        <h4 className="text-[10px] font-semibold text-gray-700 capitalize tracking-wider">Shop Owner Note</h4>
                                        <p className="text-xs text-gray-800 bg-blue-50 border border-blue-100 rounded p-2 whitespace-pre-wrap leading-relaxed">
                                            {selectedRequest.shop_owner_note}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selectedRequest.status === 'pending' && canApprove && (
                                <div className="space-y-2 pt-2 border-t mt-2">
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-semibold text-gray-700 capitalize tracking-wider">Shop Owner Note</h4>
                                        <textarea
                                            value={shopOwnerNote}
                                            onChange={(e) => setShopOwnerNote(e.target.value)}
                                            placeholder="Enter a note for the customer... (Required for rejection)"
                                            className="w-full text-xs border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none p-2 border min-h-[60px] transition-all duration-200"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleReject(selectedRequest.id)}
                                            disabled={rejectMutation.isPending || approveMutation.isPending}
                                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <XCircle className="w-3.5 h-3.5 mr-1" />
                                            Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleApprove(selectedRequest.id)}
                                            disabled={rejectMutation.isPending || approveMutation.isPending}
                                            className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                            Approve &amp; Reopen
                                        </Button>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
