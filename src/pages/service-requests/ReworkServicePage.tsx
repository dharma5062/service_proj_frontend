import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServiceReopenApi } from '../serviceAPI/ServiceReopenAPI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
    AlertCircle, 
    ArrowLeft, 
    Wrench, 
    ShieldCheck, 
    FileText, 
    CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/AuthContext';
import { STATUS_STYLES, STATUS_LABELS } from './ViewServiceRequest';

const ReworkServicePage: React.FC = () => {
    const { reopenId } = useParams<{ reopenId: string }>();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const { useGetReworkDetails, useCloseWarrantyCycle } = useServiceReopenApi();

    const { data: details, isLoading, isError, error, refetch } = useGetReworkDetails(reopenId);
    const closeWarrantyMutation = useCloseWarrantyCycle();

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
    
    const canUpdateService = hasPermission('service.update');
    const isServiceClosed = ['completed', 'cancelled', 'paid', 'warranty_closed'].includes(service.service_status);
    const isReadyForInvoice = service.service_status === 'completed' && !rework_invoice;
    const hasWarrantyClosed = service.service_status === 'warranty_closed' || (rework_invoice && rework_invoice.is_warranty_invoice && rework_invoice.status === 'paid');

    const handleCloseWarranty = () => {
        if (!confirm('Are you sure you want to close this service under warranty? No payment will be collected.')) return;
        closeWarrantyMutation.mutate(reopenId!, {
            onSuccess: () => {
                alert('Warranty Service Closed Successfully!');
                refetch();
            },
            onError: (err) => {
                alert(err.message);
            }
        });
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
                            <Wrench className="h-5 w-5 text-blue-600" />
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
                                <p className="text-xs font-medium text-gray-500 mb-1">Shop Owner Note</p>
                                <p className="text-gray-700 italic leading-tight">{reopen_request.shop_owner_note || 'No note provided'}</p>
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

                    {/* Actions Panel */}
                    {!isServiceClosed && (
                        <Card className="shadow-sm">
                            <CardHeader className="p-3 pb-2">
                                <CardTitle className="text-sm">Technician Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 space-y-2">
                                {canUpdateService && (
                                    <Button 
                                        size="sm"
                                        className="w-full justify-start h-8 text-xs" 
                                        onClick={() => navigate(`/dashboard/services/edit/${service.id}`)}
                                    >
                                        <Wrench className="h-3 w-3 mr-2" />
                                        Update Work / Add Parts
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
