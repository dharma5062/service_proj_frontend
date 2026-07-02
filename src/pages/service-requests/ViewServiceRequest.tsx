import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    ArrowLeft,
    Pencil,
    CheckCircle,
    Clock,
    User,
    Phone,
    Mail,
    MapPin,
    Tag,
    Calendar,
    FileText,
    Package,
    X,
    Timer,
    Send,
    Eye,
} from 'lucide-react';
import { useInvoiceApi } from '@/pages/serviceAPI/InvoiceAPI';
import {
    useServiceRequestsApi,
} from '@/pages/serviceAPI/ServiceRequestsAPI';
import {
    DefectFormField,
    useShopCategoryFormsApi,
} from '@/pages/serviceAPI/ShopCategoryFormsAPI';
import { useShopEmployeesApi } from '@/pages/serviceAPI/ShopEmployeesAPI';
import { useServiceReopenApi } from '@/pages/serviceAPI/ServiceReopenAPI';
import { SubmitReopenModal } from './SubmitReopenModal';
import { ReopenAssignTechnicianModal } from './ReopenAssignTechnicianModal';

import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700 border border-orange-200',
    assigned: 'bg-blue-100 text-blue-700 border border-blue-200',
    accepted: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    waiting_parts: 'bg-amber-100 text-amber-700 border border-amber-200',
    in_progress: 'bg-purple-100 text-purple-700 border border-purple-200',
    ready: 'bg-teal-100 text-teal-700 border border-teal-200',
    completed: 'bg-green-100 text-green-700 border border-green-200',
    paid: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border border-red-200',
    reopen_requested: 'bg-pink-100 text-pink-700 border border-pink-200',
    reopened: 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200',
    warranty_closed: 'bg-green-100 text-green-700 border border-green-200',
};

export const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    assigned: 'Assigned',
    accepted: 'Accepted',
    waiting_parts: 'Waiting Parts',
    in_progress: 'In Progress',
    ready: 'Ready',
    completed: 'Completed',
    paid: 'Paid',
    cancelled: 'Cancelled',
    reopen_requested: 'Reopen Requested',
    reopened: 'Reopened',
    warranty_closed: 'Warranty Closed',
};

const getStatusStyle = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    return STATUS_STYLES[status.toLowerCase()] ?? 'bg-gray-100 text-gray-700';
};

const formatStatusLabel = (status?: string) => {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
};

