import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { useInvoiceApi } from '@/pages/serviceAPI/InvoiceAPI';
import { useServiceRequestsApi } from '@/pages/serviceAPI/ServiceRequestsAPI';
import { useSendCashOtp, useVerifyCashOtp } from '@/pages/serviceAPI/PaymentAPI';
import { useServiceReopenApi } from '@/pages/serviceAPI/ServiceReopenAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitReopenModal } from '@/pages/service-requests/SubmitReopenModal';
import {
    ArrowLeft,
    Send,
    RefreshCw,
    Clock,
    Printer,
    CheckCircle2,
    MapPin,
    Phone,
    Mail,
    Wrench,
    Package,
    Hash,
    CalendarDays,
    ShieldCheck,
    CreditCard,
    Sparkles,
    Banknote,
    KeyRound,
    MailCheck,
    X,
    AlertCircle,
    Loader2,
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

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    paid:      { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'PAID' },
    sent:      { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500',    label: 'SENT' },
    draft:     { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400',   label: 'DRAFT' },
    cancelled: { bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500',     label: 'CANCELLED' },
};

const getStatusStyle = (status: string) =>
    STATUS_STYLES[status] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-400', label: status?.toUpperCase() };

// ── Cash Confirmation Modal ──────────────────────────────────────────────────

interface CashConfirmModalProps {
  isOpen: boolean;
  amount: number;
  currency: string;
  shopName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CashConfirmModal = ({
  isOpen,
  amount,
  currency,
  shopName,
  onConfirm,
  onCancel,
  isLoading,
}: CashConfirmModalProps) => {
  if (!isOpen) return null;

  const currencySymbol = currency === 'INR' ? '₹' : currency + ' ';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Banknote className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Cash Payment</p>
                <p className="text-xs text-emerald-100">Confirmation required</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Amount highlight */}
          <div className="text-center py-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-xs text-emerald-600 font-medium mb-1">Amount to Pay at Shop</p>
            <p className="text-3xl font-black text-emerald-700">
              {currencySymbol}{Number(amount).toFixed(2)}
            </p>
          </div>

          {/* Shop info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Pay in person at <strong className="text-gray-800">{shopName}</strong></span>
          </div>

          {/* Info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800">How this works:</p>
                <ul className="text-xs text-amber-700 mt-1 space-y-1 list-disc list-inside">
                  <li>Visit the shop and hand over the cash</li>
                  <li>Shop staff will generate a verification OTP on your payment screen</li>
                  <li>Share the OTP with the staff to complete payment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-10 text-sm rounded-xl border-gray-200"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-10 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={onConfirm}
            disabled={isLoading}
            id="confirm-cash-at-shop"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Processing...</>
            ) : (
              'Yes, Pay at Shop →'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const InvoiceGenerator = () => {
    const navigate = useNavigate();
    const { serviceId, invoiceId } = useParams<{ serviceId?: string, invoiceId?: string }>();
    const { isShopOwner, isSuperAdmin, isCustomer } = useAuth();

    const canGenerate = isShopOwner || isSuperAdmin;

    const { useGetServiceRequestById } = useServiceRequestsApi();
    const { useGetInvoiceById, useGenerateInvoice, useResendInvoice } = useInvoiceApi();
    const { useGetReopenRequests } = useServiceReopenApi();

    const { data: directInvoice, isLoading: directInvoiceLoading, refetch: refetchDirectInvoice } = useGetInvoiceById(
        invoiceId ? Number(invoiceId) : undefined
    );

    const targetServiceId = serviceId ? Number(serviceId) : directInvoice?.service_id;

    const { data: pendingReopens } = useGetReopenRequests({ 
        service_id: targetServiceId, 
        status: 'pending' 
    });
    const hasPendingReopen = (pendingReopens?.data?.length ?? 0) > 0;

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
    const [warrantyDays, setWarrantyDays] = useState('');
    const [currency] = useState('INR');

    // ─── Payment state ─────────────────────────────────────────────────────────
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [gateway, setGateway] = useState<'razorpay' | 'cashfree' | 'cash_in_hand'>('razorpay');
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [showCashModal, setShowCashModal] = useState(false);

    // ─── Reopen Modal state ──────────────────────────────────────────────
    const [reopenModalOpen, setReopenModalOpen] = useState(false);

    // ─── OTP state (cash in hand) ──────────────────────────────────────────────
    const [otpSent, setOtpSent] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
    const [, setGeneratedOtp] = useState<string | null>(null);

    const displayInvoiceForOtp = (invoice ?? (service as any)?.invoice ?? null);
    const sendOtpMutation    = useSendCashOtp(displayInvoiceForOtp?.id);
    const verifyOtpMutation  = useVerifyCashOtp(displayInvoiceForOtp?.id);

    const handleSendOtp = async () => {
        if (!displayInvoiceForOtp?.id) return;
        try {
            const res = await sendOtpMutation.mutateAsync();
            if (res.status) {
                toast.success(res.message || 'OTP sent to customer email!');
                setOtpSent(true);
                setOtpExpiresAt(res.expires_at ?? null);
                setGeneratedOtp(res.otp ?? null);
                setOtpValue('');
            } else {
                toast.error(res.message || 'Failed to send OTP.');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send OTP.');
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpValue || otpValue.length !== 6) {
            toast.error('Please enter the 6-digit OTP.');
            return;
        }
        try {
            const res = await verifyOtpMutation.mutateAsync(otpValue);
            if (res.status) {
                toast.success('✅ ' + (res.message || 'Payment verified! Invoice marked as paid.'));
                setOtpSent(false);
                setOtpValue('');
                setPaymentSuccess(true);
                refetchInvoice();
            } else {
                toast.error(res.message || 'OTP verification failed.');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'OTP verification failed.');
        }
    };

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
                    warranty_days: warrantyDays ? parseInt(warrantyDays, 10) : undefined,
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
    const executeCashPayment = async () => {
        const payToken = displayInvoice?.pay_token;
        if (!payToken || !displayInvoice) return;

        setIsPaying(true);
        try {
            const axiosInstance = (await import('@/lib/axiosInstance')).default;
            const initiateRes = await axiosInstance.post('/pay/initiate', { token: payToken, gateway: 'cash_in_hand' });
            const initData = initiateRes.data;

            if (!initData?.status) {
                toast.error(initData?.message || 'Failed to initiate payment.');
                setIsPaying(false);
                setShowCashModal(false);
                return;
            }

            toast.success(initData?.message || 'Cash payment request recorded. Visit the shop to complete your payment.');
            setPaymentSuccess(true);
            setPaymentOpen(false);
            setShowCashModal(false);
            refetchInvoice();
            setIsPaying(false);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to initiate payment.');
            setIsPaying(false);
            setShowCashModal(false);
        }
    };

    const handlePay = async () => {
        const payToken = displayInvoice?.pay_token;
        if (!payToken || !displayInvoice) return;

        if (gateway === 'cash_in_hand') {
            setShowCashModal(true);
            return;
        }

        setIsPaying(true);
        try {
            const axiosInstance = (await import('@/lib/axiosInstance')).default;
            const initiateRes = await axiosInstance.post('/pay/initiate', { token: payToken, gateway });
            const initData = initiateRes.data;

            if (!initData?.status) {
                toast.error(initData?.message || 'Failed to initiate payment.');
                setIsPaying(false);
                return;
            }

            if (gateway === 'razorpay') {
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
                    theme: { color: '#1F80FF' },
                    modal: { ondismiss: () => setIsPaying(false) },
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.on('payment.failed', (response: any) => {
                    toast.error(response.error?.description || 'Payment failed.');
                    setIsPaying(false);
                });
                rzp.open();

            } else if (gateway === 'cashfree') {
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="relative w-14 h-14 mx-auto">
                        <div className="w-14 h-14 border-4 border-blue-100 rounded-full" />
                        <div className="absolute inset-0 w-14 h-14 border-4 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-700">Loading Invoice</p>
                        <p className="text-xs text-gray-400 mt-0.5">Please wait a moment...</p>
                    </div>
                </div>
            </div>
        );
    }

    const displayInvoice = invoice ?? existingInvoice;
    const statusStyle = displayInvoice ? getStatusStyle(displayInvoice.status) : null;
    const pendingCashPayment = displayInvoice?.payments?.find((p: any) => p.gateway === 'cash_in_hand' && p.status === 'pending');

    const canCustomerPay =
        isCustomer &&
        displayInvoice?.status === 'sent' &&
        !!displayInvoice?.pay_token &&
        !pendingCashPayment;

    return (
        <>
            {/* Cash Confirmation Modal */}
            <CashConfirmModal
                isOpen={showCashModal}
                amount={Number(displayInvoice?.total_amount || 0)}
                currency={displayInvoice?.currency || 'INR'}
                shopName={displayInvoice?.shop?.name || 'the service center'}
                onConfirm={executeCashPayment}
                onCancel={() => setShowCashModal(false)}
                isLoading={isPaying}
            />

            {/* Submit Reopen Modal */}
            {service && (
                <SubmitReopenModal
                    open={reopenModalOpen}
                    onOpenChange={setReopenModalOpen}
                    serviceId={service.id}
                    warrantyExpiryDate={displayInvoice?.warranty_days ? new Date(new Date(displayInvoice.created_at).getTime() + displayInvoice.warranty_days * 24 * 60 * 60 * 1000).toISOString() : undefined}
                />
            )}
        <div className="max-w-4xl mx-auto p-2 md:p-4 space-y-4">

            {/* ── Top Toolbar ── */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors group"
                        id="back-btn"
                    >
                        <div className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center group-hover:border-gray-400 group-hover:bg-gray-50 transition-all">
                            <ArrowLeft className="w-3.5 h-3.5" />
                        </div>
                        Back
                    </button>
                    <div className="h-5 w-px bg-gray-200" />
                    <h1 className="text-base font-bold text-gray-800 tracking-tight">
                        {hasInvoice ? 'Invoice Detail' : 'Create Invoice'}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    {statusStyle && displayInvoice && (
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold tracking-wider ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                            {statusStyle.label}
                        </div>
                    )}
                    {isCustomer && displayInvoice?.status === 'paid' && (
                        <button
                            onClick={() => {
                                if (hasPendingReopen) {
                                    toast.info('Your issue report has been submitted waiting for shop owner approval.');
                                } else {
                                    setReopenModalOpen(true);
                                }
                            }}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-all shadow-sm"
                        >
                            <AlertCircle className="w-3.5 h-3.5" />
                            Report Issue
                        </button>
                    )}
                    <button
                        id="print-invoice-btn"
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-600 hover:text-gray-900 text-xs font-semibold transition-all shadow-sm"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        Print / PDF
                    </button>
                </div>
            </div>

            {/* ── Service Not Completed Warning ── */}
            {service && !isCompleted && !hasInvoice && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 print:hidden">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Service Not Yet Completed</p>
                        <p className="text-xs text-amber-600 mt-0.5">Invoices can only be generated after the service is marked as completed.</p>
                    </div>
                </div>
            )}

            {/* ── Payment Success Banner ── */}
            {paymentSuccess && (
                <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 print:hidden animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-emerald-800">Payment Successful! 🎉</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                            Invoice {displayInvoice?.invoice_number} has been paid. Thank you for your business!
                        </p>
                    </div>
                </div>
            )}

            {/* ══ MAIN INVOICE DOCUMENT ══ */}
            {service && (
                <div
                    id="invoice-document"
                    className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none"
                >
                    {/* ── Invoice Header Strip ── */}
                    <div className="relative print:static">
                        {/* Blue gradient header bar (screen only) */}
                        <div className="print:hidden bg-gradient-to-r from-[#1F80FF] to-[#0055cc] px-6 pt-5 pb-14">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center font-black text-white text-lg border border-white/30">
                                        F
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-extrabold text-white tracking-tight leading-tight">wFixma</h2>
                                        <p className="text-xs text-blue-200 font-medium">Device Repair Services</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.2em]">Invoice</p>
                                    <p className="font-mono text-white font-bold text-base mt-0.5">
                                        {displayInvoice?.invoice_number || <span className="text-yellow-300 italic text-sm">DRAFT PREVIEW</span>}
                                    </p>
                                    <p className="text-blue-200 text-[11px] mt-1">
                                        {formatDate(displayInvoice?.created_at || new Date().toISOString())}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Print-only clean header */}
                        <div className="hidden print:flex print:items-start print:justify-between print:px-0 print:py-0 print:pb-4 print:border-b-2 print:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 border-2 border-gray-800 rounded-lg flex items-center justify-center font-bold text-gray-900 text-lg">
                                    F
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">wFixma</h2>
                                    <p className="text-xs text-gray-500">Device Repair Services</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Invoice</p>
                                <p className="font-mono text-gray-900 font-bold text-base mt-0.5">
                                    {displayInvoice?.invoice_number || 'DRAFT PREVIEW'}
                                </p>
                                <p className="text-gray-500 text-[11px] mt-0.5">
                                    Issued: {formatDate(displayInvoice?.created_at || new Date().toISOString())}
                                </p>
                            </div>
                        </div>

                        {/* ── Info Cards overlapping header (screen only) ── */}
                        <div className="print:hidden relative -mt-8 mx-4 mb-4">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {[
                                    { icon: <Hash className="w-3.5 h-3.5" />, label: 'Invoice No', value: displayInvoice?.invoice_number || 'Pending', color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { icon: <CalendarDays className="w-3.5 h-3.5" />, label: 'Issue Date', value: new Date(displayInvoice?.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), color: 'text-purple-600', bg: 'bg-purple-50' },
                                    { icon: <Wrench className="w-3.5 h-3.5" />, label: 'Service Ref', value: `SR #${service.id}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    { icon: <Package className="w-3.5 h-3.5" />, label: 'Device', value: service.product?.name ?? service.brand?.name ?? '—', color: 'text-orange-600', bg: 'bg-orange-50' },
                                    { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Warranty', value: displayInvoice?.warranty_days ? `${displayInvoice.warranty_days} Days` : 'None', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                ].map(({ icon, label, value, color, bg }) => (
                                    <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-lg ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
                                            {icon}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                                            <p className="text-xs font-bold text-gray-800 truncate mt-0.5">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="px-5 pb-5 space-y-5 print:px-0 print:pb-0 print:pt-4 print:space-y-4">

                        {/* ── Billing Parties ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-8">
                            {/* Billed To */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 print:bg-transparent print:border-none print:rounded-none print:p-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2 print:mb-1.5">
                                    Billed To
                                </p>
                                <p className="text-sm font-bold text-gray-900">{service.customer?.name ?? '—'}</p>
                                {service.customer?.email && (
                                    <div className="flex items-center gap-1.5 mt-1.5 print:mt-1">
                                        <Mail className="w-3 h-3 text-gray-400 flex-shrink-0 print:hidden" />
                                        <p className="text-xs text-gray-600">{service.customer.email}</p>
                                    </div>
                                )}
                                {service.customer?.phone && (
                                    <div className="flex items-center gap-1.5 mt-1 print:mt-0.5">
                                        <Phone className="w-3 h-3 text-gray-400 flex-shrink-0 print:hidden" />
                                        <p className="text-xs text-gray-600">{service.customer.phone}</p>
                                    </div>
                                )}
                                {service.customer?.address && (
                                    <div className="flex items-start gap-1.5 mt-1 print:mt-0.5">
                                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5 print:hidden" />
                                        <p className="text-xs text-gray-500">{service.customer.address}</p>
                                    </div>
                                )}
                            </div>

                            {/* Service Reference */}
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 print:bg-transparent print:border-none print:rounded-none print:p-0 print:text-right">
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.15em] mb-2 print:text-gray-400 print:mb-1.5">
                                    Service Reference
                                </p>
                                <p className="text-sm font-black text-blue-900 print:text-gray-900">SR #{service.id}</p>
                                {service.product?.name && (
                                    <p className="text-xs font-semibold text-blue-700 mt-1 print:text-gray-700">{service.product.name}</p>
                                )}
                                {service.brand?.name && (
                                    <p className="text-xs text-blue-500 mt-0.5 print:text-gray-500">{service.brand.name}</p>
                                )}
                            </div>
                        </div>

                        {/* ── Items Table ── */}
                        <div className="rounded-xl overflow-hidden border border-gray-100 print:border-0 print:border-t print:border-b print:rounded-none">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-gray-800 text-white print:bg-transparent print:text-gray-700 print:border-b print:border-gray-300">
                                        <th className="py-3 px-4 text-left font-bold text-[11px] uppercase tracking-wider print:py-2 print:px-2">Description</th>
                                        <th className="py-3 px-4 text-center font-bold text-[11px] uppercase tracking-wider w-20 print:py-2 print:px-2">Type</th>
                                        <th className="py-3 px-4 text-center font-bold text-[11px] uppercase tracking-wider w-14 print:py-2 print:px-2">Qty</th>
                                        <th className="py-3 px-4 text-right font-bold text-[11px] uppercase tracking-wider w-28 print:py-2 print:px-2">Unit Price</th>
                                        <th className="py-3 px-4 text-right font-bold text-[11px] uppercase tracking-wider w-28 print:py-2 print:px-2">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 print:divide-gray-200">
                                    {parts.length === 0 && charges.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-8 px-4 text-center text-gray-400 italic">
                                                No items added yet.
                                            </td>
                                        </tr>
                                    ) : null}
                                    {parts.map((p: any, i: number) => (
                                        <tr key={`p-${i}`} className="hover:bg-blue-50/30 transition-colors group print:hover:bg-transparent">
                                            <td className="py-3 px-4 print:py-2 print:px-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 print:hidden" />
                                                    <span className="font-semibold text-gray-900">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center print:py-2 print:px-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold print:bg-transparent print:text-gray-600 print:px-0">
                                                    Part
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium text-gray-700 print:py-2 print:px-2">{p.quantity || 1}</td>
                                            <td className="py-3 px-4 text-right text-gray-600 print:py-2 print:px-2">₹{Number(p.price || 0).toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right font-bold text-gray-900 print:py-2 print:px-2">₹{(Number(p.price || 0) * (p.quantity || 1)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {charges.map((c: any, i: number) => (
                                        <tr key={`c-${i}`} className="hover:bg-emerald-50/30 transition-colors group print:hover:bg-transparent">
                                            <td className="py-3 px-4 print:py-2 print:px-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 print:hidden" />
                                                    <span className="font-semibold text-gray-900">{c.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center print:py-2 print:px-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold print:bg-transparent print:text-gray-600 print:px-0">
                                                    Charge
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium text-gray-700 print:py-2 print:px-2">1</td>
                                            <td className="py-3 px-4 text-right text-gray-600 print:py-2 print:px-2">₹{Number(c.amount || 0).toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right font-bold text-gray-900 print:py-2 print:px-2">₹{Number(c.amount || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Footer: Notes + Totals ── */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-5 print:gap-8">

                            {/* Notes Section */}
                            <div className="flex-1 space-y-3">
                                {!hasInvoice && canGenerate && isCompleted && (
                                    <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                                                Notes to Customer
                                            </Label>
                                            <Input
                                                placeholder="E.g. Thank you for your business!"
                                                value={notes}
                                                onChange={e => setNotes(e.target.value)}
                                                className="bg-white border-gray-200 shadow-sm h-8 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                                                Warranty Period (Days)
                                            </Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="E.g. 30"
                                                value={warrantyDays}
                                                onChange={e => setWarrantyDays(e.target.value)}
                                                className="bg-white border-gray-200 shadow-sm h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                )}

                                {(displayInvoice?.notes || (notes && !hasInvoice)) && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-xs text-gray-700 print:bg-transparent print:border-none print:p-0 print:pt-2">
                                        <p className="font-bold text-gray-700 mb-1 print:text-gray-500 print:text-[10px] print:uppercase print:tracking-wider">Notes:</p>
                                        <p className="text-gray-600 leading-relaxed">{displayInvoice?.notes || notes}</p>
                                    </div>
                                )}

                                {/* Print footer note */}
                                <div className="hidden print:block mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-[10px] text-gray-400">Thank you for choosing wFixma Device Repair Services.</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">For queries, contact us at our service center.</p>
                                </div>
                            </div>

                            {/* Totals Summary */}
                            <div className="w-full md:w-72 space-y-2">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2 print:bg-transparent print:border-none print:p-0 print:rounded-none">
                                    {/* Subtotal */}
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span className="font-medium">Subtotal</span>
                                        <span className="font-semibold text-gray-800">₹{subtotal.toFixed(2)}</span>
                                    </div>

                                    {/* Tax input (live preview) */}
                                    {!hasInvoice && canGenerate && isCompleted && (
                                        <div className="flex justify-between items-center print:hidden">
                                            <span className="text-xs text-gray-500">Tax (₹)</span>
                                            <Input
                                                type="number" min="0" step="0.01"
                                                value={taxAmount}
                                                onChange={e => setTaxAmount(e.target.value)}
                                                className="w-24 h-6 text-xs text-right bg-white border-gray-200 shadow-sm px-1.5"
                                            />
                                        </div>
                                    )}

                                    {tax > 0 && (
                                        <div className={`flex justify-between text-xs text-gray-600 ${!hasInvoice ? 'hidden print:flex' : ''}`}>
                                            <span>Tax</span>
                                            <span className="text-indigo-600 font-medium">+₹{tax.toFixed(2)}</span>
                                        </div>
                                    )}

                                    {/* Discount input (live preview) */}
                                    {!hasInvoice && canGenerate && isCompleted && (
                                        <div className="flex justify-between items-center print:hidden">
                                            <span className="text-xs text-gray-500">Discount (₹)</span>
                                            <Input
                                                type="number" min="0" step="0.01"
                                                value={discountAmount}
                                                onChange={e => setDiscountAmount(e.target.value)}
                                                className="w-24 h-6 text-xs text-right bg-white border-gray-200 shadow-sm px-1.5"
                                            />
                                        </div>
                                    )}

                                    {discount > 0 && (
                                        <div className={`flex justify-between text-xs text-gray-600 ${!hasInvoice ? 'hidden print:flex' : ''}`}>
                                            <span>Discount</span>
                                            <span className="text-red-500 font-medium">-₹{discount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    {/* Divider */}
                                    <div className="border-t border-gray-200 pt-2 print:border-gray-800" />

                                    {/* TOTAL */}
                                    <div className="flex justify-between items-center bg-gradient-to-r from-[#1F80FF] to-[#0055cc] text-white px-4 py-3 rounded-xl print:bg-transparent print:rounded-none print:border-t-2 print:border-gray-800 print:px-0 print:text-gray-900">
                                        <span className="font-bold text-xs uppercase tracking-widest print:text-gray-800">Total</span>
                                        <span className="font-black text-xl print:text-gray-900">{formatCurrency(total, currency)}</span>
                                    </div>
                                </div>

                                {/* Payment status badge */}
                                {displayInvoice && (
                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold print:hidden ${statusStyle?.bg} ${statusStyle?.text} ${statusStyle?.border}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${statusStyle?.dot}`} />
                                        {displayInvoice.status === 'paid'
                                            ? 'Payment received — Thank you!'
                                            : displayInvoice.status === 'sent'
                                            ? 'Awaiting customer payment'
                                            : displayInvoice.status === 'draft'
                                            ? 'Invoice not yet sent'
                                            : `Status: ${displayInvoice.status}`
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ ACTIONS SECTION (screen only) ══ */}
            <div className="print:hidden space-y-3">

                {/* Shop Owner / Admin: Resend */}
                {displayInvoice && canGenerate && (
                    <div className="flex justify-end gap-2">
                        {displayInvoice.status !== 'paid' && (
                            <Button
                                id="resend-invoice-btn"
                                size="sm"
                                onClick={handleResend}
                                disabled={resendMutation.isPending}
                                className="bg-[#1F80FF] hover:bg-[#0055cc] text-white font-semibold shadow-sm px-5 h-9 text-xs gap-2 rounded-xl transition-all"
                            >
                                <Send className="w-3.5 h-3.5" />
                                {resendMutation.isPending ? 'Resending...' : 'Resend Invoice Email'}
                            </Button>
                        )}
                    </div>
                )}

                {/* Generate Invoice (Shop Owner, no invoice yet) */}
                {!displayInvoice && canGenerate && !hasInvoice && isCompleted && (
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-gray-200 rounded-xl p-4 shadow-sm gap-3">
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 text-xs">Service Completed</p>
                                <p className="text-[11px] text-gray-400">Ready to generate and send invoice</p>
                            </div>
                        </div>
                        <Button
                            id="generate-invoice-btn"
                            size="sm"
                            onClick={handleGenerate}
                            disabled={generateMutation.isPending || subtotal === 0}
                            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold px-6 shadow-sm h-9 text-xs gap-2 rounded-xl transition-all"
                        >
                            {generateMutation.isPending
                                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                                : <><Sparkles className="w-3.5 h-3.5" /> Generate &amp; Email Invoice</>
                            }
                        </Button>
                    </div>
                )}

                {/* Waiting state */}
                {!canGenerate && !hasInvoice && isCompleted && !isCustomer && (
                    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                        <Clock className="w-7 h-7 mb-2.5 text-gray-300" />
                        <p className="text-sm font-semibold text-gray-500">Waiting for Invoice</p>
                        <p className="text-xs text-gray-400 mt-0.5">The shop owner will issue the invoice shortly.</p>
                    </div>
                )}

                {/* ── Customer: Pending Cash Payment ── */}
                {isCustomer && pendingCashPayment && !paymentSuccess && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-800">Cash Payment Pending</p>
                            <p className="text-xs text-amber-600 mt-0.5">
                                You have selected to pay by cash. Visit the shop and hand the amount to the staff.
                                They will generate a 6-digit OTP on your payment screen — share it with them to confirm payment.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Shop Owner: OTP-Based Cash Verification ── */}
                {canGenerate && pendingCashPayment && displayInvoice?.status === 'sent' && !paymentSuccess && (
                    <div className="bg-white border border-emerald-200 rounded-xl overflow-hidden shadow-sm">

                        {/* Header bar */}
                        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Banknote className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-emerald-900">Cash Payment Pending — OTP Verification Required</p>
                                <p className="text-[10px] text-emerald-600 mt-0.5">
                                    Customer: <strong>{displayInvoice?.customer?.name ?? '—'}</strong> ·
                                    Amount: <strong>
                                        {displayInvoice?.currency === 'INR' ? '₹' : displayInvoice?.currency + ' '}
                                        {Number(displayInvoice?.total_amount ?? 0).toFixed(2)}
                                    </strong>
                                </p>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            {!otpSent ? (
                                /* Step 1: Send OTP */
                                <>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-700">Step 1 — Collect cash from customer</p>
                                        <p className="text-[11px] text-gray-500">
                                            Once you have received the cash, click below to generate a verification OTP on the customer's payment screen.
                                        </p>
                                    </div>
                                    <Button
                                        id="send-cash-otp-btn"
                                        size="sm"
                                        onClick={handleSendOtp}
                                        disabled={sendOtpMutation.isPending}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 text-xs gap-2 rounded-lg transition-all"
                                    >
                                        {sendOtpMutation.isPending
                                            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending OTP...</>
                                            : <><KeyRound className="w-3.5 h-3.5" /> Generate Verification OTP for Customer</>
                                        }
                                    </Button>
                                </>
                            ) : (
                                /* Step 2: Enter OTP */
                                <>
                                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                                        <MailCheck className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-blue-800">OTP generated on customer's payment screen</p>
                                            <p className="text-[10px] text-blue-600 mt-0.5">
                                                Ask the customer to check their payment screen and share the 6-digit code.
                                                {otpExpiresAt && (
                                                    <span className="ml-1 text-amber-600 font-medium">
                                                        · Expires at {new Date(otpExpiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                            <KeyRound className="w-3 h-3 inline mr-1" />Enter 6-Digit OTP from Customer
                                        </Label>
                                        <Input
                                            id="cash-otp-input"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            placeholder="e.g. 4 8 2 9 1 7"
                                            value={otpValue}
                                            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="text-center text-xl font-bold tracking-[0.5em] h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            id="verify-cash-otp-btn"
                                            size="sm"
                                            onClick={handleVerifyOtp}
                                            disabled={verifyOtpMutation.isPending || otpValue.length !== 6}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs gap-2 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            {verifyOtpMutation.isPending
                                                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...</>
                                                : <><ShieldCheck className="w-3.5 h-3.5" /> Verify & Complete Payment</>
                                            }
                                        </Button>
                                        <Button
                                            id="resend-cash-otp-btn"
                                            size="sm"
                                            variant="outline"
                                            onClick={handleSendOtp}
                                            disabled={sendOtpMutation.isPending}
                                            className="h-9 text-xs px-3 rounded-lg border-gray-200 text-gray-600 hover:text-emerald-700 hover:border-emerald-300"
                                        >
                                            {sendOtpMutation.isPending
                                                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                : <><RefreshCw className="w-3.5 h-3.5" /> Resend</>}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Customer: Pay Now ── */}
                {canCustomerPay && !paymentSuccess && (
                    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border-b border-indigo-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                                    <CreditCard className="w-4.5 h-4.5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-indigo-900">Complete Payment</p>
                                    <p className="text-[10px] text-indigo-500 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> 256-bit SSL encrypted
                                    </p>
                                </div>
                            </div>
                            <button
                                id="toggle-payment-section"
                                onClick={() => setPaymentOpen(prev => !prev)}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg transition-all"
                            >
                                {paymentOpen ? 'Hide' : 'Pay Now'}
                            </button>
                        </div>

                        {/* Closed: show amount + CTA */}
                        {!paymentOpen && (
                            <div className="px-5 py-3.5 flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-gray-500">Invoice {displayInvoice.invoice_number}</span>
                                    <div className="flex items-baseline gap-1 mt-0.5">
                                        <span className="text-xs text-gray-500">Amount due:</span>
                                        <span className="text-sm font-black text-gray-900">
                                            {displayInvoice.currency === 'INR' ? '₹' : displayInvoice.currency + ' '}
                                            {Number(displayInvoice.total_amount).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    id="open-payment-section"
                                    onClick={() => setPaymentOpen(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
                                >
                                    Pay Now →
                                </button>
                            </div>
                        )}

                        {/* Expanded: full payment form */}
                        {paymentOpen && (
                            <div className="p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Amount due */}
                                <div className="flex items-center justify-between bg-indigo-50 rounded-xl px-4 py-3.5 border border-indigo-100">
                                    <span className="text-xs font-semibold text-indigo-700">Amount Due</span>
                                    <span className="text-lg font-black text-indigo-900">
                                        {displayInvoice.currency === 'INR' ? '₹' : displayInvoice.currency + ' '}
                                        {Number(displayInvoice.total_amount).toFixed(2)}
                                    </span>
                                </div>

                                {/* Gateway selection */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Payment Method</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        {/* Razorpay */}
                                        <button
                                            id="select-razorpay"
                                            onClick={() => setGateway('razorpay')}
                                            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
                                                gateway === 'razorpay'
                                                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                                    : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${gateway === 'razorpay' ? 'border-indigo-500' : 'border-gray-300'}`}>
                                                {gateway === 'razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Razorpay</p>
                                                <p className="text-[9px] text-gray-400">Cards, UPI, NetBanking</p>
                                            </div>
                                        </button>

                                        {/* Cashfree */}
                                        <button
                                            id="select-cashfree"
                                            onClick={() => setGateway('cashfree')}
                                            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
                                                gateway === 'cashfree'
                                                    ? 'border-orange-500 bg-orange-50 shadow-sm'
                                                    : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${gateway === 'cashfree' ? 'border-orange-500' : 'border-gray-300'}`}>
                                                {gateway === 'cashfree' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Cashfree</p>
                                                <p className="text-[9px] text-gray-400">Cards, UPI, Wallets</p>
                                            </div>
                                        </button>

                                        {/* Cash in Hand */}
                                        <button
                                            id="select-cash_in_hand"
                                            onClick={() => setGateway('cash_in_hand')}
                                            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
                                                gateway === 'cash_in_hand'
                                                    ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                                    : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${gateway === 'cash_in_hand' ? 'border-emerald-500' : 'border-gray-300'}`}>
                                                {gateway === 'cash_in_hand' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Cash in Hand</p>
                                                <p className="text-[9px] text-gray-400">Pay cash at center</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Pay Button */}
                                <button
                                    id="confirm-pay-now"
                                    onClick={handlePay}
                                    disabled={isPaying}
                                    className={`w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
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
                                            Processing Payment...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-4 h-4" />
                                            {gateway === 'cash_in_hand' ? 'Confirm Cash Payment' : (
                                                <>
                                                    Pay {displayInvoice.currency === 'INR' ? '₹' : displayInvoice.currency + ' '}
                                                    {Number(displayInvoice.total_amount).toFixed(2)} via {gateway === 'razorpay' ? 'Razorpay' : 'Cashfree'}
                                                </>
                                            )}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Customer: Already Paid ── */}
                {isCustomer && displayInvoice?.status === 'paid' && (
                    <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-emerald-800">Payment Completed</p>
                            <p className="text-xs text-emerald-600 mt-0.5">This invoice has been fully paid. Thank you for your business!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default InvoiceGenerator;
