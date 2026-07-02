import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { toast } from 'sonner';
import { Zap, AlertCircle, Eye, Edit, Trash2, CheckCircle, FileEdit, Search, Plus, Timer, FileText, Star, X, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProductsApi } from '@/pages/serviceAPI/ProductsAPI';
import { useServiceChargesApi } from '@/pages/serviceAPI/ServiceChargesAPI';
import { DataTable, Column } from '@/components/ui/table/datatable';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ServiceRequest,
    useServiceRequestsApi,
} from '@/pages/serviceAPI/ServiceRequestsAPI';
import { useServiceReopenApi } from '@/pages/serviceAPI/ServiceReopenAPI';
import { ReopenRequestsTab } from './ReopenRequestsTab';
import { SubmitReopenModal } from './SubmitReopenModal';
import ServiceCompletionRatingCard from '@/pages/service-requests/ServiceCompletionRatingCard';

// ─── Status helpers ──────────────────────────────────────────────────────────

const formatStatusLabel = (status?: string) => {
    if (!status) return 'N/A';
    return status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
};



const capitalizeWords = (str?: string) => {
    if (!str) return '-';
    return str.replace(/\b\w/g, (c) => c.toLocaleUpperCase());
};

// ─── Component ───────────────────────────────────────────────────────────────

