import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { useInvoiceApi } from '@/pages/serviceAPI/InvoiceAPI';
import { useServiceRequestsApi } from '@/pages/serviceAPI/ServiceRequestsAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Send,
    RefreshCw,
    Clock,
    Printer,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number, currency = 'INR') => {
    const symbol = currency === 'INR' ? '₹' : currency + ' ';
    return symbol + amount.toFixed(2);
};

const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
};

// ─── Component ────────────────────────────────────────────────────────────────

const InvoiceGenerator = () => {
    const navigate = useNavigate();
    const { serviceId, invoiceId } = useParams<{ serviceId?: string, invoiceId?: string }>();
    const { isShopOwner, isSuperAdmin, isCustomer } = useAuth();

    const canGenerate = isShopOwner || isSuperAdmin;

    const { useGetServiceRequestById } = useServiceRequestsApi();
    const { useGetInvoiceById, useGenerateInvoice, useResendInvoice } = useInvoiceApi();

    const { data: directInvoice, isLoading: directInvoiceLoading, refetch: refetchDirectInvoice } = useGetInvoiceById(
        invoiceId ? Number(invoiceId) : undefined
    );

    const targetServiceId = serviceId ? Number(serviceId) : directInvoice?.service_id;

    const { data: service, isLoading: serviceLoading } = useGetServiceRequestById(
        targetServiceId
    );

    const existingInvoice = (service as any)?.invoice ?? null;

    const { data: serviceInvoice, isLoading: serviceInvoiceLoading, refetch: refetchServiceInvoice } = useGetInvoiceById(
        (!invoiceId && existingInvoice?.id) ? existingInvoice.id : undefined
    );

    const invoice = directInvoice || serviceInvoice;
    const invoiceLoading = directInvoiceLoading || serviceInvoiceLoading;
    const refetchInvoice = invoiceId ? refetchDirectInvoice : refetchServiceInvoice;

    const generateMutation = useGenerateInvoice();
    const resendMutation = useResendInvoice();

    const [taxAmount, setTaxAmount] = useState('0');
    const [discountAmount, setDiscountAmount] = useState('0');
    const [notes, setNotes] = useState('');
    const [currency] = useState('INR');

    // ─── Payment state (customer Pay Now) ─────────────────────────────────────
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [gateway, setGateway] = useState<'razorpay' | 'cashfree'>('razorpay');
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [isPaying, setIsPaying] = useState(false);

    const serviceData = (service?.data as any) ?? {};
    const parts: any[] = Array.isArray(serviceData.parts) ? serviceData.parts : [];
    const charges: any[] = Array.isArray(serviceData.selectedServiceCharges) ? serviceData.selectedServiceCharges : [];

    const partsSubtotal = parts.reduce((s, p) => s + (Number(p.price) || 0) * (p.quantity || 1), 0);
    const chargesSubtotal = charges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const subtotal = partsSubtotal + chargesSubtotal;
    const tax = Number(taxAmount) || 0;
    const discount = Number(discountAmount) || 0;
    const total = subtotal + tax - discount;

    const isCompleted = service?.service_status === 'completed' || service?.status === 'completed';
    const hasInvoice = !!(existingInvoice || invoice);

    const handleGenerate = async () => {
        if (!targetServiceId) return;
        try {
            const res = await generateMutation.mutateAsync({
                serviceId: targetServiceId,
                payload: {
                    tax_amount: tax,
                    discount_amount: discount,
                    notes: notes.trim() || undefined,
                    currency,
                },
            });

            if (res.status) {
                toast.success(`Invoice ${res.data?.invoice_number} generated!`
                    + (res.email_sent ? ' Email sent to customer.' : ''));
                refetchInvoice();
            } else {
                toast.error(res.message || 'Failed to generate invoice');
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to generate invoice');
        }
    };

    const handleResend = async () => {
        const invId = invoice?.id ?? existingInvoice?.id;
        if (!invId) return;
        try {
            const res = await resendMutation.mutateAsync(invId);
            if (res.email_sent) {
                toast.success('Invoice email re-sent to customer!');
            } else {
                toast.warning('Invoice updated. Note: email could not be sent. ' + (res.email_error ?? ''));
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to resend invoice');
        }
    };

    // ─── Customer Pay Now handler ──────────────────────────────────────────────
    const handlePay = async () => {
        const payToken = displayInvoice?.pay_token;
        if (!payToken || !displayInvoice) return;

        setIsPaying(true);
        try {
            // Dynamically import to avoid bundle overhead for non-payment pages
            const axiosInstance = (await import('@/lib/axiosInstance')).default;

            // 1. Initiate payment
            const initiateRes = await axiosInstance.post('/pay/initiate', { token: payToken, gateway });
            const initData = initiateRes.data;

            if (!initData?.status) {
                toast.error(initData?.message || 'Failed to initiate payment.');
                setIsPaying(false);
                return;
            }

            if (gateway === 'razorpay') {
                // 2a. Load Razorpay SDK dynamically
                if (!(window as any).Razorpay) {
                    await new Promise<void>((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                        script.async = true;
                        script.onload = () => resolve();
                        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
                        document.body.appendChild(script);
                    });
                }

                const options = {
                    key: initData.key_id,
                    amount: initData.amount,
                    currency: initData.currency,
                    name: displayInvoice.shop?.name ?? 'Service Center',
                    description: `Invoice ${displayInvoice.invoice_number}`,
                    order_id: initData.order_id,
                    handler: async (response: any) => {
                        try {
                            const verifyRes = await axiosInstance.post('/pay/verify', {
                                token: payToken,
                                gateway: 'razorpay',
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            });
                            if (verifyRes.data?.status) {
                                toast.success('Payment verified successfully!');
                                setPaymentSuccess(true);
                                setPaymentOpen(false);
                                refetchInvoice();
                            } else {
                                toast.error(verifyRes.data?.message || 'Payment verification failed.');
                            }
                        } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Payment verification failed.');
                        } finally {
                            setIsPaying(false);
                        }
                    },
                    prefill: {
                        name: displayInvoice.customer?.name ?? '',
                        email: displayInvoice.customer?.email ?? '',
                        contact: displayInvoice.customer?.phone ?? '',
                    },
                    theme: { color: '#4f46e5' },
                    modal: {
                        ondismiss: () => setIsPaying(false),
                    },
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.on('payment.failed', (response: any) => {
                    toast.error(response.error?.description || 'Payment failed.');
                    setIsPaying(false);
                });
                rzp.open();

            } else if (gateway === 'cashfree') {
                // 2b. Load Cashfree SDK
                // @ts-ignore
                const { load } = await import('@cashfreepayments/cashfree-js');
                const cashfree = await load({
                    mode: initData.env === 'production' ? 'production' : 'sandbox',
                });

                cashfree.checkout({
                    paymentSessionId: initData.payment_session_id,
                    redirectTarget: '_modal',
                }).then(async (result: any) => {
                    if (result.error) {
                        toast.error(result.error.message || 'Payment failed.');
                        setIsPaying(false);
                        return;
                    }
                    if (result.paymentDetails) {
                        try {
                            const verifyRes = await axiosInstance.post('/pay/verify', {
                                token: payToken,
                                gateway: 'cashfree',
                                cashfree_order_id: initData.order_id,
                            });
                            if (verifyRes.data?.status) {
                                toast.success('Payment verified successfully!');
                                setPaymentSuccess(true);
                                setPaymentOpen(false);
                                refetchInvoice();
                            } else {
                                toast.error(verifyRes.data?.message || 'Payment verification failed.');
                            }
                        } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Payment verification failed.');
                        } finally {
                            setIsPaying(false);
                        }
                    }
                });
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to initiate payment.');
            setIsPaying(false);
        }
    };

    if (serviceLoading || invoiceLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-medium text-gray-500">Loading details...</p>
                </div>
            </div>
        );
    }

    const displayInvoice = invoice ?? existingInvoice;

    // Determine if customer can pay: must have a valid pay_token and status === 'sent'
    const canCustomerPay =
        isCustomer &&
        displayInvoice?.status === 'sent' &&
        !!displayInvoice?.pay_token;

    return (
        <div className="max-w-5xl mx-auto p-2 md:p-4 space-y-3">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 h-8 px-2 text-sm">
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                    </Button>
                    <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                        {hasInvoice ? 'Invoice Detail' : 'Create Invoice'}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    {displayInvoice && (
                        <Badge className={`${displayInvoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} hover:bg-opacity-80 px-2 py-0.5 uppercase tracking-widest text-[10px] font-bold border-0 shadow-sm`}>
                            {displayInvoice.status}
                        </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="h-8 border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm text-xs">
                        <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
                    </Button>
                </div>
            </div>

            {/* Warning: service not completed */}
            {service && !isCompleted && !hasInvoice && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800 print:hidden flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <strong className="block font-semibold mb-0.5">Service not completed yet</strong> 
                        Invoices can only be generated after completion.
                    </div>
                </div>
            )}

            {/* Payment Success Banner */}
            {paymentSuccess && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 print:hidden animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-green-800">Payment Successful!</p>
                        <p className="text-xs text-green-600 mt-0.5">
                            Invoice {displayInvoice?.invoice_number} has been paid. Thank you!
                        </p>
                    </div>
                </div>
            )}

            {/* Main Document */}
            {service && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-0 print:rounded-none overflow-hidden">
                    
                    {/* Brand Header */}
                    <div className="bg-slate-50 p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:bg-transparent print:border-b-2 print:border-gray-800 print:p-0 print:pb-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-inner print:border print:border-gray-800 print:text-gray-900 print:bg-transparent">
                                    F
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight">wFixma</h2>
                                    <p className="text-xs text-gray-500 font-medium">Device Repair Services</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-left md:text-right">
                            <h3 className="text-lg font-light text-gray-400 tracking-widest uppercase leading-tight">Invoice</h3>
                            <p className="font-mono text-sm font-semibold text-gray-800 mt-0.5">
                                {displayInvoice?.invoice_number || <span className="text-amber-500 italic text-xs">DRAFT PREVIEW</span>}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                Issued: {formatDate(displayInvoice?.created_at || new Date().toISOString())}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 space-y-4 print:p-0 print:pt-4">
                        {/* Parties Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Billed To</h4>
                                <div className="text-xs text-gray-700 space-y-0.5">
                                    <p className="text-sm font-bold text-gray-900">{service.customer?.name ?? '—'}</p>
                                    {service.customer?.email && <p>{service.customer.email}</p>}
                                    {service.customer?.phone && <p>{service.customer.phone}</p>}
                                    {service.customer?.address && <p className="text-gray-500">{service.customer.address}</p>}
                                </div>
                            </div>
                            <div className="space-y-1.5 text-left md:text-right print:text-right">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service Reference</h4>
                                <div className="text-xs text-gray-700 space-y-0.5">
                                    <p className="text-sm font-bold text-gray-900">SR #{service.id}</p>
                                    <p>{service.product?.name ?? '—'}</p>
                                    {service.brand?.name && <p className="text-gray-500">{service.brand.name}</p>}
                                </div>
                            </div>
                        </div>
                                                        
                        {/* Table */}
                        <div className="border border-gray-100 rounded-lg overflow-hidden print:border-0 print:border-t print:border-b print:rounded-none">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-gray-600 font-medium border-b border-gray-100 text-[11px] uppercase tracking-wider print:bg-transparent">
                                    <tr>
                                        <th className="py-2 px-3">Description</th>
                                        <th className="py-2 px-3 text-center w-20">Type</th>
                                        <th className="py-2 px-3 text-center w-12">Qty</th>
                                        <th className="py-2 px-3 text-right w-24">Price</th>
                                        <th className="py-2 px-3 text-right w-24">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {parts.length === 0 && charges.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-4 px-3 text-center text-gray-400 italic">No items found.</td>
                                        </tr>
                                    ) : null}
                                    {parts.map((p: any, i: number) => (
                                        <tr key={`p-${i}`} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-2 px-3 text-gray-900 font-medium">{p.name}</td>
                                            <td className="py-2 px-3 text-center text-gray-500">Part</td>
                                            <td className="py-2 px-3 text-center text-gray-700">{p.quantity || 1}</td>
                                            <td className="py-2 px-3 text-right text-gray-600">₹{Number(p.price || 0).toFixed(2)}</td>
                                            <td className="py-2 px-3 text-right text-gray-900 font-semibold">₹{(Number(p.price || 0) * (p.quantity || 1)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {charges.map((c: any, i: number) => (
                                        <tr key={`c-${i}`} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-2 px-3 text-gray-900 font-medium">{c.name}</td>
                                            <td className="py-2 px-3 text-center text-gray-500">Charge</td>
                                            <td className="py-2 px-3 text-center text-gray-700">1</td>
                                            <td className="py-2 px-3 text-right text-gray-600">₹{Number(c.amount || 0).toFixed(2)}</td>
                                            <td className="py-2 px-3 text-right text-gray-900 font-semibold">₹{Number(c.amount || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Totals */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div className="w-full md:w-1/2 space-y-2">
                                {/* Live Preview Notes Input */}
                                {!hasInvoice && canGenerate && isCompleted ? (
                                    <div className="print:hidden bg-slate-50 p-3 rounded-lg border border-gray-100">
                                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Notes to Customer</Label>
                                        <Input 
                                            placeholder="E.g. Thank you for your business!" 
                                            value={notes} 
                                            onChange={e => setNotes(e.target.value)} 
                                            className="bg-white border-gray-200 shadow-sm h-7 text-xs"
                                        />
                                    </div>
                                ) : null}

                                {(displayInvoice?.notes || (notes && !hasInvoice)) ? (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-600 print:bg-transparent print:border-none print:p-0">
                                        <span className="font-bold text-gray-700 block mb-0.5">Notes:</span> 
                                        {displayInvoice?.notes || notes}
                                    </div>
                                ) : null}
                            </div>
                            
                            <div className="w-full md:w-64 space-y-1.5">
                                <div className="flex justify-between text-xs text-gray-600 px-2">
                                    <span>Subtotal</span> 
                                    <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
                                </div>
                                
                                {/* Live Preview Tax Input */}
                                {!hasInvoice && canGenerate && isCompleted ? (
                                    <div className="flex justify-between items-center print:hidden px-2">
                                        <span className="text-xs text-gray-600">Tax (₹)</span>
                                        <Input 
                                            type="number" min="0" step="0.01" 
                                            value={taxAmount} 
                                            onChange={e => setTaxAmount(e.target.value)} 
                                            className="w-20 h-6 text-xs text-right bg-slate-50 border-gray-200 shadow-sm px-1.5" 
                                        />
                                    </div>
                                ) : null}
                                
                                {tax > 0 && (
                                    <div className={`flex justify-between text-xs text-gray-600 px-2 ${!hasInvoice ? 'hidden print:flex' : ''}`}>
                                        <span>Tax</span> <span>₹{tax.toFixed(2)}</span>
                                    </div>
                                )}

                                {/* Live Preview Discount Input */}
                                {!hasInvoice && canGenerate && isCompleted ? (
                                    <div className="flex justify-between items-center print:hidden px-2">
                                        <span className="text-xs text-gray-600">Discount (₹)</span>
                                        <Input 
                                            type="number" min="0" step="0.01" 
                                            value={discountAmount} 
                                            onChange={e => setDiscountAmount(e.target.value)} 
                                            className="w-20 h-6 text-xs text-right bg-slate-50 border-gray-200 shadow-sm px-1.5" 
                                        />
                                    </div>
                                ) : null}
                                
                                {discount > 0 && (
                                    <div className={`flex justify-between text-xs text-gray-600 px-2 ${!hasInvoice ? 'hidden print:flex' : ''}`}>
                                        <span>Discount</span> <span className="text-red-500 font-medium">-₹{discount.toFixed(2)}</span>
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-center bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-100 mt-2 print:bg-transparent print:border-t-2 print:border-gray-800 print:rounded-none print:px-0">
                                    <span className="font-bold text-xs uppercase tracking-wider">Total</span> 
                                    <span className="font-black text-lg">{formatCurrency(total, currency)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions Footer */}
            <div className="print:hidden">
                {/* ── Shop Owner / Admin Actions ── */}
                {displayInvoice && canGenerate && (
                    <div className="flex justify-end gap-2">
                        {displayInvoice.status !== 'paid' && (
                            <Button size="sm" onClick={handleResend} disabled={resendMutation.isPending} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm px-4 h-8 text-xs">
                                <Send className="w-3.5 h-3.5 mr-1.5" /> {resendMutation.isPending ? 'Resending...' : 'Resend Email'}
                            </Button>
                        )}
                    </div>
                )}

                {/* ── Generate Invoice (Shop Owner, no invoice yet) ── */}
                {!displayInvoice && canGenerate && !hasInvoice && isCompleted && (
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm gap-3 mt-2">
                        <div className="text-xs text-gray-500 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Ready to finalize.
                        </div>
                        <Button size="sm" onClick={handleGenerate} disabled={generateMutation.isPending || subtotal === 0} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold px-6 shadow-sm h-8 text-xs">
                            {generateMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                            Generate & Email Invoice
                        </Button>
                    </div>
                )}

                {/* ── Waiting state (no invoice yet, not shop owner) ── */}
                {!canGenerate && !hasInvoice && isCompleted && !isCustomer && (
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg mt-2">
                        <Clock className="w-6 h-6 mb-2 text-slate-300" />
                        <p className="text-xs text-slate-500 font-medium">Waiting for shop owner to issue invoice.</p>
                    </div>
                )}

                {/* ── Customer: Pay Now Section ── */}
                {canCustomerPay && !paymentSuccess && (
                    <div className="mt-3 bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-indigo-900">Complete Payment</p>
                                    <p className="text-[10px] text-indigo-500">Secure payments via 256-bit SSL</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPaymentOpen(prev => !prev)}
                                className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors"
                                id="toggle-payment-section"
                            >
                                {paymentOpen ? 'Hide' : 'Pay Now'}
                            </button>
                        </div>

                        {/* Collapsible Payment Body */}
                        {paymentOpen && (
                            <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                {/* Amount due */}
                                <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-4 py-3">
                                    <span className="text-xs font-semibold text-indigo-700">Amount Due</span>
                                    <span className="text-lg font-black text-indigo-900">
                                        {displayInvoice.currency === 'INR' ? '₹' : displayInvoice.currency + ' '}
                                        {Number(displayInvoice.total_amount).toFixed(2)}
                                    </span>
                                </div>

                                {/* Gateway selection */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Payment Method</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Razorpay */}
                                        <button
                                            id="select-razorpay"
                                            onClick={() => setGateway('razorpay')}
                                            className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                                                gateway === 'razorpay'
                                                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                                    : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${gateway === 'razorpay' ? 'border-indigo-500' : 'border-gray-300'}`}>
                                                {gateway === 'razorpay' && <div className="w-3 h-3 rounded-full bg-indigo-500" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Razorpay</p>
                                                <p className="text-[9px] text-gray-500 leading-tight">Cards, UPI, NetBanking</p>
                                            </div>
                                        </button>

                                        {/* Cashfree */}
                                        <button
                                            id="select-cashfree"
                                            onClick={() => setGateway('cashfree')}
                                            className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                                                gateway === 'cashfree'
                                                    ? 'border-orange-500 bg-orange-50 shadow-sm'
                                                    : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${gateway === 'cashfree' ? 'border-orange-500' : 'border-gray-300'}`}>
                                                {gateway === 'cashfree' && <div className="w-3 h-3 rounded-full bg-orange-500" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Cashfree</p>
                                                <p className="text-[9px] text-gray-500 leading-tight">Cards, UPI, Wallets</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Pay Button */}
                                <button
                                    id="confirm-pay-now"
                                    onClick={handlePay}
                                    disabled={isPaying}
                                    className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                                        isPaying
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg active:scale-[0.98]'
                                    }`}
                                >
                                    {isPaying ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            Pay {displayInvoice.currency === 'INR' ? '₹' : displayInvoice.currency + ' '}
                                            {Number(displayInvoice.total_amount).toFixed(2)} via {gateway === 'razorpay' ? 'Razorpay' : 'Cashfree'}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Closed state: show the Pay Now CTA button */}
                        {!paymentOpen && (
                            <div className="px-4 py-3 flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    Invoice {displayInvoice.invoice_number} — Amount due:{' '}
                                    <strong className="text-gray-800">
                                        {displayInvoice.currency === 'INR' ? '₹' : displayInvoice.currency + ' '}
                                        {Number(displayInvoice.total_amount).toFixed(2)}
                                    </strong>
                                </span>
                                <button
                                    id="open-payment-section"
                                    onClick={() => setPaymentOpen(true)}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                >
                                    Pay Now
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Customer: Already Paid ── */}
                {isCustomer && displayInvoice?.status === 'paid' && (
                    <div className="mt-3 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-green-800">Payment Completed</p>
                            <p className="text-[10px] text-green-600">This invoice has been paid. Thank you!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceGenerator;
