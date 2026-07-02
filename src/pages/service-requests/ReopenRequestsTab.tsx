import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceReopenApi, ServiceReopenRequest } from '@/pages/serviceAPI/ServiceReopenAPI';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle, ExternalLink, UserCheck, Wrench, BadgeCheck, PlayCircle } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/table/datatable';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/AuthContext';
import { ReopenStatusBadge } from '@/components/reopen/ReopenStatusBadge';
import { ReopenAssignTechnicianModal } from '@/pages/service-requests/ReopenAssignTechnicianModal';

export const ReopenRequestsTab = ({ onSwitchBack }: { onSwitchBack?: () => void }) => {
    const navigate = useNavigate();
    const { isShopOwner, isSuperAdmin, isShopEmployee } = useAuth();
    const canApprove = isShopOwner || isSuperAdmin;
    const {
        useGetReopenRequests,
        useApproveReopenRequest,
        useRejectReopenRequest,
        useCloseReopenService,
        useStartReopenWork,
    } = useServiceReopenApi();
    const { data: requestsData, isLoading, refetch } = useGetReopenRequests();
    const requests = requestsData?.data || [];

    const approveMutation = useApproveReopenRequest();
    const rejectMutation = useRejectReopenRequest();
    const closeMutation = useCloseReopenService();
    const startWorkMutation = useStartReopenWork();

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ServiceReopenRequest | null>(null);
    const [shopOwnerNote, setShopOwnerNote] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleView = (record: ServiceReopenRequest) => {
        setSelectedRequest(record);
        setShopOwnerNote('');
        setViewModalOpen(true);
    };

    const handleApprove = async (id: number) => {
        try {
            const res = await approveMutation.mutateAsync({ id, note: shopOwnerNote });
            if (res.status) {
                toast.success('Reopen request approved. Please assign an employee.');
                if (selectedRequest) {
                    setSelectedRequest({ ...selectedRequest, reopen_status: 'reopen_approved' });
                }
                refetch();
                setViewModalOpen(false);
                setAssignModalOpen(true);
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

    const handleCloseService = async (request: ServiceReopenRequest) => {
        try {
            const res = await closeMutation.mutateAsync({ reopenId: request.id });
            if (res.status) {
                toast.success('Reopen service closed successfully!');
                refetch();
            } else {
                toast.error(res.message || 'Failed to close service.');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error closing service.');
        }
    };

    const handleAcceptAssignment = async (record: ServiceReopenRequest) => {
        try {
            const res = await startWorkMutation.mutateAsync(record.id);
            if (res.status) {
                toast.success('Assignment accepted! Rework is now in progress.');
                refetch();
            } else {
                toast.error(res.message || 'Failed to accept assignment.');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error accepting assignment.');
        }
    };

    const columns: Column<ServiceReopenRequest>[] = [
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
            title: 'Customer',
            dataIndex: 'customer',
            render: (val) => (
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-900">{val?.name || '-'}</span>
                    <span className="text-[9px] text-gray-500">{val?.phone || val?.mobile || '-'}</span>
                </div>
            )
        },
        {
            key: 'previous_technician',
            title: 'Previous Technician',
            dataIndex: 'service',
            render: (service: any, record: any) => {
                const assignments = service?.technician_assignments || service?.technicianAssignments || [];
                let prevTech = null;

                // Try to find the previous technician from assignments history
                if (assignments && assignments.length > 0) {
                    // The original technician is usually the first assignment
                    prevTech = assignments[0]?.user;
                }

                // Fallback if not found in history, and it hasn't been reassigned yet
                if (!prevTech && ['reopen_requested', 'pending', 'reopen_rejected'].includes(record.reopen_status)) {
                    prevTech = service?.assigned_technician || service?.assignedTechnician;
                }

                if (!prevTech) return <span className="text-xs text-gray-400 italic">Unknown</span>;

                return (
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[9px]">
                            {prevTech.name?.[0]}
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-900">{prevTech.name}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'reassigned_technician',
            title: 'Reassigned To',
            dataIndex: 'assignedTechnician',
            render: (tech, record) => {
                const t = tech || (record as any).assigned_technician || (record as any).assignedTechnician;
                if (!t) return <span className="text-xs text-amber-500 italic font-medium">Unassigned</span>;
                return (
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-[9px]">
                            {t.name?.[0]}
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-900">{t.name}</p>
                        </div>
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
                    {record.issue_type && <span className="text-[10px] font-bold text-gray-700 capitalize">{record.issue_type}</span>}
                    <span className="text-[10px] text-gray-500 truncate max-w-[140px] block" title={val}>{val}</span>
                </div>
            )
        },
        {
            key: 'reopen_status',
            title: 'Status',
            dataIndex: 'reopen_status',
            render: (val) => <ReopenStatusBadge status={val} size="xs" showPulseDot />
        },
        {
            key: 'created_at',
            title: 'Requested',
            dataIndex: 'created_at',
            render: (val) => <span className="text-xs text-gray-500">{new Date(val).toLocaleDateString()}</span>
        },
        {
            key: 'actions',
            title: 'Actions',
            dataIndex: 'id',
            align: 'center' as const,
            render: (_, record) => (
                <div className="flex items-center gap-1 justify-center">
                    {/* View Details */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleView(record)}
                        className="w-6 h-6 rounded-full hover:bg-blue-50"
                        title="View Details"
                    >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                    </Button>

                    {/* Accept Assignment (technician only, for reopen_assigned) */}
                    {/* {isShopEmployee && !canApprove && record.reopen_status === 'reopen_assigned' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAcceptAssignment(record)}
                            className="h-6 text-[10px] font-semibold bg-green-50 text-green-700 hover:bg-green-100 px-2 rounded"
                            disabled={startWorkMutation.isPending}
                        >
                            Accept & Start Work
                        </Button>
                    )} */}

                    {/* Assign Technician (only for approved but unassigned) */}
                    {canApprove && record.reopen_status === 'reopen_approved' && (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => { setSelectedRequest(record); setAssignModalOpen(true); }}
                            className="w-6 h-6 rounded-full hover:bg-purple-50"
                            title="Assign Employee"
                        >
                            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                        </Button>
                    )}

                    {/* View Rework page (for in-progress or assigned) */}
                    {['reopen_assigned', 'reopen_in_progress', 'reopen_completed', 'reopen_pending_invoice'].includes(record.reopen_status) && (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(`/dashboard/services/rework/${record.id}`)}
                            className="w-6 h-6 rounded-full hover:bg-indigo-50"
                            title="View Rework"
                        >
                            <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                        </Button>
                    )}

                    {/* Close Service (SO only, for completed warranty or paid) */}
                    {canApprove && ['reopen_completed', 'reopen_payment_completed'].includes(record.reopen_status) && (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleCloseService(record)}
                            className="w-6 h-6 rounded-full hover:bg-green-50"
                            title="Close Service"
                            disabled={closeMutation.isPending}
                        >
                            <BadgeCheck className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                    )}

                    {/* View Service */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate(`/dashboard/services/view/${record.service_id}`)}
                        className="w-6 h-6 rounded-full hover:bg-gray-100"
                        title="View Service"
                    >
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
                        <button className="relative text-sm font-bold border-b-2 border-primary text-primary px-1 pb-1 mr-2">
                            Reopen Requests
                            {requests.length > 0 && (
                                <span className="absolute -top-2 -right-3.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold px-1 border-2 border-white shadow-sm leading-none">
                                    {requestsData?.total || requests.length}
                                </span>
                            )}
                        </button>
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

            {/* View / Review Modal */}
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
                                        <span className="text-xs font-bold text-gray-900 truncate">{selectedRequest.customer.name}</span>
                                    </div>
                                )}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-semibold text-gray-500 capitalize tracking-wider">Reopen Cycle</span>
                                    <span className="text-xs font-bold text-gray-900">#{selectedRequest.reopen_number}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-semibold text-gray-500 capitalize tracking-wider">Requested On</span>
                                    <span className="text-xs font-bold text-gray-900 truncate">
                                        {new Date(selectedRequest.created_at).toLocaleDateString()}{' '}
                                        {new Date(selectedRequest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-semibold text-gray-500 capitalize tracking-wider">Issue Type</span>
                                    <span className="text-xs font-bold text-gray-900 truncate">{selectedRequest.issue_type || '-'}</span>
                                </div>
                                <div className="flex flex-col gap-0.5 col-span-1">
                                    <span className="text-[10px] font-semibold text-gray-500 capitalize tracking-wider">Status</span>
                                    <ReopenStatusBadge status={selectedRequest.reopen_status} size="xs" showPulseDot />
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
                                                <div key={i} className="relative group w-10 h-10 border border-gray-200 rounded shadow-sm overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => setPreviewImage(url)}>
                                                    <img src={url} alt="Evidence" className="w-full h-full object-cover transition-opacity" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Eye className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-gray-400 italic py-1">No images</div>
                                    )}
                                </div>

                                {selectedRequest.shop_owner_note && selectedRequest.status !== 'pending' && (
                                    <div className="space-y-1 col-span-2">
                                        <h4 className="text-[10px] font-semibold text-gray-700 capitalize tracking-wider">Admin Note</h4>
                                        <p className="text-xs text-gray-800 bg-blue-50 border border-blue-100 rounded p-2 whitespace-pre-wrap leading-relaxed">
                                            {selectedRequest.shop_owner_note}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Approve/Reject actions — only for pending requests */}
                            {selectedRequest.status === 'pending' && canApprove && (
                                <div className="space-y-2 pt-2 border-t mt-2">
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-semibold text-gray-700 capitalize tracking-wider">Admin Note</h4>
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
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Assign button for already-approved requests */}
                            {selectedRequest.reopen_status === 'reopen_approved' && canApprove && (
                                <div className="pt-2 border-t flex justify-end">
                                    <Button
                                        size="sm"
                                        className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                                        onClick={() => { setViewModalOpen(false); setAssignModalOpen(true); }}
                                    >
                                        <UserCheck className="w-3.5 h-3.5 mr-1" />
                                        Assign Employee
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Assign Technician Modal */}
            {selectedRequest && (
                <ReopenAssignTechnicianModal
                    open={assignModalOpen}
                    onOpenChange={setAssignModalOpen}
                    reopenRequest={selectedRequest}
                    onAssigned={() => refetch()}
                />
            )}
            {/* Image Preview Dialog */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-4xl w-fit border-0 p-0 bg-transparent shadow-none [&>button]:hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Image Preview</DialogTitle>
                    </DialogHeader>
                    <div className="relative flex items-center justify-center w-full h-full group">
                        {previewImage && (
                            <>
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                />
                                <button
                                    onClick={() => setPreviewImage(null)}
                                    className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