const parseJson = (value: any): any => {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const renderActivityDescription = (desc: string | null | undefined, isCustomer: boolean) => {
    if (!desc) return null;
    const trimmed = desc.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
            const parsed = JSON.parse(trimmed);
            const items = Array.isArray(parsed) ? parsed : [parsed];
            return (
                <div className="space-y-1 mt-1">
                    {items.map((item: any, idx: number) => {
                        if (item.internalNotes) {
                            if (isCustomer) return null; // Do not show internal notes to customers
                            return (
                                <div key={idx} className="bg-purple-50/70 border border-purple-100 text-purple-900 rounded-lg p-2 text-xs leading-normal">
                                    <span className="font-bold text-[9px] text-purple-700 block uppercase tracking-wider mb-0.5">Internal Note</span>
                                    {item.internalNotes}
                                </div>
                            );
                        }
                        if (item.customerNotes || item.customer_note) {
                            const noteText = item.customerNotes || item.customer_note;
                            return (
                                <div key={idx} className="bg-blue-50/70 border border-blue-100 text-blue-900 rounded-lg p-2 text-xs leading-normal">
                                    <span className="font-bold text-[9px] text-blue-700 block uppercase tracking-wider mb-0.5">Message for Customer</span>
                                    {noteText}
                                </div>
                            );
                        }
                        // Generic object keys fallback
                        return (
                            <div key={idx} className="text-xs text-gray-600 mt-1 bg-gray-50 border rounded-lg p-2">
                                {Object.entries(item).map(([key, val]) => {
                                    if (key === 'internalNotes' && isCustomer) return null;
                                    return (
                                        <p key={key}>
                                            <span className="font-semibold uppercase text-[9px] text-gray-500 mr-1">{key.replace(/_/g, ' ')}:</span>
                                            {String(val)}
                                        </p>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            );
        } catch {
            // Fall back to plain text
        }
    }
    return <p className="text-xs text-gray-600 leading-normal">{desc}</p>;
};

// ─── Component ───────────────────────────────────────────────────────────────

const ViewServiceRequest = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const { isSuperAdmin, isShopOwner, isCustomer, isShopEmployee, hasPermission } = useAuth();

    const { useGetServiceRequestById, useGetServiceRequestActivities, useUpdateServiceRequest } = useServiceRequestsApi();
    const { useGenerateInvoice, useResendInvoice } = useInvoiceApi();
    const generateInvoiceMutation = useGenerateInvoice();
    const resendInvoiceMutation = useResendInvoice();
    const updateServiceRequestMutation = useUpdateServiceRequest();
    const { useGetCategoryForms } = useShopCategoryFormsApi();
    const { useGetShopEmployees } = useShopEmployeesApi();

    const numericId = id ? Number(id) : undefined;
    const { data: service, isLoading: loading } = useGetServiceRequestById(numericId);
    const { data: activities = [] } = useGetServiceRequestActivities(numericId);
    const { data: categoryForms = [] } = useGetCategoryForms();
    useGetShopEmployees({ per_page: 100 });
    

    const { useGetReopenRequests } = useServiceReopenApi();
    const { data: reopenHistoryData, refetch: refetchReopen } = useGetReopenRequests({ service_id: numericId });
    const hasPendingReopen = reopenHistoryData?.data?.some((req: any) => req.status === 'pending') || false;
    const [reopenModalOpen, setReopenModalOpen] = useState(false);
    const [isChangingTech] = useState(false);
    const [rereopenAssignModalOpen, setRereopenAssignModalOpen] = useState(false);

    // Find the active reopen request (approved but not closed)
    const activeReopenRequest = reopenHistoryData?.data?.find((req: any) =>
        req.status === 'approved' &&
        !['reopen_rejected', 'reopen_closed', 'service_closed'].includes(req.reopen_status)
    ) as any | undefined;

    // Find the latest approved reopen request (even if closed) for displaying technician assignment history
    const latestApprovedReopenRequest = reopenHistoryData?.data?.find((req: any) =>
        req.status === 'approved' && req.reopen_status !== 'reopen_rejected'
    ) as any | undefined;

    // The original assignment is the one before any reopens
    const originalAssignment = ((service as any)?.technician_assignments || []).find((a: any) => !a.reopen_request_id) || ((service as any)?.technician_assignments || [])[((service as any)?.technician_assignments || []).length - 1];
    const displayTechnician = (latestApprovedReopenRequest && originalAssignment?.user) 
        ? originalAssignment.user 
        : service?.assigned_technician;

    const currentStatus = (service?.service_status || service?.status || 'pending').toLowerCase();
    const isAcceptedOrBeyond = !['pending', 'assigned'].includes(currentStatus);
    const canChangeTechnician = (isSuperAdmin || isShopOwner) && !isAcceptedOrBeyond;
    const canChangeReopenTechnician = (isSuperAdmin || isShopOwner) && !!activeReopenRequest &&
        ['reopen_assigned'].includes(activeReopenRequest?.reopen_status ?? '');

    const handleAccept = async () => {
        if (!service) return;
        try {
            await updateServiceRequestMutation.mutateAsync({
                id: service.id,
                payload: {
                    customer_id: service.customer_id || service.customer?.id || 0,
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-gray-500">Loading service request...</p>
                </div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <p className="text-sm text-gray-500">Service request not found.</p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/services')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to List
                    </Button>
                </div>
            </div>
        );
    }

    const data = parseJson(service.data);
    const details = parseJson(service.service_details);
    const images: string[] = data?.images && Array.isArray(data.images) ? data.images : [];
    const parts: any[] = data?.parts && Array.isArray(data.parts) ? data.parts : [];
    const defectFormValues: Record<string, any> = data?.defectFormValues || {};
    const tags: string = data?.tags || '';
    const status = service.service_status || service.status;

    // Parse admin notes
    let parsedInternalNotes = service.admin_note || '';
    const parsedServiceCharges: any[] = data?.selectedServiceCharges && Array.isArray(data.selectedServiceCharges) ? data.selectedServiceCharges : [];
    const estimation = data?.estimation || null;

    // Helper: format estimation for display
    const formatEstimation = (estim: any): string => {
        if (!estim || !estim.value) return '';
        if (estim.type === 'days') {
            const d = Number(estim.value);
            return `${d} working day${d !== 1 ? 's' : ''}`;
        }
        if (estim.type === 'hours') {
            const h = Number(estim.value);
            return `${h} hour${h !== 1 ? 's' : ''}`;
        }
        // date type
        try {
            return new Date(estim.value).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
            });
        } catch {
            return estim.value;
        }
    };

    const estimationLabel = formatEstimation(estimation);

    if (service.admin_note) {
        try {
            const parsed = JSON.parse(service.admin_note);
            if (Array.isArray(parsed) && parsed.length > 0) {
                const noteData = parsed[0];
                if (noteData.internalNotes !== undefined) {
                    parsedInternalNotes = noteData.internalNotes;
                }
            } else if (typeof parsed === 'object') {
                if (parsed.internalNotes !== undefined) {
                    parsedInternalNotes = parsed.internalNotes;
                }
            }
        } catch {
            // Fallback to string if not JSON
        }
    }

    // Resolve defect field labels from category forms
    const resolveDefectFields = (): { label: string; value: any; type: string }[] => {
        if (Object.keys(defectFormValues).length === 0) return [];

        // Find the matching form by form_id or by name from service_details.serviceType
        let formFields: DefectFormField[] = [];
        const formId = service.form_id;
        const serviceType = details?.serviceType;

        for (const form of categoryForms) {
            if (
                (formId && form.id === Number(formId)) ||
                (serviceType && form.name === serviceType)
            ) {
                if (Array.isArray(form.description)) {
                    formFields = form.description as DefectFormField[];
                }
                break;
            }
        }

        return Object.entries(defectFormValues).map(([fieldId, value]) => {
            const field = formFields.find((f) => f.id === fieldId);
            return {
                label: field?.label || fieldId,
                value,
                type: field?.type || 'text',
            };
        });
    };

    const resolvedDefectFields = resolveDefectFields();

    // Price calculations
    const calculatedPartsSubtotal = parts.reduce((sum, part) => sum + (Number(part.price) || 0) * (part.quantity || 1), 0);
    const calculatedPartsTax = parts.reduce((sum, part) => {
        if (part.tax_type !== 'inclusive') {
            return sum + ((Number(part.price) || 0) * (part.quantity || 1) * (Number(part.tax_percentage) || 0) / 100);
        }
        return sum;
    }, 0);
    const calculatedServiceSubtotal = parsedServiceCharges.reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0);
    const gstType = data?.gstType || 'none';
    const gstPercentage = Number(data?.gstPercentage || 18);
    const serviceDiscount = Number(data?.serviceDiscount || data?.discount || 0);
    const calculatedServiceTax = gstType === 'none' ? 0 : calculatedServiceSubtotal * (gstPercentage / 100);
    
    const subtotal = calculatedPartsSubtotal + calculatedServiceSubtotal;
    const discount = serviceDiscount;
    const tax = calculatedPartsTax + calculatedServiceTax;
    const grandTotal = calculatedPartsSubtotal + calculatedPartsTax + calculatedServiceSubtotal + calculatedServiceTax - serviceDiscount;

    const existingInv = (service as any)?.invoice;
    
    // Reopen eligibility: customer role, service must be exactly 'paid', active warranty, not already requested
    const isWarrantyActive = existingInv?.warranty_expiry_date && new Date(existingInv.warranty_expiry_date) > new Date();
    const canReopen = isCustomer
        && status?.toLowerCase() === 'paid'        // backend only accepts 'paid' status
        && isWarrantyActive                         // warranty must be active
        && status?.toLowerCase() !== 'reopen_requested'; // hide if request already pending

    return (
        <div className="p-0 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dashboard/services')}
                        className="h-8 px-3"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            Service Request{' '}
                            <span className="text-primary">
                                SR{String(service.id).padStart(3, '0')}
                            </span>
                            <Badge className={getStatusStyle(status)}>
                                {formatStatusLabel(status)}
                            </Badge>
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Created {formatDate(service.created_at)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isShopEmployee && status === 'assigned' && !activeReopenRequest && (
                        <Button
                            size="sm"
                            onClick={handleAccept}
                            className="h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Accept Request
                        </Button>
                    )}
                    {(canChangeTechnician || (isShopEmployee && hasPermission('service.update'))) && (
                        <Button
                            size="sm"
                            onClick={() => navigate(`/dashboard/services/edit/${service.id}`)}
                            className="h-8 gap-1.5"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                        </Button>
                    )}
                    {canReopen && (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                                if (hasPendingReopen) {
                                    toast.info('Your issue report has been submitted waiting for shop owner approval.');
                                } else {
                                    setReopenModalOpen(true);
                                }
                            }}
                            className="h-8 gap-1.5 shadow-sm"
                        >
                            <User className="w-3.5 h-3.5" />
                            Report Issue
                        </Button>
                    )}
                    {/* Invoice Actions */}
                    {['completed', 'paid'].includes(status?.toLowerCase() ?? '') && (() => {
                        const existingInv = (service as any)?.invoice;
                        if (existingInv) {
                            return (
                                <>
                                    <Button
                                        id="view-invoice-btn"
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 gap-1.5 text-green-700 hover:bg-green-50"
                                        onClick={() => navigate(`/dashboard/invoice/view/${existingInv.id}`)}
                                        title="View Invoice"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        Invoice
                                    </Button>
                                    {(isSuperAdmin || isShopOwner || isShopEmployee) && existingInv.status !== 'paid' && (
                                        <Button
                                            id="resend-invoice-btn"
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 gap-1.5 text-blue-700 hover:bg-blue-50"
                                            disabled={resendInvoiceMutation.isPending}
                                            onClick={async () => {
                                                try {
                                                    const res = await resendInvoiceMutation.mutateAsync(existingInv.id);
                                                    if (res.email_sent) {
                                                        toast.success('Invoice email re-sent to customer!');
                                                    }
                                                } catch (e: any) {
                                                    toast.error(e.message || 'Failed to resend');
                                                }
                                            }}
                                            title="Resend Invoice Email"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            {resendInvoiceMutation.isPending ? 'Sending...' : 'Resend'}
                                        </Button>
                                    )}
                                </>
                            );
                        }
                        
                        if (isSuperAdmin || isShopOwner || isShopEmployee) {
                            return (
                                <Button
                                    id="generate-invoice-btn"
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 gap-1.5 text-blue-700 hover:bg-blue-50"
                                    disabled={generateInvoiceMutation.isPending}
                                    onClick={() => navigate(`/dashboard/invoice/service/${service.id}`)}
                                    title="Generate Invoice"
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    Generate
                                </Button>
                            );
                        }
                        return null;
                    })()}
                </div>
            </div>

            {/* ── ISSUE 2 FIX: Pending Reopen Banner — shown to customer when request is under review ── */}
            {isCustomer && status?.toLowerCase() === 'reopen_requested' && (
                <div className="mb-3 rounded-lg border border-pink-200 bg-pink-50 p-2.5 px-3 flex items-center gap-2.5 shadow-sm text-xs">
                    <Clock className="w-4 h-4 text-pink-500 shrink-0" />
                    <div className="flex-1">
                        <span className="font-bold text-pink-800 uppercase tracking-wider text-[10px] block">Reopen Request Pending</span>
                        <span className="text-pink-700">Your issue report has been submitted and is awaiting review by the shop owner. We'll notify you once a decision is made.</span>
                    </div>
                    <span className="text-[9px] font-bold text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">Under Review</span>
                </div>
            )}

            {/* ── ISSUE 3 FIX: Reopened Banner — shown to customer after request is approved ── */}
            {isCustomer && status?.toLowerCase() === 'reopened' && (
                <div className="mb-3 rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-2.5 px-3 flex items-center gap-2.5 shadow-sm text-xs">
                    <CheckCircle className="w-4 h-4 text-fuchsia-500 shrink-0" />
                    <div className="flex-1">
                        <span className="font-bold text-fuchsia-800 uppercase tracking-wider text-[10px] block">Reopen Approved</span>
                        <span className="text-fuchsia-700">Your reopen request was approved by the shop. A technician will be assigned to your device shortly.</span>
                    </div>
                    <span className="text-[9px] font-bold text-fuchsia-700 bg-fuchsia-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">Reopened</span>
                </div>
            )}


            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                    {/* Customer Info */}
                    {service.customer && (
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-4">
                                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary" />
                                    Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                                        {service.customer.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {service.customer.name}
                                            </p>
                                            {service.customer.company_name && (
                                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-semibold">
                                                    {service.customer.company_name}
                                                </span>
                                            )}
                                            {service.customer.customer_approved && (
                                                <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Approved
                                                </Badge>
                                            )}
                                        </div>
                                        {service.customer.gstin && (
                                            <p className="text-xs text-gray-700 font-semibold">
                                                GST Number: {service.customer.gstin}
                                            </p>
                                        )}
                                        {service.customer.phone && (
                                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                                <Phone className="w-3 h-3 text-gray-400" />
                                                {service.customer.phone}
                                            </p>
                                        )}
                                        {service.customer.email && (
                                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                                <Mail className="w-3 h-3 text-gray-400" />
                                                {service.customer.email}
                                            </p>
                                        )}
                                        {service.customer.address && (
                                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                                <MapPin className="w-3 h-3 text-gray-400" />
                                                {service.customer.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Service Details — rendered as labeled fields */}
                    {details && (
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-4">
                                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    Service Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                    {details.productCategory && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Category</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {details.productCategory}
                                            </p>
                                        </div>
                                    )}
                                    {details.productType && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Product Type</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {details.productType}
                                            </p>
                                        </div>
                                    )}
                                    {(details.brand || service.brand?.name) && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Brand</p>
                                            <div className="flex items-center gap-2">
                                                {service.brand?.brand_logo && (
                                                    <img
                                                        src={service.brand.brand_logo}
                                                        alt={service.brand.name}
                                                        className="w-5 h-5 object-contain"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                )}
                                                <p className="text-sm font-medium text-gray-900">
                                                    {service.brand?.name || details.brand}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {(details.model || service.product?.name) && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Model</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {service.product?.name || details.model}
                                            </p>
                                        </div>
                                    )}
                                    {details.serviceType && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Problem Preset</p>
                                            <Badge variant="outline" className="text-xs">
                                                {details.serviceType}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Defect Form Values */}
                    {resolvedDefectFields.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-4">
                                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-orange-500" />
                                    Defect Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                    {resolvedDefectFields.map((field, i) => {
                                        // Skip empty arrays (device-photos with no photos)
                                        if (Array.isArray(field.value) && field.value.length === 0) return null;

                                        return (
                                            <div
                                                key={i}
                                                className={
                                                    field.type === 'textarea' || field.type === 'device-photos'
                                                        ? 'col-span-2'
                                                        : ''
                                                }
                                            >
                                                <p className="text-xs text-gray-500 mb-0.5">{field.label}</p>
                                                {/* Boolean values */}
                                                {typeof field.value === 'boolean' ? (
                                                    <Badge
                                                        className={
                                                            field.value
                                                                ? 'bg-green-100 text-green-700 text-xs'
                                                                : 'bg-gray-100 text-gray-600 text-xs'
                                                        }
                                                    >
                                                        {field.value ? 'Yes' : 'No'}
                                                    </Badge>
                                                ) : Array.isArray(field.value) ? (
                                                    /* Device photos */
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {field.value.map((img: string, idx: number) => (
                                                            <div key={idx} className="relative group w-20 h-20 flex-shrink-0 border rounded-md overflow-hidden cursor-pointer bg-gray-50" onClick={() => setLightboxImage(img)}>
                                                                <img
                                                                    src={img}
                                                                    alt={`${field.label} ${idx + 1}`}
                                                                    className="w-full h-full object-contain transition-opacity"
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Eye className="w-6 h-6 text-white" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    /* Text / other values */
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {String(field.value || '-')}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Admin Instructions & Tags Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Admin & Customer Notes */}
                        {((parsedInternalNotes && !isCustomer) || data?.customer_note) && (
                            <Card className="h-full">
                                <CardHeader className="pb-2 pt-3 px-4">
                                    <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-purple-500" />
                                        {isCustomer ? 'Message from Shop' : 'Admin Notes'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4 space-y-3">
                                    {parsedInternalNotes && !isCustomer && (
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border">
                                            {parsedInternalNotes}
                                        </p>
                                    )}
                                    {data?.customer_note && (
                                        <div className="bg-blue-50 border border-blue-100 rounded-md p-2.5">
                                            <p className="text-[10px] capitalize font-bold text-blue-600 tracking-wider mb-1">
                                                Technician Notes
                                            </p>
                                            <p className="text-xs text-blue-900 italic">
                                                "{data.customer_note}"
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Tags */}
                        {tags && (
                            <Card className="h-full">
                                <CardHeader className="pb-2 pt-3 px-4">
                                    <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-indigo-500" />
                                        Tags
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {tags
                                            .split(',')
                                            .map((t: string) => t.trim())
                                            .filter(Boolean)
                                            .map((tag: string, i: number) => (
                                                <Badge key={i} variant="outline" className="text-xs capitalize">
                                                    {tag}
                                                </Badge>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    {(() => {
                        const reopenRequests = reopenHistoryData?.data || [];
                        if (reopenRequests.length === 0) return null;
                        const statusStyles: Record<string, string> = {
                            pending:  'bg-amber-100 text-amber-700 border-amber-200',
                            approved: 'bg-green-50 text-green-700 border-green-200',
                            completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                            rejected: 'bg-red-100 text-red-700 border-red-200',
                        };
                        return (
                            <Card>
                                <CardHeader className="pb-2 pt-3 px-4">
                                    <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-pink-500" />
                                        Reopen History
                                        <Badge variant="secondary" className="text-xs ml-1">{reopenRequests.length}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <div className="space-y-3">
                                        {reopenRequests.map((req: any) => {
                                            const isApproved = req.status === 'approved';
                                            const isReworkInvoicePaid = (req.newInvoice?.status === 'paid') || ((req as any).new_invoice?.status === 'paid');
                                            const isCompleted = isApproved && isReworkInvoicePaid;
                                            const displayStatus = isCompleted ? 'completed' : req.status;

                                            return (
                                                <div key={req.id} className="rounded-lg border bg-gray-50 p-3 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-gray-700">Reopen #{req.reopen_number}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${statusStyles[displayStatus] || 'bg-gray-100 text-gray-700'}`}>{displayStatus}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 leading-relaxed bg-white border rounded p-2 whitespace-pre-wrap">{req.reason}</p>
                                                    {req.images && req.images.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {req.images.map((url: string, i: number) => (
                                                                <div key={i} className="relative group w-12 h-12 border rounded overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => setLightboxImage(url)}>
                                                                    <img src={url} alt="Evidence" className="w-full h-full object-cover transition-opacity" />
                                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Eye className="w-4 h-4 text-white" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {req.shop_owner_note && (
                                                        <div className="bg-blue-50 border border-blue-100 rounded p-2">
                                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Admin Note</p>
                                                            <p className="text-xs text-blue-800">{req.shop_owner_note}</p>
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] text-gray-400">{new Date(req.created_at).toLocaleString()}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })()}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* Technician Assignment */}
                    <Card>
                        <CardHeader className="pb-2 pt-3 px-4">
                            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                Technician Assignment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-3">
                            {/* Rework Cycle Technician — shown when an active reopen exists */}
                            {latestApprovedReopenRequest && (
                                <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3 space-y-2">
                                    <p className="text-[10px] font-bold text-orange-600 capitalize tracking-wider flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                                        Rework Cycle #{latestApprovedReopenRequest.reopen_number} Technician
                                    </p>
                                    {latestApprovedReopenRequest.assigned_technician ? (
                                        <div className="flex items-start gap-2">
                                            <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-orange-700 font-bold text-xs flex-shrink-0">
                                                {latestApprovedReopenRequest.assigned_technician.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-900 truncate">{latestApprovedReopenRequest.assigned_technician.name}</p>
                                                <Badge className="bg-orange-100 text-orange-700 text-[9px] h-4 px-1.5 border border-orange-200 mt-0.5">Rework Assigned</Badge>
                                                <div className="mt-1.5 space-y-1">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                                        <Phone className="w-3 h-3 text-gray-400" />
                                                        {latestApprovedReopenRequest.assigned_technician.phone || 'No phone'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                                        <Mail className="w-3 h-3 text-gray-400" />
                                                        {latestApprovedReopenRequest.assigned_technician.email || 'No email'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-orange-600 italic">No technician assigned to this rework cycle yet.</p>
                                    )}
                                    {canChangeReopenTechnician && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-xs h-7 border-orange-300 text-orange-700 hover:bg-orange-100 hover:border-orange-400 mt-1"
                                            onClick={() => setRereopenAssignModalOpen(true)}
                                        >
                                            Change Rework Technician
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Original / Current Service Technician */}
                            {displayTechnician && !isChangingTech ? (
                                <div className="space-y-4">
                                    {latestApprovedReopenRequest && (
                                        <p className="text-[10px] font-bold text-gray-400 capitalize tracking-wider">Previous Technician</p>
                                    )}
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 border border-primary/20">
                                            {displayTechnician.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 flex items-center gap-2 truncate">
                                                {displayTechnician.name}
                                                {!latestApprovedReopenRequest && <Badge className="bg-primary text-white text-[9px] h-4 px-1.5 uppercase tracking-wider">Current</Badge>}
                                            </p>
                                            <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] mt-1 h-5">
                                                {displayTechnician.role || 'employee'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 border-t pt-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                            {displayTechnician.phone || 'No phone'}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                                            {displayTechnician.email || 'No email'}
                                        </div>
                                        {/* Removed duplicate assignment instructions */}
                                    </div>

                                    {/* Previous Technicians (History) */}
                                    {(() => {
                                        const assignments = (service as any).technician_assignments || [];
                                        // Filter out the current technician's latest assignment to avoid duplication,
                                        // or just show all assignments sorted by date.
                                        if (assignments.length <= 1) return null;
                                        
                                        // Exclude the most recent one (which is the current)
                                        const previousAssignments = [...assignments].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(1);
                                        
                                        return (
                                            <div className="mt-4 pt-3 border-t">
                                                <p className="text-[10px] capitalize font-bold text-gray-500 tracking-wider mb-2">Previous Technicians</p>
                                                <div className="space-y-2">
                                                    {previousAssignments.map((assignment: any, index: number) => (
                                                        <div key={index} className="flex flex-col p-2 bg-gray-50 rounded border text-xs gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-[10px] shrink-0">
                                                                    {assignment.user?.name?.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="flex-1 min-w-0 flex items-center justify-between">
                                                                    <div>
                                                                        <p className="font-medium text-gray-700 truncate">{assignment.user?.name}</p>
                                                                        <p className="text-[9px] text-gray-500">{new Date(assignment.created_at).toLocaleDateString()}</p>
                                                                    </div>
                                                                    {assignment.reopen_request_id && (
                                                                        <Badge variant="outline" className="text-[9px] bg-pink-50 text-pink-700 border-pink-200">Reopen</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-1 border-t border-gray-100 pt-1.5 mt-0.5">
                                                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                                    {assignment.user?.phone || 'No phone'}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                                    {assignment.user?.email || 'No email'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {canChangeTechnician && !activeReopenRequest && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full text-xs h-8 border-dashed hover:border-primary/40 hover:text-primary mt-2"
                                            onClick={() => navigate(`/dashboard/services/assign-technician/${service.id}`)}
                                        >
                                            Change Technician
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                canChangeTechnician ? (
                                    <div className="text-center py-5 bg-gray-50 rounded-lg border border-dashed">
                                        <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500 font-medium mb-3">No technician assigned yet</p>
                                        <Button 
                                            className="h-8 text-xs bg-primary hover:bg-primary/90" 
                                            onClick={() => navigate(`/dashboard/services/assign-technician/${service.id}`)}
                                        >
                                            Assign Technician
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed">
                                        <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500 font-medium">No technician assigned yet</p>
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>

                    {/* Parts & Pricing */}
                    <Card>
                        <CardHeader className="pb-2 pt-3 px-4">
                            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Package className="w-4 h-4 text-primary" />
                                Parts & Pricing
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {parts.length > 0 || parsedServiceCharges.length > 0 ? (
                                (() => {
                                    const originalItems: any[] = [];
                                    const reopenItems: any[] = [];

                                    parts.forEach(part => {
                                        let addedInReopen = null;
                                        const reopenReqs = reopenHistoryData?.data || [];
                                        if (reopenReqs.length > 0) {
                                            const sortedReopens = [...reopenReqs].sort((a: any, b: any) => a.reopen_number - b.reopen_number);
                                            for (const req of sortedReopens) {
                                                // Only approved/completed reopen requests can have new additions
                                                if (req.status === 'pending' || req.status === 'rejected') {
                                                    continue;
                                                }
                                                const originalData = typeof req.original_data === 'string' ? parseJson(req.original_data) : req.original_data;
                                                const origParts = originalData?.parts || [];
                                                const inOrig = origParts.find((p: any) => (p.sku && p.sku === part.sku) || (p.id && p.id === part.id) || (p.name === part.name));
                                                if (!inOrig) {
                                                    addedInReopen = req.reopen_number;
                                                    break;
                                                }
                                            }
                                        }
                                        if (addedInReopen) {
                                            reopenItems.push({ ...part, itemType: 'part', addedInReopen });
                                        } else {
                                            originalItems.push({ ...part, itemType: 'part' });
                                        }
                                    });

                                    parsedServiceCharges.forEach(charge => {
                                        let addedInReopen = null;
                                        const reopenReqs = reopenHistoryData?.data || [];
                                        if (reopenReqs.length > 0) {
                                            const sortedReopens = [...reopenReqs].sort((a: any, b: any) => a.reopen_number - b.reopen_number);
                                            for (const req of sortedReopens) {
                                                // Only approved/completed reopen requests can have new additions
                                                if (req.status === 'pending' || req.status === 'rejected') {
                                                    continue;
                                                }
                                                const originalData = typeof req.original_data === 'string' ? parseJson(req.original_data) : req.original_data;
                                                const origCharges = originalData?.selectedServiceCharges || [];
                                                const inOrig = origCharges.find((c: any) => c.name === charge.name);
                                                if (!inOrig) {
                                                    addedInReopen = req.reopen_number;
                                                    break;
                                                }
                                            }
                                        }
                                        if (addedInReopen) {
                                            reopenItems.push({ ...charge, itemType: 'charge', addedInReopen });
                                        } else {
                                            originalItems.push({ ...charge, itemType: 'charge' });
                                        }
                                    });

                                    const renderTable = (items: any[]) => (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 border-b">
                                                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Item</th>
                                                    <th className="text-center text-xs font-medium text-gray-500 px-3 py-2">Status / Type</th>
                                                    <th className="text-center text-xs font-medium text-gray-500 px-3 py-2">Qty</th>
                                                    <th className="text-right text-xs font-medium text-gray-500 px-3 py-2">Price</th>
                                                    <th className="text-right text-xs font-medium text-gray-500 px-3 py-2">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, i) => {
                                                    const isPart = item.itemType === 'part';
                                                    const price = parseFloat(isPart ? item.price : item.amount) || 0;
                                                    const qty = isPart ? (item.quantity || 1) : 1;
                                                    const addedInReopen = item.addedInReopen;
                                                    
                                                    return (
                                                        <tr key={`${item.itemType}-${i}`} className={`border-b last:border-0 ${!isPart ? 'bg-gray-50/50' : ''}`}>
                                                            <td className="px-3 py-2">
                                                                <div className="flex items-center flex-wrap gap-1">
                                                                    <p className="font-medium text-gray-900 text-xs">{item.name}</p>
                                                                    {addedInReopen && (
                                                                        <Badge variant="secondary" className="bg-pink-100 text-pink-700 text-[9px] h-4 px-1 border-pink-200 uppercase tracking-wider">Reopen #{addedInReopen}</Badge>
                                                                    )}
                                                                </div>
                                                                {isPart && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                {isPart ? (
                                                                    <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                                                                        {item.status}
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-xs text-primary border-primary/20 bg-primary/10">
                                                                        Service Charge
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2 text-center text-xs text-gray-700">{isPart ? qty : '-'}</td>
                                                            <td className="px-3 py-2 text-right text-xs text-gray-700">₹{price.toFixed(2)}</td>
                                                            <td className="px-3 py-2 text-right text-xs font-medium text-gray-900">
                                                                ₹{(price * qty).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    );

                                    return (
                                        <div className="space-y-4">
                                            {/* Original Items */}
                                            {originalItems.length > 0 && (
                                                <div className="border rounded-lg overflow-hidden">
                                                    {renderTable(originalItems)}
                                                </div>
                                            )}

                                            {/* Reopen Additions */}
                                            {reopenItems.length > 0 && (
                                                <div className="border border-pink-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                                    <div className="bg-pink-50/80 px-3 py-2.5 border-b border-pink-100 flex items-center justify-between">
                                                        <span className="text-xs font-bold text-pink-800 capitalize tracking-wider flex items-center gap-1.5">
                                                            <Package className="w-3.5 h-3.5 text-pink-600" />
                                                            New Additions (Billable)
                                                        </span>
                                                        <Badge variant="secondary" className="bg-pink-100 text-pink-700 text-[10px] capitalize tracking-wider border-pink-200">
                                                            {reopenItems.length} {reopenItems.length === 1 ? 'Item' : 'Items'}
                                                        </Badge>
                                                    </div>
                                                    {renderTable(reopenItems)}
                                                </div>
                                            )}

                                            {/* Totals */}
                                            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">Subtotal</span>
                                                    <span className="font-medium text-gray-800">₹{Number(subtotal).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">Discount</span>
                                                    <span className="font-medium text-gray-800">₹{Number(discount).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">Tax</span>
                                                    <span className="font-medium text-gray-800">₹{Number(tax).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm border-t pt-1.5 mt-1.5">
                                                    <span className="font-bold text-gray-900">Grand Total</span>
                                                    <span className="font-bold text-gray-900">₹{Number(grandTotal).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <p className="text-xs text-gray-500 text-center py-4">No parts or service charges added</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tags moved to left column */}

                    {/* Inspection Images */}
                    {images.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-4">
                                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-teal-500" />
                                    Inspection Images
                                    <Badge variant="secondary" className="text-xs ml-1">
                                        {images.length}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="flex flex-wrap gap-3">
                                    {images.map((img, i) => (
                                        <div key={i} className="relative group w-24 h-24 flex-shrink-0">
                                            <img
                                                src={img}
                                                alt={`Inspection ${i + 1}`}
                                                className="w-full h-full object-contain bg-gray-50 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => setLightboxImage(img)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Timeline */}
                    <Card>
                        <CardHeader className="pb-2 pt-3 px-4">
                            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                Tracking Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {(activities.length > 0 || estimationLabel) ? (
                                <div className="max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                                    <div className="relative border-l border-gray-100 ml-3 pl-0 space-y-5 pb-1">
                                        {estimationLabel && (
                                            <div className="relative pl-6 pb-2">
                                                <div className="absolute -left-[11px] top-0.5 w-5.5 h-5.5 rounded-full border border-amber-200 shadow-sm bg-white flex items-center justify-center animate-pulse">
                                                    <div className="w-4 h-4 rounded-full flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-200">
                                                        <Timer className="w-2.5 h-2.5" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <h4 className="text-xs font-bold text-amber-800">Estimated Completion</h4>
                                                        {estimation?.set_at && (
                                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                                {formatDate(estimation.set_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-amber-700 font-medium">
                                                        {estimation?.type === 'days' || estimation?.type === 'hours'
                                                            ? `Your device will be ready in approx. ${estimationLabel}`
                                                            : `Estimated to be ready by ${estimationLabel}`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {activities.map((activity: any) => {
                                            let icon = <Clock className="w-2.5 h-2.5 text-gray-500" />;
                                            let iconBg = "bg-gray-100 text-gray-500 border-gray-200";

                                            if (activity.activity_type === 'created') {
                                                icon = <FileText className="w-2.5 h-2.5 text-green-600" />;
                                                iconBg = "bg-green-50 text-green-600 border-green-200";
                                            } else if (activity.activity_type === 'status_change') {
                                                icon = <Clock className="w-2.5 h-2.5 text-blue-600" />;
                                                iconBg = "bg-blue-50 text-blue-600 border-blue-200";
                                            } else if (activity.activity_type === 'parts_added') {
                                                icon = <Package className="w-2.5 h-2.5 text-orange-600" />;
                                                iconBg = "bg-orange-50 text-orange-600 border-orange-200";
                                            } else if (activity.activity_type === 'charges_added') {
                                                icon = <Tag className="w-2.5 h-2.5 text-purple-600" />;
                                                iconBg = "bg-purple-50 text-purple-600 border-purple-200";
                                            } else if (activity.activity_type === 'technician_assigned') {
                                                icon = <User className="w-2.5 h-2.5 text-indigo-600" />;
                                                iconBg = "bg-indigo-50 text-indigo-600 border-indigo-200";
                                            }

                                            // Customer-friendly details mappings
                                            let displayTitle = activity.title;
                                            let displayDesc = activity.description;

                                            if (isCustomer) {
                                                if (activity.to_status === 'waiting_parts') {
                                                    displayTitle = "Awaiting Parts";
                                                    displayDesc = "We are currently waiting for required parts to arrive.";
                                                } else if (activity.to_status === 'accepted') {
                                                    displayTitle = "Diagnosis Started";
                                                    displayDesc = "The technician has accepted the task and is running initial diagnostics.";
                                                } else if (activity.to_status === 'ready') {
                                                    displayTitle = "Quality Inspection";
                                                    displayDesc = "Repairs are complete. We are conducting quality control testing.";
                                                }
                                            }

                                            return (
                                                <div key={activity.id} className="relative pl-6 pb-2">
                                                    {/* Timeline Bullet Node */}
                                                    <div className="absolute -left-[11px] top-0.5 w-5.5 h-5.5 rounded-full border border-gray-100 shadow-sm bg-white flex items-center justify-center">
                                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${iconBg}`}>
                                                            {icon}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <h4 className="text-xs font-semibold text-gray-900">{displayTitle}</h4>
                                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                                {formatDate(activity.created_at)}
                                                            </span>
                                                        </div>
                                                        
                                                        {displayDesc && (
                                                            <div className="mt-0.5">
                                                                {renderActivityDescription(displayDesc, isCustomer)}
                                                            </div>
                                                        )}

                                                        {/* Internal log notes / actor details */}
                                                        {!isCustomer && activity.user && (
                                                            <p className="text-[9px] text-gray-400 font-medium">
                                                                Action by: {activity.user.name} ({activity.user.user_type === 'so' ? 'Shop Owner' : 'Employee'})
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-medium text-gray-900">Created</p>
                                            <p className="text-xs text-gray-500">{formatDate(service.created_at)}</p>
                                        </div>
                                    </div>
                                    {service.updated_at && service.updated_at !== service.created_at && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-gray-900">Last Updated</p>
                                                <p className="text-xs text-gray-500">{formatDate(service.updated_at)}</p>
                                            </div>
                                        </div>
                                    )}
                                    {service.assigned_technician && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-gray-900">Technician Assigned</p>
                                                <p className="text-[10px] text-gray-600">Assigned to {service.assigned_technician.name}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Image Preview Dialog */}
            <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
                <DialogContent className="max-w-4xl w-fit border-0 p-0 bg-transparent shadow-none [&>button]:hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Image Preview</DialogTitle>
                    </DialogHeader>
                    <div className="relative flex items-center justify-center w-full h-full group">
                        {lightboxImage && (
                            <>
                                <img
                                    src={lightboxImage}
                                    alt="Preview"
                                    className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                />
                                <button
                                    onClick={() => setLightboxImage(null)}
                                    className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            <SubmitReopenModal
                open={reopenModalOpen}
                onOpenChange={setReopenModalOpen}
                serviceId={service.id}
                warrantyExpiryDate={existingInv?.warranty_expiry_date}
                supportPhone={service.shop?.shop_owner?.phone || service.shop?.user?.phone || '0'}
            />
            {activeReopenRequest && (
                <ReopenAssignTechnicianModal
                    open={rereopenAssignModalOpen}
                    onOpenChange={setRereopenAssignModalOpen}
                    reopenRequest={activeReopenRequest}
                    onAssigned={() => {
                        setRereopenAssignModalOpen(false);
                        refetchReopen();
                    }}
                />
            )}
        </div>
    );
};

export default ViewServiceRequest;