const ServicesPage = () => {
    const navigate = useNavigate();
    const { shopId, hasPermission, user, isShopEmployee, isCustomer, isShopOwner, isSuperAdmin } = useAuth();
    const { useGetServiceRequests, useDeleteServiceRequest, useUpdateServiceRequest, useGetServiceRequestById } = useServiceRequestsApi();
    const { data: rawServiceRequests = [], isLoading: loading } = useGetServiceRequests();
    
    const { useGetReopenRequests } = useServiceReopenApi();
    const { data: reopenRequestsData } = useGetReopenRequests();
    const reopenCount = reopenRequestsData?.total || reopenRequestsData?.data?.length || 0;
    
    const deleteServiceRequestMutation = useDeleteServiceRequest();
    const updateServiceRequestMutation = useUpdateServiceRequest();

    const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
    const [selectedReopenRecord, setSelectedReopenRecord] = useState<ServiceRequest | null>(null);

    // Fetch full service request by ID to load deep shop relation for support phone
    const { data: fullReopenService } = useGetServiceRequestById(selectedReopenRecord?.id);

    // Filter and sort service requests
    const serviceRequests = useMemo(() => {
        let result = [...rawServiceRequests];

        // 1. Permission-based filtering
        // Fix #5: SE with service.update permission sees ALL shop SRs (backend already scopes to their shops).
        // SE without service.update sees ONLY their personally assigned SRs.
        if (isShopEmployee && user?.id) {
            const canUpdateAll = hasPermission('service.update');
            if (!canUpdateAll) {
                // Restricted SE — only show SRs where they are the assigned technician
                result = result.filter(req => req.assigned_technician?.id === user.id);
            }
            // Else: SE has update permission — show all shop SRs (backend scoped)
        } else if (isCustomer && user?.id) {
            result = result.filter(req => req.customer?.id === user.id);
        }

        // Map data to include synthetic keys for DataTable filtering and searching
        return result.map(req => ({
            ...req,
            _filter_status: (req.service_status || req.status || 'pending').toLowerCase(),
            _filter_tech: req.assigned_technician ? 'assigned' : 'unassigned',
            _search_blob: `SR${String(req.id).padStart(3, '0')} ${req.customer?.name || ''} ${req.customer?.phone || ''} ${req.assigned_technician?.name || ''} ${req.form?.name || ''} ${req.product?.name || ''} ${req.brand?.name || ''}`.toLowerCase()
        })).sort((a, b) => b.id - a.id);
    }, [rawServiceRequests, isShopEmployee, isCustomer, hasPermission, user?.id]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Reset pagination when branch changes
    useEffect(() => {
        setCurrentPage(1);
    }, [shopId]);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);

    // Accept dialog
    const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
    const [selectedAcceptRecord, setSelectedAcceptRecord] = useState<ServiceRequest | null>(null);

    // Complete confirmation dialog
    const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);

    // View mode for Active vs Reopen requests
    const [viewMode, setViewMode] = useState<'active' | 'reopen'>('active');

    // Customize Dialog State
    const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
    const [selectedCustomizeRecord, setSelectedCustomizeRecord] = useState<ServiceRequest | null>(null);
    const [customizeNotes, setCustomizeNotes] = useState('');
    const [customizeStatus, setCustomizeStatus] = useState('');
    const [customerNote, setCustomerNote] = useState('');
    const [estimationType, setEstimationType] = useState<'days' | 'hours' | 'date'>('days');
    const [estimationValue, setEstimationValue] = useState('');

    // Parts & Charges State for Customize Dialog
    const [customizeParts, setCustomizeParts] = useState<any[]>([]);
    const [customizeServiceCharges, setCustomizeServiceCharges] = useState<any[]>([]);
    const [partSearchQuery, setPartSearchQuery] = useState('');
    const [chargeSearchQuery, setChargeSearchQuery] = useState('');

    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [selectedRatingService, setSelectedRatingService] = useState<ServiceRequest | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Fetch products and charges ONLY when the dialog is open
    const { useGetProducts } = useProductsApi();
    const { data: productsResponse } = useGetProducts({ enabled: isCustomizeDialogOpen });
    const availableProducts = productsResponse?.data ?? [];

    const { useGetServiceCharges } = useServiceChargesApi();
    const { data: availableServiceChargesResponse = { data: [] } } = useGetServiceCharges({ enabled: isCustomizeDialogOpen });
    const availableServiceCharges = useMemo(() => {
        if (availableServiceChargesResponse && 'data' in availableServiceChargesResponse && Array.isArray(availableServiceChargesResponse.data)) {
            return availableServiceChargesResponse.data;
        }
        return Array.isArray(availableServiceChargesResponse) ? availableServiceChargesResponse : [];
    }, [availableServiceChargesResponse]);

    // ── Column definitions ───────────────────────────────────────────────────

    const columns: Column<ServiceRequest>[] = [
        {
            key: 'images',
            title: 'Images',
            dataIndex: 'data',
            width: '60px',
            align: 'center',
            render: (_value, record) => {
                const data = parseJson(record.data);
                const images = data?.images || [];
                if (images.length > 0) {
                    return (
                        <div 
                            className="w-8 h-8 rounded overflow-hidden border border-gray-200 inline-block cursor-pointer relative group"
                            onClick={(e) => { e.stopPropagation(); setPreviewImage(images[0]); }}
                        >
                            <img src={images[0]} alt="inspection" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="h-4 w-4 text-white" />
                            </div>
                        </div>
                    );
                }
                return <div className="w-8 h-8 rounded bg-gray-50 border border-gray-100 flex items-center justify-center text-[9px] text-gray-400 inline-flex">No Img</div>;
            },
        },
        {
            key: 'problem_defect',
            title: 'Problem / Defect',
            dataIndex: 'form',
            sortable: true,
            render: (_value, record) => {
                const formName = record.form?.name;
                const details = parseJson(record.service_details);
                const typeName = formName || details?.serviceType || details?.productType || 'Unknown Defect';

                return (
                    <div className="leading-tight">
                        <p className="text-[11px] font-semibold text-gray-900">{capitalizeWords(typeName)}</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">SR{String(record.id).padStart(3, '0')}</p>
                    </div>
                );
            },
        },
        {
            key: 'customer',
            title: 'Customer Info',
            dataIndex: 'customer',
            sortable: true,
            render: (_value, record) => {
                const customer = record.customer;
                if (!customer) return <span className="text-xs text-gray-400">-</span>;
                return (
                    <div className="leading-tight">
                        <p className="text-[11px] font-semibold text-gray-900">{capitalizeWords(customer.name)}</p>
                        {customer.phone && (
                            <p className="text-[9px] text-gray-500 mt-0.5">{customer.phone}</p>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'device',
            title: 'Product / Brand',
            dataIndex: 'product',
            sortable: true,
            render: (_value, record) => {
                const productName = record.product?.name;
                const brandName = record.brand?.name;

                if (!productName && !brandName) {
                    return <span className="text-xs text-gray-400">-</span>;
                }

                return (
                    <div className="leading-tight">
                        <p className="text-[11px] font-semibold text-gray-900">{capitalizeWords(productName) || '-'}</p>
                        {brandName && (
                            <p className="text-[9px] text-gray-500 mt-0.5">{capitalizeWords(brandName)}</p>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'assigned_technician',
            title: 'Technician',
            dataIndex: 'assigned_technician',
            sortable: true,
            render: (_value, record) => {
                const technician = record.assigned_technician;
                if (!technician) return <span className="text-xs text-gray-400">Not Assigned</span>;
                return (
                    <div className="leading-tight">
                        <p className="text-[11px] font-semibold text-gray-900">{capitalizeWords(technician.name)}</p>
                        {technician.role && (
                            <p className="text-[9px] text-primary mt-0.5 font-medium border border-primary/20 bg-primary/10 px-1.5 py-0 rounded-full inline-block">{capitalizeWords(technician.role)}</p>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'service_status',
            title: 'Progress',
            dataIndex: 'service_status',
            sortable: true,
            render: (_value, record) => {
                const rawStatus = (record.service_status || record.status || 'pending').toLowerCase();

                // The backend includes active_reopen_request when a rework cycle is in progress.
                // Prefer the reopen_status from that for progress display.
                const activeReopenStatus: string | undefined = record.active_reopen_request?.reopen_status;

                let status = rawStatus;
                let displayLabel = '';
                let progress = 0;
                let colorClass = 'bg-gray-200';
                let indicatorClass = 'bg-gray-500';

                // If backend sends active_reopen_status, prefer that for display
                if (activeReopenStatus) {
                    const reworkLabels: Record<string, { label: string; progress: number; color: string; indicator: string }> = {
                        reopen_requested:        { label: 'Reopen Requested',   progress: 15, color: 'bg-amber-100',  indicator: 'bg-amber-500' },
                        reopen_approved:         { label: 'Reopen Approved',    progress: 25, color: 'bg-blue-100',   indicator: 'bg-blue-500' },
                        reopen_assigned:         { label: 'Reassigned',         progress: 35, color: 'bg-purple-100', indicator: 'bg-purple-500' },
                        reopen_in_progress:      { label: 'Rework In Progress', progress: 55, color: 'bg-indigo-100', indicator: 'bg-indigo-500' },
                        reopen_completed:        { label: 'Rework Completed',   progress: 75, color: 'bg-green-100',  indicator: 'bg-green-500' },
                        reopen_pending_invoice:  { label: 'Pending Invoice',    progress: 82, color: 'bg-orange-100', indicator: 'bg-orange-500' },
                        reopen_payment_pending:  { label: 'Pending Payment',    progress: 90, color: 'bg-yellow-100', indicator: 'bg-yellow-500' },
                        reopen_payment_completed:{ label: 'Rework Paid',        progress: 100,color: 'bg-teal-100',   indicator: 'bg-teal-600' },
                        reopen_closed:           { label: 'Rework Closed',      progress: 100,color: 'bg-gray-100',   indicator: 'bg-gray-500' },
                        service_closed:          { label: 'Warranty Closed',    progress: 100,color: 'bg-emerald-100',indicator: 'bg-emerald-500' },
                    };
                    const r = reworkLabels[activeReopenStatus];
                    if (r) {
                        displayLabel = r.label;
                        progress = r.progress;
                        colorClass = r.color;
                        indicatorClass = r.indicator;
                    } else {
                        displayLabel = formatStatusLabel(activeReopenStatus);
                        progress = 30;
                    }
                } else {
                    // Standard service status
                    if (status === 'pending') { progress = 10; colorClass = 'bg-orange-100'; indicatorClass = 'bg-orange-500'; displayLabel = 'Pending'; }
                    else if (status === 'assigned') { progress = 25; colorClass = 'bg-blue-100'; indicatorClass = 'bg-blue-500'; displayLabel = 'Assigned'; }
                    else if (status === 'accepted') { progress = 40; colorClass = 'bg-indigo-100'; indicatorClass = 'bg-indigo-500'; displayLabel = 'Diagnosis Started'; }
                    else if (status === 'waiting_parts') { progress = 55; colorClass = 'bg-amber-100'; indicatorClass = 'bg-amber-500'; displayLabel = 'Awaiting Parts'; }
                    else if (status === 'in_progress') { progress = 70; colorClass = 'bg-purple-100'; indicatorClass = 'bg-purple-500'; displayLabel = 'In Progress'; }
                    else if (status === 'ready') { progress = 85; colorClass = 'bg-teal-100'; indicatorClass = 'bg-teal-500'; displayLabel = 'Quality Check'; }
                    else if (status === 'completed') { progress = 100; colorClass = 'bg-green-100'; indicatorClass = 'bg-green-500'; displayLabel = 'Completed'; }
                    else if (status === 'paid') { progress = 100; colorClass = 'bg-emerald-100'; indicatorClass = 'bg-emerald-600'; displayLabel = 'Paid'; }
                    else if (status === 'cancelled') { progress = 100; colorClass = 'bg-red-100'; indicatorClass = 'bg-red-500'; displayLabel = 'Cancelled'; }
                    else if (status === 'reopen_requested') { progress = 15; colorClass = 'bg-amber-100'; indicatorClass = 'bg-amber-500'; displayLabel = 'Reopen Requested'; }
                    else if (status === 'warranty_closed') { progress = 100; colorClass = 'bg-emerald-100'; indicatorClass = 'bg-emerald-500'; displayLabel = 'Warranty Closed'; }
                    else { displayLabel = formatStatusLabel(status); progress = 0; }
                }

                const tooltipContent = status === 'assigned' && record.assigned_technician
                    ? `Assigned to ${record.assigned_technician.name}`
                    : displayLabel;

                return (
                    <div className="w-28 group relative" title={tooltipContent}>
                        <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[10px] font-semibold text-gray-700 truncate max-w-[80px]" title={displayLabel}>{displayLabel}</span>
                            <span className="text-[9px] text-gray-500 flex-shrink-0">{progress}%</span>
                        </div>
                        <div className={`h-1 w-full rounded-full ${colorClass} overflow-hidden`}>
                            <div className={`h-full ${indicatorClass} rounded-full transition-all duration-300`} style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                );
            },
        },

        {
            key: 'actions',
            title: 'Actions',
            dataIndex: 'id',
            align: 'center',
            render: (_, record) => {
                const status = (record.service_status || record.status || 'pending').toLowerCase();
                if (isCustomer) {
                    return (
                        <div className="grid grid-cols-4 gap-1 w-[90px] mx-auto justify-items-center">
                            {/* Slot 1: View Details */}
                            <div className="w-5 h-5 flex items-center justify-center">
                                <Button size="sm" variant="ghost" onClick={() => handleView(record)} className="h-5 w-5 p-0 hover:bg-blue-100" title="View Details">
                                    <Eye className="h-3 w-3 text-blue-600" />
                                </Button>
                            </div>

                            {/* Slot 2: Rate */}
                            <div className="w-5 h-5 flex items-center justify-center">
                                {(status === 'completed' || status === 'paid') && record.assigned_technician?.id ? (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0 bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all border border-green-200"
                                        onClick={() => {
                                            setSelectedRatingService(record);
                                            setRatingModalOpen(true);
                                        }}
                                        title="Rate Service"
                                    >
                                        <Star className="h-3 w-3" />
                                    </Button>
                                ) : null}
                            </div>

                            {/* Slot 3: Report */}
                            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                {status === 'paid' && record.assigned_technician?.id ? (
                                    (() => {
                                        const hasWarranty = record.warranty_days && record.warranty_days > 0;
                                        const isExpired = record.warranty_expiry_date ? new Date(record.warranty_expiry_date) < new Date() : false;

                                        let errorMessage = "";
                                        if (!hasWarranty) {
                                            errorMessage = "Your product is not set for warranty days";
                                        } else if (isExpired) {
                                            errorMessage = "Your warranty days are expired";
                                        }

                                        return (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    if (errorMessage) {
                                                        toast.error(errorMessage);
                                                    } else {
                                                        setSelectedReopenRecord(record);
                                                        setReopenDialogOpen(true);
                                                    }
                                                }}
                                                className="h-5 w-5 p-0 text-red-500 hover:bg-red-50 transition-all"
                                                title="Report Issue / Reopen Service"
                                            >
                                                <AlertCircle className="h-3.5 w-3.5" />
                                            </Button>
                                        );
                                    })()
                                ) : null}
                            </div>

                            {/* Slot 4: Empty */}
                            <div className="w-5 h-5 flex items-center justify-center"></div>
                        </div>
                    );
                }

                return (
                    <div className="grid grid-cols-4 gap-1 w-[90px] mx-auto justify-items-center">
                        {/* Slot 1: View Details */}
                        <div className="w-5 h-5 flex items-center justify-center">
                            <Button size="sm" variant="ghost" onClick={() => handleView(record)} className="h-5 w-5 p-0 hover:bg-blue-100" title="View Details">
                                <Eye className="h-3 w-3 text-blue-600" />
                            </Button>
                        </div>

                        {/* Slot 2: Accept / Rework / Customize / Edit */}
                        <div className="w-5 h-5 flex items-center justify-center">
                            {/* Rework service: go to dedicated Rework page (hides Customize modal) */}
                            {isShopEmployee && record.active_reopen_request ? (
                                <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/services/rework/${record.active_reopen_request!.id}`)} className="h-5 w-5 p-0 hover:bg-orange-100" title="Go to Rework Page">
                                    <Wrench className="h-3 w-3 text-orange-600" />
                                </Button>
                            ) : isShopEmployee && status === 'assigned' && !record.active_reopen_request ? (
                                <Button size="sm" variant="ghost" onClick={() => handleAcceptClick(record)} className="h-5 w-5 p-0 hover:bg-green-100" title="Accept Service Request">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                </Button>
                            ) : isShopEmployee && !['assigned', 'completed', 'cancelled', 'paid', 'warranty_closed', 'reopen_closed'].includes(status) && !record.active_reopen_request ? (
                                <Button size="sm" variant="ghost" onClick={() => handleCustomize(record)} className="h-5 w-5 p-0 hover:bg-purple-100" title="Update Working Conditions & Parts">
                                    <FileEdit className="h-3 w-3 text-purple-600" />
                                </Button>
                            ) : hasPermission('service.update') && !isShopEmployee ? (
                                <Button size="sm" variant="ghost" onClick={() => handleEdit(record)} className="h-5 w-5 p-0 hover:bg-green-100" title="Edit Request">
                                    <Edit className="h-3 w-3 text-green-600" />
                                </Button>
                            ) : null}
                        </div>

                        {/* Slot 3: Generate Invoice */}
                        <div className="w-5 h-5 flex items-center justify-center">
                            {(isSuperAdmin || isShopOwner || isShopEmployee) && status === 'completed' ? (
                                <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/invoice/service/${record.id}`)} className="h-5 w-5 p-0 hover:bg-amber-100" title="Generate Invoice">
                                    <FileText className="h-3 w-3 text-amber-600" />
                                </Button>
                            ) : null}
                        </div>

                        {/* Slot 4: Delete Request */}
                        <div className="w-5 h-5 flex items-center justify-center">
                            {hasPermission('service.delete') ? (
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(record)} className="h-5 w-5 p-0 hover:bg-red-100" title="Delete Request">
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                </Button>
                            ) : null}
                        </div>
                    </div>
                );
            },
        },
    ];

    // Filter columns for customer
    const filteredColumns = useMemo(() => {
        if (isCustomer) {
            return columns.filter(col => col.key !== 'assigned_technician' && col.key !== 'technician_role');
        }
        return columns;
    }, [columns, isCustomer]);

    // ── Action handlers ──────────────────────────────────────────────────────

    const handleView = (record: ServiceRequest) => {
        navigate(`/dashboard/services/view/${record.id}`);
    };

    const handleEdit = (record: ServiceRequest) => {
        navigate(`/dashboard/services/edit/${record.id}`);
    };

    const handleCustomize = (record: ServiceRequest) => {
        setSelectedCustomizeRecord(record);
        let notes = record.admin_note || '';
        if (notes.startsWith('[') || notes.startsWith('{')) {
            try {
                const parsed = JSON.parse(notes);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    notes = parsed[0].internalNotes !== undefined ? parsed[0].internalNotes : JSON.stringify(parsed);
                } else if (parsed.internalNotes !== undefined) {
                    notes = parsed.internalNotes;
                }
            } catch (e) {
                // Ignore parsing errors, fallback to string
            }
        }

        if (notes.trim().toLowerCase() === 'demo') {
            notes = '';
        }

        setCustomizeNotes(notes);
        setCustomizeStatus((record.service_status || record.status || 'in_progress').toLowerCase());

        // Extract parts and service charges from data
        if (record.data) {
            const dataObj = typeof record.data === 'string' ? parseJson(record.data) : record.data;
            setCustomizeParts(dataObj?.parts || []);
            setCustomizeServiceCharges(dataObj?.selectedServiceCharges || []);
            setCustomerNote(dataObj?.customer_note || '');
            // Load estimation
            const estim = dataObj?.estimation;
            if (estim && estim.value) {
                setEstimationType(estim.type || 'days');
                setEstimationValue(estim.value || '');
            } else {
                setEstimationType('days');
                setEstimationValue('');
            }
        } else {
            setCustomizeParts([]);
            setCustomizeServiceCharges([]);
            setCustomerNote('');
            setEstimationType('days');
            setEstimationValue('');
        }

        setIsCustomizeDialogOpen(true);
    };

    const handleSaveCustomize = async (forceCompleted?: boolean) => {
        if (!selectedCustomizeRecord) return;

        if (customizeStatus === 'completed' && forceCompleted !== true) {
            setCompleteConfirmOpen(true);
            return;
        }

        try {
            // merge data
            const oldData = typeof selectedCustomizeRecord.data === 'string'
                ? parseJson(selectedCustomizeRecord.data)
                : (selectedCustomizeRecord.data || {});

            const newData = {
                ...oldData,
                parts: customizeParts,
                selectedServiceCharges: customizeServiceCharges,
                customer_note: customerNote,
                estimation: estimationValue.trim()
                    ? { type: estimationType, value: estimationValue.trim(), set_at: new Date().toISOString() }
                    : null,
            };

            const adminNotePayload = JSON.stringify([{ internalNotes: customizeNotes || '' }]);

            await updateServiceRequestMutation.mutateAsync({
                id: selectedCustomizeRecord.id,
                payload: {
                    customer_id: selectedCustomizeRecord.customer_id || selectedCustomizeRecord.customer?.id || 0,
                    service_status: customizeStatus,
                    admin_note: adminNotePayload,
                    data: JSON.stringify(newData)
                }
            });
            toast.success('Working conditions updated successfully!');
            setIsCustomizeDialogOpen(false);
            setCompleteConfirmOpen(false);
            
            // Redirect to invoice generation if completed
            if (customizeStatus === 'completed') {
                navigate(`/dashboard/invoice/service/${selectedCustomizeRecord.id}`);
            }
        } catch (error) {
            toast.error('Failed to update details', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const handleAcceptClick = (record: ServiceRequest) => {
        setSelectedAcceptRecord(record);
        setAcceptDialogOpen(true);
    };

    const confirmAccept = async () => {
        if (selectedAcceptRecord) {
            try {
                await updateServiceRequestMutation.mutateAsync({
                    id: selectedAcceptRecord.id,
                    payload: {
                        customer_id: selectedAcceptRecord.customer_id || selectedAcceptRecord.customer?.id || 0,
                        service_status: 'accepted',
                    }
                });
                toast.success('Service request accepted and marked as Diagnosis Started!');
            } catch (error) {
                toast.error('Failed to accept service request', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        setAcceptDialogOpen(false);
        setSelectedAcceptRecord(null);
    };

    const handleDeleteClick = (record: ServiceRequest) => {
        setSelectedDeleteId(record.id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedDeleteId) {
            try {
                await deleteServiceRequestMutation.mutateAsync(selectedDeleteId);
                toast.success('Service request deleted successfully');
            } catch (error) {
                toast.error('Failed to delete service request', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        setDeleteDialogOpen(false);
        setSelectedDeleteId(null);
    };

    const handleAddNew = () => {
        navigate('/dashboard/services/create');
    };

    const handleExport = () => {
        toast.info('Exporting data...');
    };

    const renderDataTable = () => (
        <DataTable
            headerStats={[
                {
                    label: 'Total Requests',
                    value: serviceRequests.length,
                    icon: <Zap className="h-3 w-3" />,
                    color: 'primary'
                },
                {
                    label: 'Critical Defects',
                    value: serviceRequests.filter(r => (r.service_status || r.status || '').toLowerCase() === 'pending').length,
                    icon: <AlertCircle className="h-3 w-3" />,
                    color: 'danger'
                }
            ]}
            filterConfig={[
                {
                    key: '_filter_status',
                    label: 'Service Status',
                    type: 'select',
                    options: [
                        { label: 'Pending', value: 'pending' },
                        { label: 'Assigned', value: 'assigned' },
                        { label: 'Diagnosis Started', value: 'accepted' },
                        { label: 'Awaiting Parts', value: 'waiting_parts' },
                        { label: 'In Progress', value: 'in_progress' },
                        { label: 'Quality Check', value: 'ready' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Paid', value: 'paid' },
                        { label: 'Reopen Requested', value: 'reopen_requested' },
                        { label: 'Reopened', value: 'reopened' },
                        { label: 'Cancelled', value: 'cancelled' },
                    ]
                },
                {
                    key: '_filter_tech',
                    label: 'Technician',
                    type: 'select',
                    options: [
                        { label: 'Unassigned', value: 'unassigned' },
                        { label: 'Assigned', value: 'assigned' }
                    ]
                }
            ]}
            searchKey="_search_blob"
            columns={filteredColumns}
            data={serviceRequests}
            searchable={true}
            showActions={false}
            showAdd={!isCustomer && hasPermission('service.create')}
            showExport={!isCustomer}
            onAdd={handleAddNew}
            onExport={handleExport}
            pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: serviceRequests.length,
                onChange: (page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                },
            }}
            hoverable
            bordered
            loading={loading}
            density="compact"
            title={(isShopOwner || isSuperAdmin || isShopEmployee) ? (
                <div className="flex gap-4 items-center">
                    <button 
                        className={`text-sm font-bold px-1 pb-1 transition-colors ${viewMode === 'active' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setViewMode('active')}
                    >
                        Active Service Requests
                    </button>
                    <button
                        className={`relative text-sm font-bold px-1 pb-1 mr-2 transition-colors ${viewMode === 'reopen' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setViewMode('reopen')}
                    >
                        Reopen Requests
                        {reopenCount > 0 && (
                            <span className="absolute -top-2 -right-3.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold px-1 border-2 border-white shadow-sm leading-none">
                                {reopenCount}
                            </span>
                        )}
                    </button>
                </div>
            ) : "Active Service Requests"}
        />
    );

    return (
        <div className="p-0">
            {((isShopOwner || isSuperAdmin || isShopEmployee) && viewMode === 'reopen') ? (
                <ReopenRequestsTab onSwitchBack={() => setViewMode('active')} />
            ) : (
                renderDataTable()
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the service request.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Accept Confirmation Dialog */}
            <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Accept Service Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to accept this service request and begin diagnosis? This will mark the request status as "Diagnosis Started".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmAccept}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Accept
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Complete Confirmation Dialog */}
            <Dialog open={completeConfirmOpen} onOpenChange={setCompleteConfirmOpen}>
                <DialogContent className="p-0 border-0 max-w-sm rounded-2xl shadow-2xl overflow-hidden gap-0 bg-white">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-green-500 to-green-700 px-5 py-4 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold">Confirm Completion</h3>
                                    <p className="text-xs text-green-100/90 leading-tight mt-0.5">Finalize service & generate invoice</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-4">
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center shadow-sm">
                            <div className="flex justify-center mb-2">
                                <AlertCircle className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="text-xs text-amber-900 leading-relaxed font-medium">
                                Are you sure you want to mark this service request as <span className="font-bold">Completed</span>?
                            </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 space-y-2">
                            <p className="text-xs font-semibold text-gray-700">What happens next:</p>
                            <ul className="text-[11px] text-gray-500 space-y-1.5 list-disc list-inside leading-normal">
                                <li>Service details, parts, and charges will be finalized</li>
                                <li>You will be prompted to generate the invoice</li>
                                <li>The customer will be notified of completion</li>
                            </ul>
                        </div>
                        
                        {/* Footer Buttons */}
                        <div className="flex gap-3 pt-1">
                            <Button
                                variant="outline"
                                className="flex-1 h-10 text-sm rounded-xl border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
                                onClick={() => setCompleteConfirmOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 h-10 text-xs font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                onClick={() => handleSaveCustomize(true)}
                            >
                                Confirm & Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Customize / Technician Update Dialog */}
            <Dialog open={isCustomizeDialogOpen} onOpenChange={setIsCustomizeDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-4 gap-0">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-sm">Update Working Conditions & Parts</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                        {/* Left Column: Status, Estimation & Notes */}
                        <div className="space-y-3 flex flex-col">
                            {/* Service Status */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-700">Service Status</Label>
                                <Select value={customizeStatus} onValueChange={setCustomizeStatus}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(selectedCustomizeRecord?.service_status?.toLowerCase() === 'assigned' || selectedCustomizeRecord?.status?.toLowerCase() === 'assigned' || customizeStatus === 'assigned') && (
                                            <SelectItem value="assigned">Assigned</SelectItem>
                                        )}
                                        <SelectItem value="accepted">Diagnosis Started</SelectItem>
                                        <SelectItem value="waiting_parts">Awaiting Parts</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="ready">Quality Inspection</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Estimated Completion */}
                            <div className="space-y-2 border rounded-md p-2.5 bg-amber-50/40 border-amber-100">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                        <Timer className="h-3 w-3 text-amber-500" />
                                        Estimated Completion
                                    </Label>
                                    <span className="text-[9px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">Visible to Customer</span>
                                </div>

                                {/* Type toggle */}
                                <div className="flex gap-1">

                                    <button
                                        type="button"
                                        onClick={() => { setEstimationType('hours'); setEstimationValue(''); }}
                                        className={`flex-1 text-[10px] font-semibold py-1 rounded border transition-colors ${estimationType === 'hours'
                                                ? 'bg-amber-500 text-white border-amber-500'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                                            }`}
                                    >
                                        By Hours
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEstimationType('days'); setEstimationValue(''); }}
                                        className={`flex-1 text-[10px] font-semibold py-1 rounded border transition-colors ${estimationType === 'days'
                                                ? 'bg-amber-500 text-white border-amber-500'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                                            }`}
                                    >
                                        By Days
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEstimationType('date'); setEstimationValue(''); }}
                                        className={`flex-1 text-[10px] font-semibold py-1 rounded border transition-colors ${estimationType === 'date'
                                                ? 'bg-amber-500 text-white border-amber-500'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                                            }`}
                                    >
                                        By Date
                                    </button>
                                </div>

                                {/* Input */}
                                {estimationType === 'days' && (
                                    <div className="flex items-center gap-2">
                                        <Select value={estimationValue} onValueChange={setEstimationValue}>
                                            <SelectTrigger className="w-32 h-8 text-xs bg-white border-gray-200 focus:ring-1 focus:ring-amber-300">
                                                <SelectValue placeholder="Select days" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 30 }, (_, i) => {
                                                    const val = (i + 1).toString();
                                                    return (
                                                        <SelectItem key={val} value={val}>
                                                            {val} Day{val !== '1' ? 's' : ''}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <span className="text-xs text-gray-500">working days</span>
                                        {estimationValue && (
                                            <span className="text-[10px] text-amber-700 font-medium italic ml-auto">
                                                ~{estimationValue} day{Number(estimationValue) !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {estimationType === 'hours' && (
                                    <div className="flex items-center gap-2">
                                        <Select value={estimationValue} onValueChange={setEstimationValue}>
                                            <SelectTrigger className="w-32 h-8 text-xs bg-white border-gray-200 focus:ring-1 focus:ring-amber-300">
                                                <SelectValue placeholder="Select hours" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 24 }, (_, i) => {
                                                    const val = (i + 1).toString();
                                                    return (
                                                        <SelectItem key={val} value={val}>
                                                            {val} Hours
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <span className="text-xs text-gray-500">hours</span>
                                        {estimationValue && (
                                            <span className="text-[10px] text-amber-700 font-medium italic ml-auto">
                                                ~{estimationValue} hour{Number(estimationValue) !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {estimationType === 'date' && (
                                    <input
                                        type="date"
                                        value={estimationValue}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setEstimationValue(e.target.value)}
                                        className="w-full h-8 border rounded px-2 text-xs border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                    />
                                )}

                                {/* Clear button */}
                                {estimationValue && (
                                    <button
                                        type="button"
                                        onClick={() => setEstimationValue('')}
                                        className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        ✕ Clear estimation
                                    </button>
                                )}
                            </div>

                            {/* Working Conditions & Notes */}
                            <div className="border rounded-md p-2.5 bg-purple-50/20 space-y-2 border-purple-100/50">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-semibold text-gray-700">Admin Notes</Label>
                                    <span className="text-[9px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-100">Internal Only</span>
                                </div>
                                <Textarea
                                    placeholder="Add admin notes..."
                                    className="h-20 min-h-[5rem] text-xs resize-none bg-white border-gray-200 focus-visible:ring-purple-300 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-80 shadow-sm"
                                    value={customizeNotes}
                                    onChange={(e) => setCustomizeNotes(e.target.value)}
                                    disabled={isShopEmployee}
                                />
                            </div>
                        </div>

                        {/* Right Column: Message, Parts & Charges */}
                        <div className="space-y-3 flex flex-col">


                            {/* Parts & Materials */}
                            <div className="border rounded-md p-2.5 bg-gray-50/50 space-y-2">
                                <Label className="text-xs font-semibold text-gray-700">Parts & Materials</Label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                    <Input
                                        className="h-7 pl-6 text-xs"
                                        placeholder="Search parts..."
                                        value={partSearchQuery}
                                        onChange={(e) => setPartSearchQuery(e.target.value)}
                                    />
                                </div>
                                {partSearchQuery && (
                                    <div className="border rounded bg-white max-h-32 overflow-y-auto shadow-sm">
                                        {availableProducts
                                            .filter(p => p.name.toLowerCase().includes(partSearchQuery.toLowerCase()))
                                            .slice(0, 10)
                                            .map(p => (
                                                <div key={p.id} className="flex justify-between items-center p-1.5 text-xs hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onClick={() => {
                                                    const exists = customizeParts.find(cp => cp.id === p.id.toString());
                                                    if (exists) {
                                                        setCustomizeParts(customizeParts.map(cp => cp.id === p.id.toString() ? { ...cp, quantity: cp.quantity + 1 } : cp));
                                                    } else {
                                                        setCustomizeParts([...customizeParts, { id: p.id.toString(), name: p.name, price: Number(p.price) || 0, quantity: 1, status: 'In Stock' }]);
                                                    }
                                                    setPartSearchQuery('');
                                                }}>
                                                    <span className="truncate pr-2">{p.name}</span>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className="font-semibold text-gray-600">₹{p.price}</span>
                                                        <Plus className="h-3 w-3 text-primary" />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                                <div className="space-y-1.5 mt-2 max-h-[120px] overflow-y-auto pr-1">
                                    {customizeParts.length === 0 && <p className="text-[10px] text-gray-400 text-center py-2">No parts added</p>}
                                    {customizeParts.map((part, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white border rounded p-1 text-xs">
                                            <span className="font-medium truncate flex-1 px-1">{part.name}</span>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <input type="number" min="1" className="w-9 h-5 border rounded text-center text-[10px]" value={part.quantity} onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 1;
                                                    setCustomizeParts(customizeParts.map(cp => cp.id === part.id ? { ...cp, quantity: val } : cp));
                                                }} />
                                                <span className="font-semibold w-10 text-right text-gray-700">₹{part.price * part.quantity}</span>
                                                <button onClick={() => setCustomizeParts(customizeParts.filter(cp => cp.id !== part.id))} className="p-0.5 hover:bg-red-50 rounded"><Trash2 className="h-3 w-3 text-red-500" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Service Charges */}
                            <div className="border rounded-md p-2.5 bg-gray-50/50 space-y-2">
                                <Label className="text-xs font-semibold text-gray-700">Service Charges</Label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                    <Input
                                        className="h-7 pl-6 text-xs"
                                        placeholder="Search or add manual charge..."
                                        value={chargeSearchQuery}
                                        onChange={(e) => setChargeSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && chargeSearchQuery.trim()) {
                                                const newCharge = { id: Date.now().toString(), name: chargeSearchQuery.trim(), amount: 0 };
                                                setCustomizeServiceCharges([...customizeServiceCharges, newCharge]);
                                                setChargeSearchQuery('');
                                            }
                                        }}
                                    />
                                </div>
                                {chargeSearchQuery && (
                                    <div className="border rounded bg-white max-h-32 overflow-y-auto shadow-sm">
                                        <div className="p-1.5 text-[10px] text-gray-500 border-b bg-gray-50 flex items-center gap-1">Press <kbd className="bg-gray-200 px-1 rounded">Enter</kbd> to add custom</div>
                                        {availableServiceCharges
                                            .filter(c => c.name.toLowerCase().includes(chargeSearchQuery.toLowerCase()))
                                            .map(c => (
                                                <div key={c.id} className="flex justify-between items-center p-1.5 text-xs hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onClick={() => {
                                                    if (!customizeServiceCharges.find(sc => sc.id === c.id)) {
                                                        setCustomizeServiceCharges([...customizeServiceCharges, c]);
                                                    }
                                                    setChargeSearchQuery('');
                                                }}>
                                                    <span className="truncate pr-2">{c.name}</span>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className="font-semibold text-gray-600">₹{c.amount}</span>
                                                        <Plus className="h-3 w-3 text-primary" />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                                <div className="space-y-1.5 mt-2 max-h-[120px] overflow-y-auto pr-1">
                                    {customizeServiceCharges.length === 0 && <p className="text-[10px] text-gray-400 text-center py-2">No charges added</p>}
                                    {customizeServiceCharges.map((charge, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white border rounded p-1 text-xs">
                                            <span className="font-medium truncate flex-1 px-1">{charge.name}</span>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <input type="number" min="0" placeholder="₹" className="w-12 h-5 border rounded text-center text-[10px]" value={charge.amount || ''} onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setCustomizeServiceCharges(customizeServiceCharges.map(sc => sc.id === charge.id ? { ...sc, amount: val } : sc));
                                                }} />
                                                <button onClick={() => setCustomizeServiceCharges(customizeServiceCharges.filter(sc => sc.id !== charge.id))} className="p-0.5 hover:bg-red-50 rounded"><Trash2 className="h-3 w-3 text-red-500" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Message for Customer */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-semibold text-gray-700">Message for Customer</Label>
                                    <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">Visible to Customer</span>
                                </div>
                                <Textarea
                                    placeholder="Add message or status updates for the customer..."
                                    className="h-20 text-xs resize-none border-gray-200 focus-visible:ring-primary/20"
                                    value={customerNote}
                                    onChange={(e) => setCustomerNote(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-4 pt-3 border-t">
                        <Button variant="ghost" size="sm" onClick={() => setIsCustomizeDialogOpen(false)} className="h-8 text-xs">Cancel</Button>
                        <Button size="sm" onClick={() => handleSaveCustomize()} className="h-8 text-xs bg-primary text-white">Save All Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rating Modal */}
            <Dialog open={ratingModalOpen} onOpenChange={setRatingModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 bg-transparent shadow-none">
                    <DialogTitle className="sr-only">Rate Service</DialogTitle>
                    {selectedRatingService && selectedRatingService.assigned_technician && (
                        <ServiceCompletionRatingCard
                            serviceId={selectedRatingService.id}
                            employeeId={selectedRatingService.assigned_technician.id}
                            employeeName={selectedRatingService.assigned_technician.name}
                            totalAmount={Number((selectedRatingService as any).invoice?.total_amount ?? 0)}
                            currency={(selectedRatingService as any).invoice?.currency || 'INR'}
                            closedOn={(selectedRatingService as any).invoice?.paid_at ?? selectedRatingService.updated_at}
                            onRated={() => setRatingModalOpen(false)}
                            onSkip={() => setRatingModalOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {selectedReopenRecord && (
                <SubmitReopenModal
                    open={reopenDialogOpen}
                    onOpenChange={setReopenDialogOpen}
                    serviceId={selectedReopenRecord.id}
                    supportPhone={fullReopenService?.shop?.shop_owner?.phone || fullReopenService?.shop?.user?.phone || undefined}
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
                                    <X className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ServicesPage;

// ─── Utilities ───────────────────────────────────────────────────────────────

function parseJson(value: any): any {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}
