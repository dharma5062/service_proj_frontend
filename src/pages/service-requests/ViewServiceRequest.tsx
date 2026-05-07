import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import {
    useServiceRequestsApi,
} from '@/pages/serviceAPI/ServiceRequestsAPI';
import {
    DefectFormField,
    useShopCategoryFormsApi,
} from '@/pages/serviceAPI/ShopCategoryFormsAPI';
import { useShopEmployeesApi } from '@/pages/serviceAPI/ShopEmployeesAPI';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    in_progress: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
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

// ─── Component ───────────────────────────────────────────────────────────────

const ViewServiceRequest = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const { isSuperAdmin, isShopOwner, isCustomer, isShopEmployee, hasPermission } = useAuth();

    const { useGetServiceRequestById, useAssignTechnician } = useServiceRequestsApi();
    const { useGetCategoryForms } = useShopCategoryFormsApi();
    const { useGetShopEmployees } = useShopEmployeesApi();

    const numericId = id ? Number(id) : undefined;
    const { data: service, isLoading: loading } = useGetServiceRequestById(numericId);
    const { data: categoryForms = [] } = useGetCategoryForms();
    const { data: employeesData } = useGetShopEmployees({ per_page: 100 });
    
    const assignMutation = useAssignTechnician();

    const [isAssigning, setIsAssigning] = useState(false);
    const [selectedTechId, setSelectedTechId] = useState<string>('');
    const [isChangingTech, setIsChangingTech] = useState(false);

    const canChangeTechnician = isSuperAdmin || isShopOwner;

    // Allow all shop employees to be assigned, as roles are fully customizable
    const technicians = employeesData?.data || [];

    const handleAssignTechnician = async () => {
        if (!selectedTechId || !numericId) return;
        
        setIsAssigning(true);
        try {
            await assignMutation.mutateAsync({
                service_id: numericId,
                user_id: Number(selectedTechId)
            });
            toast.success('Technician assigned successfully');
            setIsChangingTech(false);
            setSelectedTechId('');
            // The query will automatically invalidate and refresh the details
            // navigate('/dashboard/services'); // Stay on the page to see the details
        } catch (error: any) {
            toast.error(error.message || 'Failed to assign technician');
        } finally {
            setIsAssigning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
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
    const subtotal = data?.subtotal ?? 0;
    const discount = data?.discount ?? 0;
    const tax = data?.tax ?? 0;
    const grandTotal = data?.grandTotal ?? 0;

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
                            <span className="text-blue-600">
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
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                    {/* Customer Info */}
                    {service.customer && (
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-4">
                                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        {service.customer.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {service.customer.name}
                                            </p>
                                            {service.customer.customer_approved && (
                                                <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Approved
                                                </Badge>
                                            )}
                                        </div>
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
                                    <FileText className="w-4 h-4 text-blue-600" />
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
                                                            <div key={idx} className="relative group w-20 h-20 flex-shrink-0">
                                                                <img
                                                                    src={img}
                                                                    alt={`${field.label} ${idx + 1}`}
                                                                    className="w-full h-full object-contain bg-gray-50 rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                                                                    onClick={() => setLightboxImage(img)}
                                                                />
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

                    {/* Admin Notes */}
                    {parsedInternalNotes && !isCustomer && (
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-4">
                                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-purple-500" />
                                    Internal Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border">
                                    {parsedInternalNotes}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* Technician Assignment */}
                    <Card>
                        <CardHeader className="pb-2 pt-3 px-4">
                            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-600" />
                                Technician Assignment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {service.assigned_technician && !isChangingTech ? (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0 border border-blue-200">
                                            {service.assigned_technician.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                {service.assigned_technician.name}
                                            </p>
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[10px] mt-1 h-5">
                                                {service.assigned_technician.role}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 border-t pt-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                            {service.assigned_technician.phone || 'No phone'}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                                            {service.assigned_technician.email || 'No email'}
                                        </div>
                                    </div>

                                    {service.admin_note && typeof service.admin_note === 'string' && !service.admin_note.startsWith('[') && !service.admin_note.startsWith('{') && (
                                        <div className="bg-amber-50/50 border border-amber-100/50 rounded-lg p-3 space-y-1.5 mt-2">
                                            <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Assignment Instructions</p>
                                            <p className="text-xs text-amber-900 leading-relaxed italic">
                                                "{service.admin_note}"
                                            </p>
                                        </div>
                                    )}

                                    {canChangeTechnician && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full text-xs h-8 border-dashed hover:border-blue-400 hover:text-blue-600"
                                            onClick={() => {
                                                setSelectedTechId(String(service.assigned_technician?.id || ''));
                                                setIsChangingTech(true);
                                            }}
                                        >
                                            Change Technician
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                canChangeTechnician ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-xs text-gray-500">
                                                {isChangingTech ? 'Select a different technician for this request.' : 'Assign a technician to work on this request.'}
                                            </p>
                                            <div className="flex gap-2">
                                                <Select 
                                                    value={selectedTechId} 
                                                    onValueChange={setSelectedTechId}
                                                >
                                                    <SelectTrigger className="w-full h-9 text-xs">
                                                        <SelectValue placeholder="Select Technician" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {technicians.map((tech) => (
                                                            <SelectItem key={tech.id} value={String(tech.id)} className="text-xs">
                                                                {tech.name} ({tech.role})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {isChangingTech && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-9 w-9 text-gray-400"
                                                        onClick={() => setIsChangingTech(false)}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <Button 
                                            className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700" 
                                            onClick={handleAssignTechnician}
                                            disabled={!selectedTechId || isAssigning || (isChangingTech && selectedTechId === String(service.assigned_technician?.id))}
                                        >
                                            {isAssigning ? 'Assigning...' : isChangingTech ? 'Update Assignment' : 'Assign Technician'}
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
                                <Package className="w-4 h-4 text-blue-600" />
                                Parts & Pricing
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {parts.length > 0 || parsedServiceCharges.length > 0 ? (
                                <div className="space-y-3">
                                    {/* Parts and Service Charges list */}
                                    <div className="border rounded-lg overflow-hidden">
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
                                                {parts.map((part, i) => {
                                                    const price = parseFloat(part.price) || 0;
                                                    const qty = part.quantity || 1;
                                                    return (
                                                        <tr key={`part-${i}`} className="border-b last:border-0">
                                                            <td className="px-3 py-2">
                                                                <p className="font-medium text-gray-900 text-xs">{part.name}</p>
                                                                <p className="text-xs text-gray-500">SKU: {part.sku}</p>
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                                                                    {part.status}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-3 py-2 text-center text-xs text-gray-700">{qty}</td>
                                                            <td className="px-3 py-2 text-right text-xs text-gray-700">₹{price.toFixed(2)}</td>
                                                            <td className="px-3 py-2 text-right text-xs font-medium text-gray-900">
                                                                ₹{(price * qty).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {parsedServiceCharges.map((charge, i) => {
                                                    const amount = parseFloat(charge.amount) || 0;
                                                    return (
                                                        <tr key={`sc-${i}`} className="border-b last:border-0 bg-gray-50/50">
                                                            <td className="px-3 py-2">
                                                                <p className="font-medium text-gray-900 text-xs">{charge.name}</p>
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
                                                                    Service Charge
                                                                </Badge>
                                                            </td>
                                                            <td className="px-3 py-2 text-center text-xs text-gray-700">-</td>
                                                            <td className="px-3 py-2 text-right text-xs text-gray-700">₹{amount.toFixed(2)}</td>
                                                            <td className="px-3 py-2 text-right text-xs font-medium text-gray-900">
                                                                ₹{amount.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

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
                            ) : (
                                <p className="text-xs text-gray-500 text-center py-4">No parts or service charges added</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tags */}
                    {tags && (
                        <Card>
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
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
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
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
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
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                        onClick={() => setLightboxImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Full size"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default ViewServiceRequest;
