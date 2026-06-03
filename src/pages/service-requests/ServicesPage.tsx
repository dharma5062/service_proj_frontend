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
import { Zap, AlertCircle, Eye, Edit, Trash2, CheckCircle, FileEdit, Search, Plus, Timer } from 'lucide-react';
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

// ─── Status helpers ──────────────────────────────────────────────────────────

const formatStatusLabel = (status?: string) => {
    if (!status) return 'N/A';
    return status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
};

const capitalizeWords = (str?: string) => {
    if (!str) return '-';
    return str.replace(/\b\w/g, (c) => c.toLocaleUpperCase());
};

// ─── Component ───────────────────────────────────────────────────────────────

const ServicesPage = () => {
    const navigate = useNavigate();
    const { shopId, hasPermission, user, isShopEmployee, isCustomer } = useAuth();
    const { useGetServiceRequests, useDeleteServiceRequest, useUpdateServiceRequest } = useServiceRequestsApi();
    const { data: rawServiceRequests = [], isLoading: loading } = useGetServiceRequests();
    const deleteServiceRequestMutation = useDeleteServiceRequest();
    const updateServiceRequestMutation = useUpdateServiceRequest();

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
                        <div className="w-6 h-6 rounded overflow-hidden border border-gray-200 inline-block">
                            <img src={images[0]} alt="inspection" className="w-full h-full object-cover" />
                        </div>
                    );
                }
                return <div className="w-6 h-6 rounded bg-gray-50 border border-gray-100 flex items-center justify-center text-[9px] text-gray-400 inline-flex">No Img</div>;
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
                const status = (record.service_status || record.status || 'pending').toLowerCase();

                let progress = 0;
                let colorClass = 'bg-gray-200';
                let indicatorClass = 'bg-gray-500';

                if (status === 'pending')            { progress = 10;  colorClass = 'bg-orange-100';  indicatorClass = 'bg-orange-500'; }
                else if (status === 'assigned')      { progress = 25;  colorClass = 'bg-blue-100';    indicatorClass = 'bg-blue-500'; }
                else if (status === 'accepted')      { progress = 40;  colorClass = 'bg-indigo-100';  indicatorClass = 'bg-indigo-500'; }
                else if (status === 'waiting_parts') { progress = 55;  colorClass = 'bg-amber-100';   indicatorClass = 'bg-amber-500'; }
                else if (status === 'in_progress')   { progress = 70;  colorClass = 'bg-purple-100';  indicatorClass = 'bg-purple-500'; }
                else if (status === 'ready')         { progress = 85;  colorClass = 'bg-teal-100';    indicatorClass = 'bg-teal-500'; }
                else if (status === 'completed')     { progress = 100; colorClass = 'bg-green-100';   indicatorClass = 'bg-green-500'; }
                else if (status === 'paid')          { progress = 100; colorClass = 'bg-emerald-100'; indicatorClass = 'bg-emerald-600'; }
                else if (status === 'cancelled')     { progress = 100; colorClass = 'bg-red-100';     indicatorClass = 'bg-red-500'; }

                const displayLabel = formatStatusLabel(status);

                const tooltipContent = status === 'assigned' && record.assigned_technician
                    ? `Assigned to ${record.assigned_technician.name}`
                    : formatStatusLabel(status);

                return (
                    <div className="w-24 group relative" title={tooltipContent}>
                        <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[10px] font-semibold text-gray-700">{displayLabel}</span>
                            <span className="text-[9px] text-gray-500">{progress}%</span>
                        </div>
                        <div className={`h-1 w-full rounded-full ${colorClass} overflow-hidden`}>
                            <div className={`h-full ${indicatorClass} rounded-full transition-all duration-300`} style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'service_cost',
            title: 'Service Cost',
            dataIndex: 'data',
            render: (_value, record) => {
                const data = parseJson(record.data);
                let cost = 0;
                if (data?.selectedServiceCharges && Array.isArray(data.selectedServiceCharges)) {
                    cost = data.selectedServiceCharges.reduce((sum: number, charge: any) => sum + Number(charge.amount || 0), 0);
                }
                if (cost === 0) return <span className="text-[11px] text-gray-400">-</span>;
                return <span className="text-[11px] font-bold text-gray-900">₹{cost.toFixed(2)}</span>;
            }
        },
        {
            key: 'created_at',
            title: 'Created Date',
            dataIndex: 'created_at',
            sortable: true,
            render: (value) => (
                <span className="text-xs text-gray-600 whitespace-nowrap">{formatDate(value)}</span>
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            dataIndex: 'id',
            align: 'center',
            render: (_, record) => {
                const status = (record.service_status || record.status || 'pending').toLowerCase();
                return (
                    <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleView(record)} className="h-5 w-5 p-0 hover:bg-blue-100" title="View Details">
                            <Eye className="h-3 w-3 text-blue-600" />
                        </Button>

                        {/* Shop Employee Actions */}
                        {isShopEmployee && status === 'assigned' && (
                            <Button size="sm" variant="ghost" onClick={() => handleAccept(record)} className="h-5 w-5 p-0 hover:bg-green-100" title="Accept Service Request">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                            </Button>
                        )}
                        {isShopEmployee && status !== 'completed' && status !== 'cancelled' && status !== 'paid' && (
                            <Button size="sm" variant="ghost" onClick={() => handleCustomize(record)} className="h-5 w-5 p-0 hover:bg-purple-100" title="Customize Defect Form / Update">
                                <FileEdit className="h-3 w-3 text-purple-600" />
                            </Button>
                        )}

                        {/* Standard Edit for SA/SO or generic update */}
                        {!isCustomer && hasPermission('service.update') && !isShopEmployee && (
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(record)} className="h-5 w-5 p-0 hover:bg-green-100" title="Edit Request">
                                <Edit className="h-3 w-3 text-green-600" />
                            </Button>
                        )}

                        {/* Standard Delete */}
                        {!isCustomer && hasPermission('service.delete') && (
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(record)} className="h-5 w-5 p-0 hover:bg-red-100" title="Delete Request">
                                <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                        )}
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

    const handleSaveCustomize = async () => {
        if (!selectedCustomizeRecord) return;
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
        } catch (error) {
            toast.error('Failed to update details', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const handleAccept = async (record: ServiceRequest) => {
        try {
            await updateServiceRequestMutation.mutateAsync({
                id: record.id,
                payload: {
                    customer_id: record.customer_id || record.customer?.id || 0,
                    service_status: 'accepted',
                }
            });
            toast.success('Service request accepted and marked as Diagnosis Started!');
        } catch (error) {
            toast.error('Failed to accept service request', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        }
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


    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="p-0">
            {/* DataTable */}
            <DataTable
                title="Active Service Requests"
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
                            { label: 'Pending',          value: 'pending' },
                            { label: 'Assigned',         value: 'assigned' },
                            { label: 'Diagnosis Started',value: 'accepted' },
                            { label: 'Awaiting Parts',   value: 'waiting_parts' },
                            { label: 'In Progress',      value: 'in_progress' },
                            { label: 'Quality Check',    value: 'ready' },
                            { label: 'Completed',        value: 'completed' },
                            { label: 'Paid',             value: 'paid' },
                            { label: 'Cancelled',        value: 'cancelled' },
                        ]
                    },
                    {
                        key: '_filter_tech',
                        label: 'Technician',
                        type: 'select',
                        options: [
                            { label: 'Unassigned', value: 'unassigned' },
                            { label: 'Assigned',   value: 'assigned' }
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
            />

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
                                        <SelectItem value="assigned">Assigned</SelectItem>
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
                                        className={`flex-1 text-[10px] font-semibold py-1 rounded border transition-colors ${
                                            estimationType === 'hours'
                                                ? 'bg-amber-500 text-white border-amber-500'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                                        }`}
                                    >
                                        By Hours
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEstimationType('days'); setEstimationValue(''); }}
                                        className={`flex-1 text-[10px] font-semibold py-1 rounded border transition-colors ${
                                            estimationType === 'days'
                                                ? 'bg-amber-500 text-white border-amber-500'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                                        }`}
                                    >
                                        By Days
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEstimationType('date'); setEstimationValue(''); }}
                                        className={`flex-1 text-[10px] font-semibold py-1 rounded border transition-colors ${
                                            estimationType === 'date'
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
                                                {Array.from({ length: 48 }, (_, i) => {
                                                    const val = (i + 1).toString();
                                                    return (
                                                        <SelectItem key={val} value={val}>
                                                            {val} Hour{val !== '1' ? 's' : ''}
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
                            <div className="space-y-1.5 flex-1 flex flex-col">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-semibold text-gray-700">Working Conditions & Notes</Label>
                                    <span className="text-[9px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-100">Internal Only</span>
                                </div>
                                <Textarea
                                    placeholder="Add working conditions & notes (visible to owner & staff)..."
                                    className="h-28 text-xs resize-none border-gray-200 focus-visible:ring-primary/20 flex-1"
                                    value={customizeNotes}
                                    onChange={(e) => setCustomizeNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Right Column: Message, Parts & Charges */}
                        <div className="space-y-3 flex flex-col">
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
                        </div>
                    </div>
                    <DialogFooter className="mt-4 pt-3 border-t">
                        <Button variant="ghost" size="sm" onClick={() => setIsCustomizeDialogOpen(false)} className="h-8 text-xs">Cancel</Button>
                        <Button size="sm" onClick={handleSaveCustomize} className="h-8 text-xs bg-primary text-white">Save All Details</Button>
                    </DialogFooter>
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
