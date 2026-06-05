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
            render: (val) => <span className="text-xs font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">#{val}</span>
        },
        {
            key: 'service_id',
            title: 'Service Ref',
            dataIndex: 'service_id',
            render: (val) => <span className="font-semibold text-gray-900 text-xs">SR#{val}</span>
        },
        {
            key: 'customer',
            title: 'Customer',
            dataIndex: 'customer',
            render: (val) => <span className="text-xs text-gray-700 font-medium">{val?.name || '-'}</span>
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
                        <span className="text-xs text-gray-700 font-medium">{tech.name}</span>
                        <span className="text-[10px] text-gray-500">{tech.phone || '-'}</span>
                    </div>
                );
            }
        },
        {
            key: 'reason',
            title: 'Reason / Issue',
            dataIndex: 'reason',
            render: (val) => <span className="text-xs text-gray-600 truncate max-w-[160px] block" title={val}>{val}</span>
        },
        {
            key: 'status',
            title: 'Status',
            dataIndex: 'status',
            render: (val) => {
                const styles: Record<string, string> = {
                    pending: 'bg-amber-100 text-amber-700 border-amber-200',
                    approved: 'bg-green-100 text-green-700 border-green-200',
                    rejected: 'bg-red-100 text-red-700 border-red-200',
                };
                const style = styles[val] || 'bg-gray-100 text-gray-700';
                return <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${style}`}>{val}</span>;
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
                <div className="flex items-center gap-1 justify-center">
                    <Button size="sm" variant="ghost" onClick={() => handleView(record)} className="h-6 px-2 py-0">
                        <Eye className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">View</span>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/services/view/${record.service_id}`)} className="h-6 px-2 py-0">
                        <ExternalLink className="w-3.5 h-3.5 mr-1 text-gray-500" />
                        <span className="text-xs text-gray-500 font-medium">Service</span>
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
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Reopen Request Details</DialogTitle>
                        <DialogDescription>
                            Review the customer's reported issue and approve or reject the request.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4 py-2">
                            <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-gray-500 uppercase">Service Ref:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900">SR#{selectedRequest.service_id}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 px-1.5 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                                            onClick={() => { setViewModalOpen(false); navigate(`/dashboard/services/view/${selectedRequest.service_id}`); }}
                                        >
                                            <ExternalLink className="w-3 h-3" /> View Service
                                        </Button>
                                    </div>
                                </div>
                                {selectedRequest.customer?.name && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold text-gray-500 uppercase">Customer:</span>
                                        <span className="font-bold text-gray-900">{selectedRequest.customer.name}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-gray-500 uppercase">Reopen Cycle:</span>
                                    <span className="font-bold text-gray-900">#{selectedRequest.reopen_number}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-gray-500 uppercase">Requested On:</span>
                                    <span className="font-bold text-gray-900">{new Date(selectedRequest.created_at).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-gray-500 uppercase">Status:</span>
                                    <span className="font-bold text-gray-900 uppercase">{selectedRequest.status}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Reported Issue</h4>
                                <p className="text-sm text-gray-800 bg-gray-50 border rounded p-2.5 whitespace-pre-wrap leading-relaxed">
                                    {selectedRequest.reason}
                                </p>
                            </div>

                            {selectedRequest.images && selectedRequest.images.length > 0 && (
                                <div className="space-y-1.5">
                                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Evidence / Images</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedRequest.images.map((url: string, i: number) => (
                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="relative w-20 h-20 border rounded overflow-hidden group">
                                                <img src={url} alt="Evidence" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 text-white text-[10px] font-bold">
                                                    View
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedRequest.shop_owner_note && selectedRequest.status !== 'pending' && (
                                <div className="space-y-1.5">
                                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Shop Owner Note</h4>
                                    <p className="text-sm text-gray-800 bg-blue-50 border border-blue-100 rounded p-2.5 whitespace-pre-wrap leading-relaxed">
                                        {selectedRequest.shop_owner_note}
                                    </p>
                                </div>
                            )}

                            {selectedRequest.status === 'pending' && canApprove && (
                                <div className="space-y-3 pt-4 border-t mt-4">
                                    <div className="space-y-1.5">
                                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Shop Owner Note</h4>
                                        <textarea
                                            value={shopOwnerNote}
                                            onChange={(e) => setShopOwnerNote(e.target.value)}
                                            placeholder="Enter a note for the customer... (Required for rejection)"
                                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 p-2 border min-h-[80px]"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleReject(selectedRequest.id)}
                                            disabled={rejectMutation.isPending || approveMutation.isPending}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <XCircle className="w-4 h-4 mr-1.5" />
                                            Reject
                                        </Button>
                                        <Button
                                            onClick={() => handleApprove(selectedRequest.id)}
                                            disabled={rejectMutation.isPending || approveMutation.isPending}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1.5" />
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
