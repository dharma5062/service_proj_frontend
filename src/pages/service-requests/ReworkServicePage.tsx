import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServiceReopenApi } from '../serviceAPI/ServiceReopenAPI';
import { useProductsApi } from '../serviceAPI/ProductsAPI';
import { useServiceChargesApi } from '../serviceAPI/ServiceChargesAPI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AlertCircle,
    ArrowLeft,
    ShieldCheck,
    FileText,
    CheckCircle2,
    Plus,
    Trash2,
    Loader2,
    BadgeCheck,
    ClipboardList,
    Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/AuthContext';
import { STATUS_STYLES, STATUS_LABELS } from './ViewServiceRequest';
import { ReopenStatusBadge } from '@/components/reopen/ReopenStatusBadge';
import { toast } from 'sonner';

const ReworkServicePage: React.FC = () => {
    const { reopenId } = useParams<{ reopenId: string }>();
    const navigate = useNavigate();
    const { isShopOwner, isSuperAdmin, isShopEmployee } = useAuth();
    const canOwnerAction = isShopOwner || isSuperAdmin;
    const { useGetReworkDetails, useCloseWarrantyCycle, useStartReopenWork, useAddReopenParts, useCompleteReopenWork, useCloseReopenService } = useServiceReopenApi();

    const { data: details, isLoading, isError, error, refetch } = useGetReworkDetails(reopenId);
    const closeWarrantyMutation = useCloseWarrantyCycle();
    const startWorkMutation = useStartReopenWork();
    const addPartsMutation = useAddReopenParts();
    const completeWorkMutation = useCompleteReopenWork();
    const closeServiceMutation = useCloseReopenService();

    // API calls for dropdowns
    const { useGetProducts } = useProductsApi();
    const { useGetServiceCharges } = useServiceChargesApi();
    const { data: productsData } = useGetProducts({ per_page: 100 });
    const { data: serviceChargesData } = useGetServiceCharges();
    const productsList = productsData?.data || [];
    const serviceChargesList = serviceChargesData || [];

    // Add Parts form state
    const [partSearchQuery, setPartSearchQuery] = useState('');
    const [customizeParts, setCustomizeParts] = useState<Array<{ id: string; name: string; quantity: number; price: number, status: string }>>([]);
    const [chargeSearchQuery, setChargeSearchQuery] = useState('');
    const [customizeServiceCharges, setCustomizeServiceCharges] = useState<Array<{ id: string; name: string; amount: number }>>([]);
    const [techNotes, setTechNotes] = useState('');
    const [showAddPartsForm, setShowAddPartsForm] = useState(false);

    if (isLoading) {
        return <div className="p-8 text-center">Loading Rework Details...</div>;
    }

    if (isError || !details) {
        return (
            <div className="p-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
                    Failed to load rework details. {error?.message}
                </div>
                <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
                </Button>
            </div>
        );
    }

    const { reopen_request, original_data, delta, warranty_info, original_invoice, rework_invoice } = details;
    const service = reopen_request.service;
    
    const reopenStatus = reopen_request.reopen_status;
    const isServiceClosed = ['completed', 'cancelled', 'paid', 'warranty_closed'].includes(service.service_status);
    // Show invoice generation section when technician has marked complete (reopen_pending_invoice)
    // OR when there are no billable items (reopen_completed = warranty path).
    // Do NOT show if invoice already exists.
    const isReadyForInvoice = ['reopen_pending_invoice', 'reopen_completed'].includes(reopenStatus) && !rework_invoice;
    const hasWarrantyClosed = service.service_status === 'warranty_closed' || (rework_invoice && rework_invoice.is_warranty_invoice && rework_invoice.status === 'paid');

    const handleCloseWarranty = () => {
        if (!confirm('Are you sure you want to close this service under warranty? No payment will be collected.')) return;
        closeWarrantyMutation.mutate(reopenId!, {
            onSuccess: () => {
                toast.success('Warranty Service Closed Successfully!');
                refetch();
            },
            onError: (err) => {
                toast.error(err.message);
            }
        });
    };

    const handleStartWork = async () => {
        try {
            const res = await startWorkMutation.mutateAsync(reopenId!);
            if (res.status) {
                toast.success('Rework started! You are now in progress.');
                refetch();
            } else {
                toast.error(res.message || 'Failed to start work.');
            }
        } catch (e: any) { toast.error(e.message); }
    };

    const handleSaveParts = async () => {
        const validParts = customizeParts.map(p => ({ name: p.name, quantity: p.quantity, price: p.price }));
        const totalLaborCharge = customizeServiceCharges.reduce((acc, c) => acc + (c.amount || 0), 0);
        const combinedLaborChargeName = customizeServiceCharges.map(c => c.name).join(', ');
        
        if (!validParts.length && !totalLaborCharge) {
            toast.error('Add at least one part or a labor charge.');
            return;
        }
        try {
            const res = await addPartsMutation.mutateAsync({
                reopenId: reopenId!,
                parts: validParts.length ? validParts : undefined,
                labor_charge: totalLaborCharge || undefined,
                labor_charge_name: combinedLaborChargeName || undefined,
            });
            if (res.status) {
                toast.success('Parts/labor added successfully!');
                setCustomizeParts([]);
                setCustomizeServiceCharges([]);
                setShowAddPartsForm(false);
                refetch();
            } else {
                toast.error(res.message || 'Failed to add parts.');
            }
        } catch (e: any) { toast.error(e.message); }
    };

    const handleCompleteWork = async () => {
        if (!techNotes.trim() && !confirm('Submit rework completion without technician notes?')) return;
        try {
            const res = await completeWorkMutation.mutateAsync({ reopenId: reopenId!, notes: techNotes || undefined });
            if (res.status) {
                toast.success(res.message || 'Rework completed!');
                setTechNotes('');
                refetch();
            } else {
                toast.error(res.message || 'Failed to complete rework.');
            }
        } catch (e: any) { toast.error(e.message); }
    };

    const handleCloseService = async () => {
        try {
            const res = await closeServiceMutation.mutateAsync({ reopenId: reopenId! });
            if (res.status) {
                toast.success(res.message || 'Service closed!');
                refetch();
            } else {
                toast.error(res.message || 'Failed to close service.');
            }
        } catch (e: any) { toast.error(e.message); }
    };

    const imageUrls = reopen_request.images?.map(img => 
        img.startsWith('http') ? img : `http://localhost:8000/storage/${img}`
    ) || [];

    return (
        <div className="p-0 max-w-[1400px] mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/dashboard/services/view/${service.id}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            {/* <Wrench className="h-5 w-5 text-blue-600" /> */}
                            Rework Cycle #{reopen_request.reopen_number}
                        </h1>
                        <p className="text-xs text-gray-500">
                            Service Request: SR{String(service.id).padStart(3, '0')}
                        </p>
                    </div>
                </div>
                
                    <div className="flex flex-col items-end gap-2">
                        <Badge className={STATUS_STYLES[service.service_status as keyof typeof STATUS_STYLES] || 'bg-gray-100'}>
                            {STATUS_LABELS[service.service_status as keyof typeof STATUS_LABELS] || service.service_status}
                        </Badge>
                        <ReopenStatusBadge status={reopenStatus} size="sm" showPulseDot />
                    </div>
            </div>

            {hasWarrantyClosed && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                        <span className="font-medium text-green-900 mr-2">Warranty Rework Completed:</span>
                        <span className="text-green-700">This service has been successfully closed under warranty. No payment was required.</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                
                {/* Left Column: Context & Issue */}
                <div className="lg:col-span-1 space-y-4">
                    
                    {/* Issue Report Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="bg-red-50 border-b border-red-100 p-3">
                            <CardTitle className="text-sm flex items-center gap-2 text-red-800">
                                <AlertCircle className="h-4 w-4" />
                                Customer Issue Report
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 space-y-3 text-sm">
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Reported Reason</p>
                                <p className="text-gray-900 whitespace-pre-wrap leading-tight">{reopen_request.reason}</p>
                            </div>
                            
                            {imageUrls.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Proof Images</p>
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {imageUrls.map((url, i) => (
                                            <div 
                                                key={i} 
                                                className="h-12 w-12 rounded-md overflow-hidden border border-gray-200 cursor-pointer flex-shrink-0"
                                                onClick={() => window.open(url, '_blank')}
                                            >
                                                <img src={url} alt={`Proof ${i+1}`} className="h-full w-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Separator className="my-2" />
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Admin Note</p>
                                <p className="text-gray-700 italic leading-tight">{reopen_request.technician_notes || reopen_request.shop_owner_note || 'No note provided'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Warranty Status Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="p-3 pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-blue-600" />
                                Warranty Context
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2 text-sm">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Original Invoice</span>
                                <span className="font-medium">{original_invoice?.invoice_number || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Paid Amount</span>
                                <span className="font-medium text-green-600">
                                    {original_invoice ? `₹${Number(original_invoice.total_amount).toFixed(2)}` : '₹0.00'}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Warranty Expires</span>
                                <span className="font-medium">
                                    {warranty_info.warranty_expiry_date 
                                        ? format(new Date(warranty_info.warranty_expiry_date), 'dd MMM yyyy') 
                                        : 'No date'}
                                </span>
                            </div>
                            
                            <div className="mt-2 bg-blue-50 text-blue-800 text-[11px] p-2 rounded border border-blue-100 leading-tight">
                                Original items covered. Only <strong>new parts/charges</strong> are billable.
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employee Action Panel */}
                    {!isServiceClosed && (
                        <Card className="shadow-sm">
                            <CardHeader className="p-3 pb-2">
                                <CardTitle className="text-sm">Technician Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 space-y-2">
                                {/* Accept & Start Rework */}
                                {reopenStatus === 'reopen_assigned' && isShopEmployee && !isShopOwner && !isSuperAdmin && (
                                    <Button
                                        size="sm"
                                        className="w-full justify-start h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                                        onClick={handleStartWork}
                                        disabled={startWorkMutation.isPending}
                                    >
                                        {startWorkMutation.isPending
                                            ? <><Loader2 className="h-3 w-3 mr-2 animate-spin" />Starting...</>
                                            : <><CheckCircle2 className="h-3 w-3 mr-2" />Accept & Start Rework</>}
                                    </Button>
                                )}

                                {/* Add Parts / Labor — only while actively in-progress */}
                                {reopenStatus === 'reopen_in_progress' && isShopEmployee && !isShopOwner && !isSuperAdmin && (
                                    <Button
                                        size="sm"
                                        className="w-full justify-start h-8 text-xs"
                                        onClick={() => setShowAddPartsForm(v => !v)}
                                    >
                                        <Plus className="h-3 w-3 mr-2" />
                                        {showAddPartsForm ? 'Hide Parts Form' : 'Add Parts / Labor'}
                                    </Button>
                                )}

                                {/* Mark Rework Complete — only shown while in_progress, disappears after clicking */}
                                {reopenStatus === 'reopen_in_progress' && isShopEmployee && !isShopOwner && !isSuperAdmin && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start h-8 text-xs border-green-300 text-green-700 hover:bg-green-50"
                                        onClick={handleCompleteWork}
                                        disabled={completeWorkMutation.isPending}
                                    >
                                        {completeWorkMutation.isPending
                                            ? <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Completing...</>
                                            : <><CheckCircle2 className="h-3 w-3 mr-2" /> Mark Rework Done</>}
                                    </Button>
                                )}

                                {/* Shop Owner: Close Service (after completion or warranty) */}
                                {canOwnerAction && ['reopen_completed', 'reopen_payment_completed'].includes(reopenStatus) && (
                                    <Button
                                        size="sm"
                                        className="w-full justify-start h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                                        onClick={handleCloseService}
                                        disabled={closeServiceMutation.isPending}
                                    >
                                        {closeServiceMutation.isPending
                                            ? <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Closing...</>
                                            : <><BadgeCheck className="h-3 w-3 mr-2" /> Close Service</>}
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start h-8 text-xs"
                                    onClick={() => navigate(`/dashboard/services/view/${service.id}`)}
                                >
                                    <FileText className="h-3 w-3 mr-2" />
                                    View Full Record
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                </div>

                {/* Right Column: Original vs New Items */}
                <div className="lg:col-span-3 space-y-4">
                    
                    {/* Items Overview */}
                    <Card className="shadow-sm">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-lg">Work Summary</CardTitle>
                            <CardDescription className="text-xs">Original covered items vs newly added items</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Covered Items (Original) */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                                    <ShieldCheck className="h-4 w-4 text-gray-400" />
                                    Covered (Original)
                                </h3>
                                <div className="border rounded-md overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-3 py-1.5 text-gray-500 font-medium">Item</th>
                                                <th className="px-3 py-1.5 text-gray-500 font-medium text-right">Qty</th>
                                                <th className="px-3 py-1.5 text-gray-500 font-medium text-right">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y text-gray-500 bg-gray-50/50">
                                            {(!original_data.parts?.length && !original_data.selectedServiceCharges?.length) && (
                                                <tr><td colSpan={3} className="px-3 py-2 text-center italic">No original items.</td></tr>
                                            )}
                                            {original_data.parts?.map((part: any, i: number) => (
                                                <tr key={`p-${i}`}>
                                                    <td className="px-3 py-1.5 flex items-center gap-1.5">
                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-gray-100">Part</Badge> <span className="truncate max-w-[120px]" title={part.name}>{part.name}</span>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right">{part.quantity}</td>
                                                    <td className="px-3 py-1.5 text-right">₹{Number(part.price * part.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            {original_data.selectedServiceCharges?.map((charge: any, i: number) => (
                                                <tr key={`c-${i}`}>
                                                    <td className="px-3 py-1.5 flex items-center gap-1.5">
                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-gray-100">Labor</Badge> <span className="truncate max-w-[120px]" title={charge.name}>{charge.name}</span>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right">1</td>
                                                    <td className="px-3 py-1.5 text-right">₹{Number(charge.amount).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* New Items (Billable) */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    New Additions (Billable)
                                </h3>
                                <div className="border rounded-md overflow-hidden border-amber-200">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-amber-50 border-b border-amber-200">
                                            <tr>
                                                <th className="px-3 py-1.5 text-amber-800 font-medium">Item</th>
                                                <th className="px-3 py-1.5 text-amber-800 font-medium text-right">Qty</th>
                                                <th className="px-3 py-1.5 text-amber-800 font-medium text-right">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y border-amber-100">
                                            {(!delta.new_parts?.length && !delta.new_charges?.length) ? (
                                                <tr><td colSpan={3} className="px-3 py-3 text-center text-gray-500 italic bg-white">No new items added.</td></tr>
                                            ) : (
                                                <>
                                                    {delta.new_parts?.map((part: any, i: number) => (
                                                        <tr key={`np-${i}`} className="bg-white">
                                                            <td className="px-3 py-1.5 flex items-center gap-1.5">
                                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none text-[10px] px-1 py-0 h-4">Part</Badge> 
                                                                <span className="font-medium truncate max-w-[120px]" title={part.name}>{part.name}</span>
                                                            </td>
                                                            <td className="px-3 py-1.5 text-right">{part.quantity}</td>
                                                            <td className="px-3 py-1.5 text-right font-medium">₹{Number(part.price * part.quantity).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                    {delta.new_charges?.map((charge: any, i: number) => (
                                                        <tr key={`nc-${i}`} className="bg-white">
                                                            <td className="px-3 py-1.5 flex items-center gap-1.5">
                                                                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none text-[10px] px-1 py-0 h-4">Labor</Badge> 
                                                                <span className="font-medium truncate max-w-[120px]" title={charge.name}>{charge.name}</span>
                                                            </td>
                                                            <td className="px-3 py-1.5 text-right">1</td>
                                                            <td className="px-3 py-1.5 text-right font-medium">₹{Number(charge.amount).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-amber-50/50">
                                                        <td colSpan={2} className="px-3 py-2 text-right font-bold text-amber-900 text-xs">Total:</td>
                                                        <td className="px-3 py-2 text-right font-bold text-amber-900 text-sm">₹{delta.new_total.toFixed(2)}</td>
                                                    </tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inline Add Parts / Labor Form — only while in_progress */}
                    {showAddPartsForm && reopenStatus === 'reopen_in_progress' && (
                        <Card className="border-indigo-200 shadow-sm">
                            <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 p-3">
                                <CardTitle className="text-sm text-indigo-900 flex items-center gap-2">
                                    <Plus className="h-4 w-4" /> Add New Parts / Labor
                                </CardTitle>
                                <CardDescription className="text-xs">Only new items will be billed. Original parts are warranty-covered.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
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
                                            {productsList
                                                .filter((p: any) => p.name.toLowerCase().includes(partSearchQuery.toLowerCase()))
                                                .slice(0, 10)
                                                .map((p: any) => (
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
                                            {serviceChargesList
                                                .filter((c: any) => c.name.toLowerCase().includes(chargeSearchQuery.toLowerCase()))
                                                .map((c: any) => (
                                                    <div key={c.id} className="flex justify-between items-center p-1.5 text-xs hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onClick={() => {
                                                        if (!customizeServiceCharges.find(sc => sc.id === c.id.toString())) {
                                                            setCustomizeServiceCharges([...customizeServiceCharges, { id: c.id.toString(), name: c.name, amount: Number(c.amount) }]);
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
                                                    <input type="number" min="0" placeholder="₹" className="w-12 h-5 border rounded text-center text-[10px]" value={charge.amount === 0 ? '' : charge.amount} onChange={(e) => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        setCustomizeServiceCharges(customizeServiceCharges.map(sc => sc.id === charge.id ? { ...sc, amount: val } : sc));
                                                    }} />
                                                    <button onClick={() => setCustomizeServiceCharges(customizeServiceCharges.filter(sc => sc.id !== charge.id))} className="p-0.5 hover:bg-red-50 rounded"><Trash2 className="h-3 w-3 text-red-500" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setShowAddPartsForm(false)}>Cancel</Button>
                                    <Button size="sm" className="text-xs h-7 bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveParts} disabled={addPartsMutation.isPending}>
                                        {addPartsMutation.isPending ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Saving...</> : 'Save Parts'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Technician Work Notes — only while actively working (disappears after Mark Complete) */}
                    {reopenStatus === 'reopen_in_progress' && isShopEmployee && !isShopOwner && !isSuperAdmin && (
                        <Card className="border-green-200 shadow-sm">
                            <CardHeader className="bg-green-50/50 border-b border-green-100 p-3">
                                <CardTitle className="text-sm text-green-900 flex items-center gap-2">
                                    <ClipboardList className="h-4 w-4" /> Technician Work Notes
                                </CardTitle>
                                <CardDescription className="text-xs">Add notes before marking work as done.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                                <textarea
                                    value={techNotes}
                                    onChange={e => setTechNotes(e.target.value)}
                                    placeholder="Describe what was done, what was found, what parts were replaced..."
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs min-h-[80px] resize-none outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        size="sm"
                                        className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white px-5"
                                        onClick={handleCompleteWork}
                                        disabled={completeWorkMutation.isPending}
                                    >
                                        {completeWorkMutation.isPending
                                            ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Processing...</>
                                            : <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Mark Rework Complete</>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Invoice Generation / Closure Section */}
                    {isReadyForInvoice && (
                        <Card className="border-blue-200 shadow-sm">
                            <CardHeader className="bg-blue-50/50 border-b border-blue-100 p-3">
                                <CardTitle className="text-sm text-blue-900">Rework Completion</CardTitle>
                                <CardDescription className="text-xs">Service completed. Generate final invoice.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4">
                                {delta.is_warranty_only ? (
                                    <div className="bg-white border border-gray-200 rounded p-3 text-center flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 text-left">
                                            <ShieldCheck className="h-8 w-8 text-green-500" />
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900">₹0 Warranty Completion</h3>
                                                <p className="text-xs text-gray-600">Generates invoice & marks as warranty-closed.</p>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={() => navigate(`/dashboard/invoice/service/${service.id}`)}>
                                            Generate Warranty Invoice
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="bg-white border border-gray-200 rounded p-3 text-center flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 text-left">
                                            <AlertCircle className="h-8 w-8 text-blue-500" />
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900">Billable Rework</h3>
                                                <p className="text-xs text-gray-600">New items total: <strong>₹{delta.new_total.toFixed(2)}</strong></p>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={() => navigate(`/dashboard/invoice/service/${service.id}`)}>
                                            Generate Rework Invoice
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Warranty Close Action (If invoice generated and is ₹0) */}
                    {rework_invoice && rework_invoice.is_warranty_invoice && !hasWarrantyClosed && (
                         <Card className="border-green-200 shadow-sm">
                            <CardHeader className="bg-green-50/50 border-b border-green-100 p-3">
                                <CardTitle className="text-sm text-green-900 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Warranty Invoice Generated
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-xs text-gray-600 text-left">
                                    ₹0 warranty invoice ({rework_invoice.invoice_number}) generated. Close this cycle.
                                </p>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/invoice/view/${rework_invoice.id}`)}>
                                        View Invoice
                                    </Button>
                                    <Button size="sm" onClick={handleCloseWarranty} className="bg-green-600 hover:bg-green-700" disabled={closeWarrantyMutation.isPending}>
                                        {closeWarrantyMutation.isPending ? 'Closing...' : 'Close Warranty'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Payment Pending Action (If invoice generated and >₹0) */}
                    {rework_invoice && !rework_invoice.is_warranty_invoice && !['paid', 'cancelled'].includes(rework_invoice.status) && (
                         <Card className="border-amber-200 shadow-sm">
                            <CardHeader className="bg-amber-50/50 border-b border-amber-100 p-3">
                                <CardTitle className="text-sm text-amber-900 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Awaiting Payment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-xs text-gray-600 text-left">
                                    Rework invoice ({rework_invoice.invoice_number}) for <strong>₹{Number(rework_invoice.total_amount).toFixed(2)}</strong> sent.
                                </p>
                                <Button size="sm" onClick={() => navigate(`/dashboard/invoice/view/${rework_invoice.id}`)}>
                                    Collect Payment
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                </div>
            </div>

        </div>
    );
};

export default ReworkServicePage;
