import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { useInvoiceApi, useSendApprovalOtp, useVerifyApprovalOtp } from '@/pages/serviceAPI/InvoiceAPI';
import { useServiceRequestsApi } from '@/pages/serviceAPI/ServiceRequestsAPI';
import { useConfirmManualPayment } from '@/pages/serviceAPI/PaymentAPI';
import { QRCodeSVG } from 'qrcode.react';
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
    X,
    AlertCircle,
    Loader2,
    Eye,
    BadgeCheck,
    LockKeyhole,
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

const formatDeviceName = (brand?: string, product?: string) => {
    if (!product) return brand ? brand.replace(/\b\w/g, c => c.toUpperCase()) : '—';
    let name = product;
    if (brand && !product.toLowerCase().includes(brand.toLowerCase())) {
        name = `${brand} ${product}`;
    }
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const formatPartName = (name: string) => {
    if (!name) return '';
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'PAID' },
    sent: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'SENT' },
    draft: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400', label: 'DRAFT' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', label: 'CANCELLED' },
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
                                    <li>Shop staff will collect to the cash and complete your services</li>
                                    <li>Thank You For Using Our Services</li>
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

// ── Manual Payment Receipt Confirmation Modal ──────────────────────────────────

interface ManualConfirmModalProps {
    isOpen: boolean;
    type: 'cash' | 'upi' | null;
    amount: number;
    currency: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

const ManualConfirmModal = ({
    isOpen,
    type,
    amount,
    currency,
    onConfirm,
    onCancel,
    isLoading,
}: ManualConfirmModalProps) => {
    if (!isOpen || !type) return null;

    const currencySymbol = currency === 'INR' ? '₹' : currency + ' ';
    const isCash = type === 'cash';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                onClick={onCancel}
            />
            {/* Modal */}
            <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`px-5 py-4 ${isCash ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'} text-white`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                                {isCash ? <Banknote className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold">Confirm Payment Receipt</p>
                                <p className="text-xs text-white/80">Action cannot be undone</p>
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
                    <div className={`text-center py-4 rounded-xl border ${isCash ? 'bg-emerald-50/50 border-emerald-100' : 'bg-blue-50/50 border-blue-100'}`}>
                        <p className="text-xs text-gray-500 font-medium mb-1">Confirming Receipt of</p>
                        <p className={`text-3xl font-black ${isCash ? 'text-emerald-700' : 'text-blue-700'}`}>
                            {currencySymbol}{Number(amount).toFixed(2)}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1.5">
                            via {type.toUpperCase()}
                        </p>
                    </div>

                    <p className="text-xs text-gray-600 text-center leading-relaxed">
                        Please make sure you have physically received/verified the payment of{' '}
                        <strong className="text-gray-800">
                            {currencySymbol}{Number(amount).toFixed(2)}
                        </strong>{' '}
                        before confirming. This will mark the invoice as PAID.
                    </p>
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
                        className={`flex-1 h-10 text-sm font-semibold rounded-xl text-white shadow-sm ${isCash
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Confirming...</>
                        ) : (
                            'Confirm Received'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};


// ── Generate Invoice Confirmation Modal ──────────────────────────────────────

interface GenerateConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
    warrantyDays: string;
    warrantyValue: string;
    warrantyUnit: string;
}

const GenerateConfirmModal = ({
    isOpen,
    onConfirm,
    onCancel,
    isLoading,
    warrantyDays,
    warrantyValue,
    warrantyUnit,
}: GenerateConfirmModalProps) => {
    if (!isOpen) return null;

    const hasWarranty = warrantyDays && warrantyDays.trim() !== '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                onClick={onCancel}
            />
            {/* Modal */}
            <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 px-5 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Generate Invoice</p>
                                <p className="text-xs text-emerald-100/90">Customer verification required</p>
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
                    {/* Warranty highlight or warning */}
                    {hasWarranty ? (
                        <div className="text-center py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">Warranty Covered</p>
                            <p className="text-2xl font-black text-emerald-700 capitalize">
                                {warrantyValue} {warrantyUnit}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">({warrantyDays} Days total)</p>
                        </div>
                    ) : (
                        <div className="text-center py-3 bg-amber-50 rounded-xl border border-amber-200 px-4">
                            <div className="flex items-center justify-center gap-1.5 text-amber-800 font-bold text-xs mb-1">
                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <span>No Warranty Selected</span>
                            </div>
                            <p className="text-[10px] text-amber-700 leading-normal">
                                Are you sure you want to proceed without warranty coverage?
                            </p>
                        </div>
                    )}

                    {/* How this works info box */}
                    <div className="bg-gray-50 border border-gray-150 rounded-xl p-3.5 space-y-2">
                        <p className="text-xs font-semibold text-gray-750">How this works:</p>
                        <ul className="text-[11px] text-gray-500 space-y-1.5 list-disc list-inside leading-normal">
                            <li>Invoice will be generated & emailed automatically</li>
                            <li>A verification OTP will be sent to the customer</li>
                            <li>Ask customer for the OTP to verify & unlock payment</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 h-10 text-sm rounded-xl border-gray-200 text-gray-600 font-medium"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 h-10 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating...</>
                        ) : (
                            'Generate & Send OTP'
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
    const { isShopOwner, isSuperAdmin, isCustomer, isShopEmployee } = useAuth();

    // SE, SO, and SA can all generate invoices
    const canGenerate = isShopOwner || isSuperAdmin || isShopEmployee;

    const { useGetServiceRequestById } = useServiceRequestsApi();
    const { useGetInvoiceById, useGenerateInvoice, useResendInvoice } = useInvoiceApi();
    const { useGetReopenRequests, useGetReworkDetails } = useServiceReopenApi();

    const { data: directInvoice, isLoading: directInvoiceLoading, refetch: refetchDirectInvoice } = useGetInvoiceById(
        invoiceId ? Number(invoiceId) : undefined
    );

    const targetServiceId = serviceId ? Number(serviceId) : directInvoice?.service_id;

    useGetReopenRequests({
        service_id: targetServiceId,
        status: 'pending'
    });

    const { data: approvedReopens, isLoading: approvedReopensLoading } = useGetReopenRequests({
        service_id: targetServiceId,
        status: 'approved'
    });

    const { data: allReopenRequests } = useGetReopenRequests({
        service_id: targetServiceId
    });

    const latestApprovedReopen = approvedReopens?.data?.[0];
    const reworkInvoice = latestApprovedReopen?.newInvoice || (latestApprovedReopen as any)?.new_invoice;

    const { data: service, isLoading: serviceLoading } = useGetServiceRequestById(
        targetServiceId
    );

    const existingInvoice = latestApprovedReopen
        ? (reworkInvoice ?? null)
        : ((service as any)?.invoice ?? null);

    const { data: serviceInvoice, isLoading: serviceInvoiceLoading, refetch: refetchServiceInvoice } = useGetInvoiceById(
        (!invoiceId && existingInvoice?.id) ? existingInvoice.id : undefined
    );

    const invoice = directInvoice || serviceInvoice;
    const invoiceLoading = directInvoiceLoading || serviceInvoiceLoading || approvedReopensLoading;
    const refetchInvoice = invoiceId ? refetchDirectInvoice : refetchServiceInvoice;
    const displayInvoice = invoice ?? existingInvoice;

    const originalInvoice = (service as any)?.invoice || (service as any)?.invoices?.find((inv: any) => !inv.reopen_request_id);
    const prevWarrantyDays = originalInvoice?.warranty_days;

    const activeReopenRequestId = displayInvoice?.reopen_request_id || latestApprovedReopen?.id;
    const { data: reworkDetails, isLoading: reworkDetailsLoading } = useGetReworkDetails(activeReopenRequestId);

    const generateMutation = useGenerateInvoice();
    const resendMutation = useResendInvoice();
    const confirmManualPaymentMutation = useConfirmManualPayment(displayInvoice?.id);
    // Approval OTP hooks
    const sendApprovalOtpMutation = useSendApprovalOtp(displayInvoice?.id);
    const verifyApprovalOtpMutation = useVerifyApprovalOtp(displayInvoice?.id);

    const [notes] = useState('');
    const [warrantyDays, setWarrantyDays] = useState('');
    const [warrantyValue, setWarrantyValue] = useState('');
    const [warrantyUnit, setWarrantyUnit] = useState<'days' | 'months' | 'years'>('days');

    useEffect(() => {
        if (!warrantyValue.trim()) {
            setWarrantyDays('');
            return;
        }
        const val = parseInt(warrantyValue, 10);
        if (isNaN(val)) {
            setWarrantyDays('');
            return;
        }
        let days = val;
        if (warrantyUnit === 'months') {
            days = val * 30;
        } else if (warrantyUnit === 'years') {
            days = val * 365;
        }
        setWarrantyDays(days.toString());
    }, [warrantyValue, warrantyUnit]);

    const [currency] = useState('INR');
    const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);

    // ─── Payment state ─────────────────────────────────────────────────────────
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [gateway, setGateway] = useState<'razorpay' | 'cashfree' | 'cash_in_hand'>('razorpay');
    const [collectionMethod, setCollectionMethod] = useState<'cash' | 'upi' | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [showCashModal, setShowCashModal] = useState(false);
    const [showManualConfirmModal, setShowManualConfirmModal] = useState(false);
    const [manualConfirmType, setManualConfirmType] = useState<'cash' | 'upi' | null>(null);

    const [approvalOtp, setApprovalOtp] = useState('');

    // ─── Reopen Modal state ──────────────────────────────────────────────
    const [reopenModalOpen, setReopenModalOpen] = useState(false);

    const handleConfirmManual = (type: 'cash' | 'upi') => {
        setManualConfirmType(type);
        setShowManualConfirmModal(true);
    };

    const executeConfirmManual = async () => {
        if (!displayInvoice?.id || !manualConfirmType) return;
        try {
            await confirmManualPaymentMutation.mutateAsync(manualConfirmType);
            toast.success(`Payment confirmed manually via ${manualConfirmType.toUpperCase()}`);
            refetchInvoice();
            setCollectionMethod(null);
            setShowManualConfirmModal(false);
            setManualConfirmType(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to confirm payment manually.');
        }
    };

    const serviceData = (service?.data as any) ?? {};
    const parsedData = typeof serviceData === 'string' ? JSON.parse(serviceData) : serviceData;
    const parts: any[] = Array.isArray(parsedData.parts) ? parsedData.parts : [];
    const charges: any[] = Array.isArray(parsedData.selectedServiceCharges) ? parsedData.selectedServiceCharges : [];

    const partsToCalculate = (reworkDetails && reworkDetails.delta) ? reworkDetails.delta.new_parts : parts;
    const chargesToCalculate = (reworkDetails && reworkDetails.delta) ? reworkDetails.delta.new_charges : charges;

    const partsSubtotal = partsToCalculate.reduce((s, p) => s + (Number(p.price) || 0) * (p.quantity || 1), 0);
    const chargesSubtotal = chargesToCalculate.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const subtotal = partsSubtotal + chargesSubtotal;
    const isWarrantyReworkDraft = !!latestApprovedReopen && subtotal === 0;

    const calculatedPartsTax = partsToCalculate.reduce((sum, part) => {
        if (part.tax_type !== 'inclusive') {
            return sum + ((Number(part.price) || 0) * (part.quantity || 1) * (Number(part.tax_percentage) || 0) / 100);
        }
        return sum;
    }, 0);
    const gstType = parsedData?.gstType || 'none';
    const gstPercentage = Number(parsedData?.gstPercentage || 18);
    const calculatedServiceTax = gstType === 'none' ? 0 : chargesSubtotal * (gstPercentage / 100);

    const tax = displayInvoice?.tax_amount ? Number(displayInvoice.tax_amount) : (calculatedPartsTax + calculatedServiceTax);
    const discount = displayInvoice?.discount_amount
        ? Number(displayInvoice.discount_amount)
        : (reworkDetails ? 0 : Number(parsedData?.serviceDiscount || parsedData?.discount || 0));
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
                    warranty_days: isWarrantyReworkDraft
                        ? (prevWarrantyDays ? parseInt(prevWarrantyDays, 10) : undefined)
                        : (warrantyDays ? parseInt(warrantyDays, 10) : undefined),
                },
            });

            if (res.status) {
                toast.success(`Invoice ${res.data?.invoice_number} generated!`
                    + (res.email_sent ? ' Email sent to customer.' : ''));
                if (res.data?.id) {
                    navigate(`/dashboard/invoice/view/${res.data.id}`);
                } else {
                    refetchInvoice();
                }
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

            toast.success('You selected to pay cash at the shop. shop staff will collect to the cash and verify your payments');
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

    if (serviceLoading || invoiceLoading || reworkDetailsLoading) {
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

    const statusStyle = displayInvoice ? getStatusStyle(displayInvoice.status) : null;
    const pendingCashPayment = displayInvoice?.payments?.find((p: any) => p.gateway === 'cash_in_hand' && p.status === 'pending');
    const successfulPayment = displayInvoice?.payments?.find((p: any) => p.status === 'success' || p.status === 'paid');

    const isInvoiceOtpApproved = displayInvoice?.otp_approved === true;

    const canCustomerPay =
        isCustomer &&
        displayInvoice?.status === 'sent' &&
        !!displayInvoice?.pay_token &&
        isInvoiceOtpApproved &&
        !pendingCashPayment;

    const warrantyExpiryDateObj = displayInvoice?.warranty_days
        ? new Date(new Date(displayInvoice.created_at).getTime() + displayInvoice.warranty_days * 24 * 60 * 60 * 1000)
        : null;
    const hasWarranty = !!displayInvoice?.warranty_days && displayInvoice.warranty_days > 0;

    // ₹0 Warranty rework invoices bypass payment entirely
    const isZeroWarrantyInvoice = displayInvoice?.is_warranty_invoice === true;

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

            {/* Manual Confirmation Modal */}
            <ManualConfirmModal
                isOpen={showManualConfirmModal}
                type={manualConfirmType}
                amount={Number(displayInvoice?.total_amount || 0)}
                currency={displayInvoice?.currency || 'INR'}
                onConfirm={executeConfirmManual}
                onCancel={() => {
                    setShowManualConfirmModal(false);
                    setManualConfirmType(null);
                }}
                isLoading={confirmManualPaymentMutation.isPending}
            />

            {/* Submit Reopen Modal */}
            {service && (
                <SubmitReopenModal
                    open={reopenModalOpen}
                    onOpenChange={setReopenModalOpen}
                    serviceId={service.id}
                    warrantyExpiryDate={warrantyExpiryDateObj ? warrantyExpiryDateObj.toISOString() : undefined}
                />
            )}
            <div className="max-w-5xl mx-auto p-2 md:p-0 space-y-2">

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
                            {hasInvoice
                                ? (displayInvoice?.reopen_request_id ? 'Rework Invoice Detail' : 'Invoice Detail')
                                : 'Create Invoice'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {service && (
                            <button
                                onClick={() => navigate(`/dashboard/services/view/${service.id}`)}
                                className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-500 hover:text-blue-600 transition-all shadow-sm"
                                title="View Service Request"
                            >
                                <Eye className="w-4 h-4 text-secondary" />
                            </button>
                        )}
                        {statusStyle && displayInvoice && (
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold tracking-wider ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                                {statusStyle.label}
                            </div>
                        )}

                        {displayInvoice?.is_warranty_invoice && (
                            <div className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-green-200 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider transition-all shadow-sm">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Warranty Rework
                            </div>
                        )}
                        {!displayInvoice?.is_warranty_invoice && displayInvoice?.reopen_request_id && (
                            <div className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider transition-all shadow-sm">
                                <RefreshCw className="w-3.5 h-3.5" />
                                Rework Service
                            </div>
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
                                        <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.2em]">
                                            {displayInvoice?.is_warranty_invoice
                                                ? 'Warranty Rework Invoice'
                                                : displayInvoice?.reopen_request_id
                                                    ? 'Rework Service Invoice'
                                                    : 'Invoice'}
                                        </p>
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
                            <div className="hidden print:flex print:items-start print:justify-between print:px-0 print:py-0 print:pb-3 print:border-b print:border-gray-200">
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
                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                        {displayInvoice?.is_warranty_invoice
                                            ? 'Warranty Rework Invoice'
                                            : displayInvoice?.reopen_request_id
                                                ? 'Rework Service Invoice'
                                                : 'Invoice'}
                                    </p>
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
                                        { icon: <Package className="w-3.5 h-3.5" />, label: 'Device', value: formatDeviceName(service.brand?.name, service.product?.name), color: 'text-orange-600', bg: 'bg-orange-50' },
                                        { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Warranty', value: hasWarranty ? (isCustomer && warrantyExpiryDateObj ? `Till ${warrantyExpiryDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : `${displayInvoice.warranty_days} Days`) : 'None', color: 'text-indigo-600', bg: 'bg-indigo-50' },
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

                        {/* ── PAID Watermark ── */}
                        {displayInvoice?.status === 'paid' && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none opacity-[0.07] print:opacity-[0.05] z-0">
                                <div className="border-[12px] border-emerald-600 rounded-3xl px-12 py-6">
                                    <p className="text-8xl md:text-9xl font-black text-emerald-600 tracking-widest uppercase">PAID</p>
                                </div>
                            </div>
                        )}

                        <div className="px-5 pb-5 space-y-5 print:px-0 print:pb-0 print:pt-3 print:space-y-3 relative z-10">

                            {/* ── Billing Parties ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-4">
                                {/* Billed To */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 print:bg-transparent print:border-none print:rounded-none print:p-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2 print:mb-1.5">
                                        Billed To
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">{service.customer?.name ?? '—'}</p>
                                    {service.customer?.company_name && (
                                        <p className="text-xs font-semibold text-gray-700 mt-1">
                                            Company: {service.customer.company_name}
                                        </p>
                                    )}
                                    {service.customer?.gstin && (
                                        <p className="text-xs font-semibold text-gray-700 mt-0.5">
                                            GSTIN: {service.customer.gstin}
                                        </p>
                                    )}
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
                                    {(service.brand?.name || service.product?.name) && (
                                        <p className="text-xs font-semibold text-blue-700 mt-1 print:text-gray-700">
                                            {formatDeviceName(service.brand?.name, service.product?.name)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* ── Items Table ── */}
                            <div className="rounded-xl overflow-hidden border border-gray-100 print:border-0 print:rounded-none">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-800 text-white print:bg-transparent print:text-gray-500 print:border-b print:border-gray-200">
                                            <th className="py-3 px-4 text-left font-bold text-[11px] uppercase tracking-wider print:py-1.5 print:px-2">Description</th>
                                            <th className="py-3 px-4 text-center font-bold text-[11px] uppercase tracking-wider w-20 print:py-1.5 print:px-2">Type</th>
                                            <th className="py-3 px-4 text-center font-bold text-[11px] uppercase tracking-wider w-14 print:py-1.5 print:px-2">Qty</th>
                                            <th className="py-3 px-4 text-right font-bold text-[11px] uppercase tracking-wider w-28 print:py-1.5 print:px-2">Unit Price</th>
                                            <th className="py-3 px-4 text-right font-bold text-[11px] uppercase tracking-wider w-28 print:py-1.5 print:px-2">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 print:divide-gray-100">
                                        {reworkDetails && reworkDetails.delta ? (
                                            <>
                                                {/* Covered Items (Original) */}
                                                <tr className="bg-gray-100 print:bg-gray-50 border-b border-gray-200">
                                                    <td colSpan={5} className="py-2 px-4 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                                                        Original Items (Covered Under Warranty)
                                                    </td>
                                                </tr>
                                                {(!reworkDetails.original_data.parts?.length && !reworkDetails.original_data.selectedServiceCharges?.length) && (
                                                    <tr><td colSpan={5} className="py-3 px-4 text-center italic text-gray-400">No original items.</td></tr>
                                                )}
                                                {reworkDetails.original_data.parts?.map((p: any, i: number) => (
                                                    <tr key={`op-${i}`} className="hover:bg-blue-50/30 transition-colors group print:hover:bg-transparent opacity-75">
                                                        <td className="py-3 px-4 print:py-2 print:px-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 print:hidden" />
                                                                <span className="font-medium text-gray-600 line-through">{formatPartName(p.name)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center print:py-2 print:px-2">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold print:bg-transparent print:px-0">Part</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-medium text-gray-500 print:py-2 print:px-2">{p.quantity || 1}</td>
                                                        <td className="py-3 px-4 text-right text-gray-500 print:py-2 print:px-2">₹{Number(p.price || 0).toFixed(2)}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-green-600 print:py-2 print:px-2">
                                                            <span className="line-through text-gray-400 mr-1">₹{(Number(p.price || 0) * (p.quantity || 1)).toFixed(2)}</span>
                                                            ₹0.00
                                                        </td>
                                                    </tr>
                                                ))}
                                                {reworkDetails.original_data.selectedServiceCharges?.map((c: any, i: number) => (
                                                    <tr key={`oc-${i}`} className="hover:bg-emerald-50/30 transition-colors group print:hover:bg-transparent opacity-75">
                                                        <td className="py-3 px-4 print:py-2 print:px-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 print:hidden" />
                                                                <span className="font-medium text-gray-600 line-through">{formatPartName(c.name)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center print:py-2 print:px-2">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold print:bg-transparent print:px-0">Charge</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-medium text-gray-500 print:py-2 print:px-2">1</td>
                                                        <td className="py-3 px-4 text-right text-gray-500 print:py-2 print:px-2">₹{Number(c.amount || 0).toFixed(2)}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-green-600 print:py-2 print:px-2">
                                                            <span className="line-through text-gray-400 mr-1">₹{Number(c.amount || 0).toFixed(2)}</span>
                                                            ₹0.00
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* New Billable Additions */}
                                                <tr className="bg-amber-50 print:bg-gray-50 border-y border-amber-100 print:border-gray-200">
                                                    <td colSpan={5} className="py-2 px-4 text-[10px] font-bold text-amber-800 print:text-gray-800 uppercase tracking-wider">
                                                        New Additions (Billable)
                                                    </td>
                                                </tr>
                                                {(!reworkDetails.delta.new_parts?.length && !reworkDetails.delta.new_charges?.length) && (
                                                    <tr><td colSpan={5} className="py-3 px-4 text-center italic text-gray-400">No new items added.</td></tr>
                                                )}
                                                {reworkDetails.delta.new_parts?.map((p: any, i: number) => (
                                                    <tr key={`np-${i}`} className="bg-indigo-50/25 hover:bg-indigo-50/40 transition-colors group print:hover:bg-transparent">
                                                        <td className="py-3 px-4 print:py-2 print:px-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 print:hidden" />
                                                                <span className="font-semibold text-gray-900">{formatPartName(p.name)}</span>
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[9px] font-extrabold uppercase tracking-wider print:hidden">Rework Added</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center print:py-2 print:px-2">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold print:bg-transparent print:px-0">Part</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-medium text-gray-700 print:py-2 print:px-2">{p.quantity || 1}</td>
                                                        <td className="py-3 px-4 text-right text-gray-600 print:py-2 print:px-2">₹{Number(p.price || 0).toFixed(2)}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-gray-900 print:py-2 print:px-2">
                                                            ₹{(Number(p.price || 0) * (p.quantity || 1)).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {reworkDetails.delta.new_charges?.map((c: any, i: number) => (
                                                    <tr key={`nc-${i}`} className="bg-indigo-50/25 hover:bg-indigo-50/40 transition-colors group print:hover:bg-transparent">
                                                        <td className="py-3 px-4 print:py-2 print:px-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 print:hidden" />
                                                                <span className="font-semibold text-gray-900">{formatPartName(c.name)}</span>
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[9px] font-extrabold uppercase tracking-wider print:hidden">Rework Added</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center print:py-2 print:px-2">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold print:bg-transparent print:px-0">Charge</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-medium text-gray-700 print:py-2 print:px-2">1</td>
                                                        <td className="py-3 px-4 text-right text-gray-600 print:py-2 print:px-2">₹{Number(c.amount || 0).toFixed(2)}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-gray-900 print:py-2 print:px-2">
                                                            ₹{Number(c.amount || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
                                        ) : (
                                            <>
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
                                                                <span className="font-semibold text-gray-900">{formatPartName(p.name)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center print:py-2 print:px-2">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold print:bg-transparent print:text-gray-600 print:px-0">
                                                                Part
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-medium text-gray-700 print:py-2 print:px-2">{p.quantity || 1}</td>
                                                        <td className="py-3 px-4 text-right text-gray-600 print:py-2 print:px-2">₹{Number(p.price || 0).toFixed(2)}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-gray-900 print:py-2 print:px-2">
                                                            {p.is_warranty_covered ? (
                                                                <span className="text-green-600 line-through">₹{(Number(p.price || 0) * (p.quantity || 1)).toFixed(2)}</span>
                                                            ) : (
                                                                <span>₹{(Number(p.price || 0) * (p.quantity || 1)).toFixed(2)}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {charges.map((c: any, i: number) => (
                                                    <tr key={`c-${i}`} className="hover:bg-emerald-50/30 transition-colors group print:hover:bg-transparent">
                                                        <td className="py-3 px-4 print:py-2 print:px-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 print:hidden" />
                                                                <span className="font-semibold text-gray-900">{formatPartName(c.name)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center print:py-2 print:px-2">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold print:bg-transparent print:text-gray-600 print:px-0">
                                                                Charge
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-medium text-gray-700 print:py-2 print:px-2">1</td>
                                                        <td className="py-3 px-4 text-right text-gray-600 print:py-2 print:px-2">₹{Number(c.amount || 0).toFixed(2)}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-gray-900 print:py-2 print:px-2">
                                                            {c.is_warranty_covered ? (
                                                                <span className="text-green-600 line-through">₹{Number(c.amount || 0).toFixed(2)}</span>
                                                            ) : (
                                                                <span>₹{Number(c.amount || 0).toFixed(2)}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Footer: Notes + Totals ── */}
                            <div className="flex flex-col md:flex-row justify-between items-start gap-5 print:gap-4">

                                {/* Notes Section */}
                                <div className="flex-1 space-y-3">
                                    {!hasInvoice && canGenerate && isCompleted && (
                                        <div className="print:hidden bg-gray-50 rounded-xl p-3.5 border border-gray-100 max-w-xs">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold text-gray-500 capitalize tracking-wider block">
                                                    Warranty Period (Days)
                                                </Label>
                                                {isWarrantyReworkDraft ? (
                                                    <div className="bg-gray-100 border border-gray-200 rounded-lg h-8 px-3 flex items-center text-xs text-gray-650 font-medium">
                                                        {prevWarrantyDays ? `${prevWarrantyDays} Days (Carried over from previous service)` : 'None'}
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-1.5 items-center">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="E.g. 3"
                                                            value={warrantyValue}
                                                            onChange={e => setWarrantyValue(e.target.value)}
                                                            className="bg-white border-gray-200 shadow-sm h-8 text-xs flex-1"
                                                        />
                                                        <select
                                                            value={warrantyUnit}
                                                            onChange={e => setWarrantyUnit(e.target.value as any)}
                                                            className="bg-white border border-gray-200 rounded-lg shadow-sm h-8 text-xs px-2 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-gray-700 font-medium"
                                                        >
                                                            <option value="days">Days</option>
                                                            <option value="months">Months</option>
                                                            <option value="years">Years</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {(displayInvoice?.notes || (notes && !hasInvoice)) && (
                                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-xs text-gray-700 print:bg-transparent print:border-none print:p-0 print:pt-2">
                                            <p className="font-bold text-gray-700 mb-1 print:text-gray-500 print:text-[10px] print:uppercase print:tracking-wider">Notes:</p>
                                            <p className="text-gray-600 leading-relaxed">{displayInvoice?.notes || notes}</p>
                                        </div>
                                    )}

                                    {/* Payment Details (Left Side) */}
                                    {displayInvoice?.status === 'paid' && (successfulPayment || displayInvoice.is_warranty_invoice) && (
                                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 print:bg-transparent print:border-none print:p-0 print:pt-2 w-full max-w-sm">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2.5 print:text-gray-500">Payment Details</p>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between text-gray-700">
                                                    <span>Method:</span>
                                                    <span className="font-semibold">
                                                        {displayInvoice.is_warranty_invoice
                                                            ? 'Warranty Coverage'
                                                            : (successfulPayment?.gateway === 'cash_in_hand'
                                                                ? 'Cash at Shop'
                                                                : (successfulPayment?.gateway === 'upi'
                                                                    ? 'UPI'
                                                                    : (successfulPayment?.gateway === 'razorpay'
                                                                        ? 'Razorpay'
                                                                        : (successfulPayment?.gateway === 'cashfree'
                                                                            ? 'Cashfree'
                                                                            : successfulPayment?.gateway))))}
                                                    </span>
                                                </div>
                                                {!displayInvoice.is_warranty_invoice && successfulPayment?.transaction_id && (
                                                    <div className="flex justify-between text-gray-700">
                                                        <span>Txn ID:</span>
                                                        <span className="font-mono font-medium">{successfulPayment.transaction_id}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-gray-700">
                                                    <span>Date:</span>
                                                    <span>
                                                        {new Date(
                                                            displayInvoice.is_warranty_invoice
                                                                ? displayInvoice.paid_at || displayInvoice.created_at
                                                                : (successfulPayment?.updated_at || successfulPayment?.created_at)
                                                        ).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                            </div>
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

                                        {tax > 0 && (
                                            <div className="flex justify-between text-xs text-gray-600">
                                                <span>Tax</span>
                                                <span className="text-indigo-600 font-medium">+₹{tax.toFixed(2)}</span>
                                            </div>
                                        )}

                                        {discount > 0 && (
                                            <div className="flex justify-between text-xs text-gray-600">
                                                <span>Discount</span>
                                                <span className="text-red-500 font-medium">-₹{discount.toFixed(2)}</span>
                                            </div>
                                        )}

                                        {/* Divider */}
                                        <div className="border-t border-gray-200 pt-2 print:border-gray-200 print:pt-1.5" />

                                        {/* TOTAL */}
                                        <div className="flex justify-between items-center bg-gradient-to-r from-[#1F80FF] to-[#0055cc] text-white px-4 py-3 rounded-xl print:bg-transparent print:rounded-none print:border-t print:border-gray-200 print:px-0 print:text-gray-900 print:py-1.5">
                                            <span className="font-bold text-xs uppercase tracking-widest print:text-gray-800">Total</span>
                                            <span className="font-black text-xl print:text-gray-900">{formatCurrency(total, currency)}</span>
                                        </div>
                                    </div>

                                    {/* Payment status badge */}
                                    {displayInvoice && (
                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold print:hidden mt-2 ${statusStyle?.bg} ${statusStyle?.text} ${statusStyle?.border}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${statusStyle?.dot}`} />
                                            {displayInvoice.status === 'paid'
                                                ? 'Payment received — Thank you!'
                                                : displayInvoice.status === 'sent'
                                                    ? (isCustomer && pendingCashPayment ? 'You have selected to pay by cash' : 'Awaiting customer payment')
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

                {/* ── Reopen / Rework History ── */}
                {allReopenRequests?.data && allReopenRequests.data.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6 print:hidden animate-in fade-in slide-in-from-top-4 duration-355">
                        <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
                            <div className="w-9 h-9 bg-gray-200 rounded-xl flex items-center justify-center text-gray-700">
                                <Clock className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">Service Reopen &amp; Rework History</h3>
                                <p className="text-[10px] text-gray-500 mt-0.5">History of issue reports and rework cycles for this service</p>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="relative border-l-2 border-gray-100 ml-4 pl-6 space-y-6">
                                {allReopenRequests.data.map((req: any) => {
                                    const isApproved = req.status === 'approved';
                                    const isRejected = req.status === 'rejected';
                                    const isReworkInvoicePaid = (req.newInvoice?.status === 'paid') || ((req as any).new_invoice?.status === 'paid');
                                    const isCompleted = isApproved && isReworkInvoicePaid;

                                    return (
                                        <div key={req.id} className="relative">
                                            {/* Timeline Dot */}
                                            <div className={`absolute -left-[35px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center shadow-sm ${isCompleted ? 'border-emerald-600' : isApproved ? 'border-emerald-500' : isRejected ? 'border-red-500' : 'border-amber-400'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-600' : isApproved ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-amber-400'
                                                    }`} />
                                            </div>

                                            <div className="bg-gray-50/50 hover:bg-gray-50/80 border border-gray-100 rounded-xl p-4 transition-all duration-200">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100/50 pb-2 mb-2.5">
                                                    <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                        Reopen Request #{req.reopen_number}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${isCompleted
                                                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                                            : isApproved
                                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                                                : isRejected
                                                                    ? 'bg-red-50 border-red-100 text-red-700'
                                                                    : 'bg-amber-50 border-amber-100 text-amber-700'
                                                        }`}>
                                                        {isCompleted ? 'Completed' : isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Review'}
                                                    </span>
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason for Reopen</p>
                                                        <p className="text-xs text-gray-700 mt-1 leading-relaxed font-medium">{req.reason}</p>
                                                    </div>

                                                    {req.shop_owner_note && (
                                                        <div className="bg-white border border-gray-100 rounded-lg p-3">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shop Review Note</p>
                                                            <p className="text-xs text-gray-600 mt-1 leading-relaxed italic">"{req.shop_owner_note}"</p>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[10px] text-gray-400 font-bold tracking-tight">
                                                        <span>Requested: {formatDate(req.created_at)}</span>
                                                        {req.reviewed_at && (
                                                            <span>Reviewed: {formatDate(req.reviewed_at)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Approval logic ── */}
                {/* {hasInvoice && !isZeroWarrantyInvoice && (
                <div className="space-y-4">
                    {isCustomer && displayInvoice?.status === 'sent' && !isInvoiceOtpApproved && (
                        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden mt-6">
                            <div className="flex items-center gap-3 px-5 py-4 bg-blue-50/50 border-b border-blue-100">
                                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-blue-900">Awaiting OTP Verification</p>
                                    <p className="text-[10px] text-blue-600">Please share the verification code with shop staff to unlock payment</p>
                                </div>
                            </div>
                            <div className="p-5 flex flex-col items-center justify-center space-y-4">
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center w-full">
                                    <p className="text-xs font-semibold text-blue-800 leading-relaxed">
                                        A 6-digit verification code has been sent to your notifications/email.
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1.5">
                                        Please share this code with the shop staff. Once they enter and verify it, your payment options will be unlocked.
                                    </p>
                                </div>
                                
                            </div>
                        </div>
                    )}
                </div>
            )} */}

                {/* ── Customer: Pay Now ── */}
                {canCustomerPay && !isZeroWarrantyInvoice && !paymentSuccess && (
                    <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden mt-4 print:hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-blue-50/50 border-b border-indigo-100/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
                                    <CreditCard className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-indigo-900">Complete Payment</p>
                                    <p className="text-[9px] text-indigo-500 flex items-center gap-0.5">
                                        <ShieldCheck className="w-3 h-3" /> 256-bit SSL encrypted
                                    </p>
                                </div>
                            </div>
                            <button
                                id="toggle-payment-section"
                                onClick={() => setPaymentOpen(prev => !prev)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-100/50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-all"
                            >
                                {paymentOpen ? 'Hide' : 'Pay Now'}
                            </button>
                        </div>

                        {/* Closed: show amount + CTA */}
                        {!paymentOpen && (
                            <div className="px-4 py-2.5 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] text-gray-500">Invoice {displayInvoice.invoice_number}</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[10px] text-gray-500">Amount due:</span>
                                        <span className="text-xs font-black text-gray-900">
                                            {displayInvoice.currency === 'INR' ? '₹' : displayInvoice.currency + ' '}
                                            {Number(displayInvoice.total_amount).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    id="open-payment-section"
                                    onClick={() => setPaymentOpen(true)}
                                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm"
                                >
                                    Pay Now →
                                </button>
                            </div>
                        )}

                        {/* Expanded: full payment form */}
                        {paymentOpen && (
                            <div className="p-4 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200 bg-gray-50/20">
                                {/* Amount due */}
                                <div className="flex items-center justify-between bg-indigo-50/50 rounded-lg px-3 py-2 border border-indigo-100/55">
                                    <span className="text-[11px] font-semibold text-indigo-700">Amount Due</span>
                                    <span className="text-sm font-extrabold text-indigo-900">
                                        {displayInvoice.currency === 'INR' ? '₹' : displayInvoice.currency + ' '}
                                        {Number(displayInvoice.total_amount).toFixed(2)}
                                    </span>
                                </div>

                                {/* Gateway selection */}
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Payment Method</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {/* Razorpay */}
                                        <button
                                            id="select-razorpay"
                                            onClick={() => setGateway('razorpay')}
                                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all duration-150 bg-white ${gateway === 'razorpay'
                                                    ? 'border-indigo-500 bg-indigo-50/40 shadow-sm'
                                                    : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${gateway === 'razorpay' ? 'border-indigo-500' : 'border-gray-300'}`}>
                                                {gateway === 'razorpay' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Razorpay</p>
                                                <p className="text-[10px] text-gray-400">Cards, UPI, NetBanking</p>
                                            </div>
                                        </button>

                                        {/* Cashfree */}
                                        <button
                                            id="select-cashfree"
                                            onClick={() => setGateway('cashfree')}
                                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all duration-150 bg-white ${gateway === 'cashfree'
                                                    ? 'border-orange-500 bg-orange-50/40 shadow-sm'
                                                    : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${gateway === 'cashfree' ? 'border-orange-500' : 'border-gray-300'}`}>
                                                {gateway === 'cashfree' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Cashfree</p>
                                                <p className="text-[10px] text-gray-400">Cards, UPI, Wallets</p>
                                            </div>
                                        </button>

                                        {/* Cash in Hand */}
                                        <button
                                            id="select-cash_in_hand"
                                            onClick={() => setGateway('cash_in_hand')}
                                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all duration-150 bg-white ${gateway === 'cash_in_hand'
                                                    ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                                                    : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${gateway === 'cash_in_hand' ? 'border-emerald-500' : 'border-gray-300'}`}>
                                                {gateway === 'cash_in_hand' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Cash</p>
                                                <p className="text-[10px] text-gray-400">Pay cash at center</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Pay Button */}
                                <button
                                    id="confirm-pay-now"
                                    onClick={handlePay}
                                    disabled={isPaying}
                                    className={`w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${isPaying
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg active:scale-[0.98]'
                                        }`}>
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
                                    {resendMutation.isPending ? 'Resending...' : 'Resend Invoice'}
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
                                onClick={() => setGenerateConfirmOpen(true)}
                                disabled={generateMutation.isPending || (subtotal === 0 && !latestApprovedReopen)}
                                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold px-6 shadow-sm h-9 text-xs gap-2 rounded-xl transition-all"
                            >
                                {generateMutation.isPending
                                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                                    : <><Sparkles className="w-3.5 h-3.5" /> Generate Invoice</>
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
                    {canGenerate && displayInvoice?.status === 'sent' && !paymentSuccess && pendingCashPayment && (
                        <div className="bg-white border border-emerald-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 border-b border-emerald-100">
                                <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-emerald-900">Collect Payment</p>
                                    <p className="text-[10px] text-emerald-600 mt-0.5">
                                        Customer: <strong>{displayInvoice?.customer?.name ?? '—'}</strong> ·
                                        Amount: <strong>
                                            {displayInvoice?.currency === 'INR' ? '₹' : displayInvoice?.currency + ' '}
                                            {Number(displayInvoice?.total_amount ?? 0).toFixed(2)}
                                        </strong>
                                    </p>
                                </div>
                            </div>

                            <div className="p-3 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setCollectionMethod('cash')}
                                        className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl border-2 transition-all ${collectionMethod === 'cash' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 font-bold shadow-sm' : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50 text-gray-600'
                                            }`}
                                    >
                                        <Banknote className="w-4 h-4 flex-shrink-0 opacity-90" />
                                        <span className="text-xs font-bold">Cash</span>
                                    </button>
                                    <button
                                        onClick={() => setCollectionMethod('upi')}
                                        className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl border-2 transition-all ${collectionMethod === 'upi' ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-bold shadow-sm' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50 text-gray-600'
                                            }`}
                                    >
                                        <QRCodeSVG value="upi://pay" size={16} className="opacity-90" />
                                        <span className="text-xs font-bold">UPI QR</span>
                                    </button>
                                </div>

                                {collectionMethod === 'cash' && (
                                    <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 text-center">
                                        <p className="text-[11px] text-gray-500">
                                            Collect cash from the customer and confirm payment below.
                                        </p>
                                        <Button
                                            id="confirm-cash-received-btn"
                                            onClick={() => handleConfirmManual('cash')}
                                            disabled={confirmManualPaymentMutation.isPending}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs rounded-xl"
                                        >
                                            {confirmManualPaymentMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Banknote className="w-3.5 h-3.5 mr-1.5" />}
                                            Confirm Cash Received
                                        </Button>
                                    </div>
                                )}

                                {collectionMethod === 'upi' && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        {displayInvoice?.shop?.upi_id ? (
                                            <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-white border border-gray-150 rounded-xl shadow-sm">
                                                <div className="p-1.5 bg-white rounded-lg border border-gray-100 flex-shrink-0 shadow-sm">
                                                    <QRCodeSVG
                                                        value={`upi://pay?pa=${displayInvoice.shop.upi_id}&pn=${encodeURIComponent(displayInvoice.shop.upi_name || displayInvoice.shop.name)}&am=${Number(displayInvoice.total_amount).toFixed(2)}&cu=${displayInvoice.currency || 'INR'}`}
                                                        size={110}
                                                    />
                                                </div>
                                                <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
                                                    <p className="text-xs font-bold text-gray-800">Scan to Pay via UPI</p>
                                                    <p className="text-[10px] text-gray-500 leading-normal">
                                                        UPI ID: <span className="font-semibold text-gray-700 break-all">{displayInvoice.shop.upi_id}</span><br />
                                                        Amount: <span className="font-semibold text-emerald-600">₹{Number(displayInvoice.total_amount).toFixed(2)}</span>
                                                    </p>
                                                    <p className="text-[9px] text-gray-400">
                                                        Ask customer to scan. Verify payment in your app first.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-red-50 border border-red-200 text-red-650 rounded-xl text-[10px] text-center">
                                                UPI ID is not configured for this branch. Please configure it in settings.
                                            </div>
                                        )}
                                        <Button
                                            onClick={() => handleConfirmManual('upi')}
                                            disabled={confirmManualPaymentMutation.isPending || !displayInvoice?.shop?.upi_id}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs rounded-xl"
                                        >
                                            {confirmManualPaymentMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />}
                                            Confirm UPI Payment Received
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── SE/SO: OTP Verification & Approval Status Panel ── */}
                    {canGenerate && displayInvoice?.status === 'sent' && !paymentSuccess && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-4">
                            {/* Header */}
                            <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${isInvoiceOtpApproved
                                    ? 'bg-emerald-50/50 border-emerald-100'
                                    : 'bg-amber-50/50 border-amber-100'
                                }`}>
                                {isInvoiceOtpApproved ? (
                                    <BadgeCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                ) : (
                                    <LockKeyhole className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-bold ${isInvoiceOtpApproved ? 'text-emerald-950' : 'text-amber-950'
                                        }`}>
                                        {isInvoiceOtpApproved
                                            ? 'Customer Approved & Verified'
                                            : 'Awaiting OTP Verification'}
                                    </p>
                                    <p className={`text-[10px] truncate ${isInvoiceOtpApproved ? 'text-emerald-600' : 'text-amber-600'
                                        }`}>
                                        {isInvoiceOtpApproved
                                            ? `Verified on ${displayInvoice.otp_approved_at ? new Date(displayInvoice.otp_approved_at).toLocaleString('en-IN') : '—'}`
                                            : 'Enter the 6-digit OTP code provided by the customer.'}
                                    </p>
                                </div>
                            </div>

                            {/* Actions / Form Body */}
                            {!isInvoiceOtpApproved && (
                                <div className="p-4 bg-gray-50/30">
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <div className="relative w-full sm:w-48">
                                            <input
                                                id="staff-approval-otp-input"
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={approvalOtp}
                                                onChange={(e) => setApprovalOtp(e.target.value.replace(/\D/g, ''))}
                                                placeholder="Enter 6-Digit OTP"
                                                className="w-full text-center tracking-widest text-sm font-semibold h-9 rounded-lg border border-gray-200 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none placeholder:text-gray-400 placeholder:tracking-normal"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={async () => {
                                                    try {
                                                        const res = await sendApprovalOtpMutation.mutateAsync();
                                                        if (res.status) {
                                                            toast.success('Verification OTP re-sent to customer!');
                                                            refetchInvoice();
                                                        }
                                                    } catch (err: any) {
                                                        toast.error(err.response?.data?.message || err.message || 'Failed to resend OTP.');
                                                    }
                                                }}
                                                disabled={sendApprovalOtpMutation.isPending}
                                                className="h-9 text-xs font-medium px-3 rounded-lg border-gray-200 hover:bg-gray-50 flex-1 sm:flex-none"
                                            >
                                                Resend OTP
                                            </Button>

                                            <Button
                                                id="staff-verify-otp-btn"
                                                onClick={async () => {
                                                    if (approvalOtp.length !== 6) {
                                                        toast.error('Please enter the complete 6-digit OTP.');
                                                        return;
                                                    }
                                                    try {
                                                        const res = await verifyApprovalOtpMutation.mutateAsync(approvalOtp);
                                                        if (res.status) {
                                                            toast.success('Invoice verified & approved! Payment is now unlocked.');
                                                            setApprovalOtp('');
                                                            refetchInvoice();
                                                        } else {
                                                            toast.error(res.message || 'Incorrect OTP.');
                                                        }
                                                    } catch (err: any) {
                                                        toast.error(err.response?.data?.message || err.message || 'Failed to verify OTP.');
                                                    }
                                                }}
                                                disabled={verifyApprovalOtpMutation.isPending || approvalOtp.length !== 6}
                                                className="h-9 text-xs font-bold px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none"
                                            >
                                                {verifyApprovalOtpMutation.isPending ? (
                                                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Verifying...</>
                                                ) : (
                                                    <><BadgeCheck className="w-3.5 h-3.5 mr-1.5" /> Verify &amp; Unlock</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Generate Confirmation Modal */}
            <GenerateConfirmModal
                isOpen={generateConfirmOpen}
                onConfirm={() => {
                    setGenerateConfirmOpen(false);
                    handleGenerate();
                }}
                onCancel={() => setGenerateConfirmOpen(false)}
                isLoading={generateMutation.isPending}
                warrantyDays={warrantyDays}
                warrantyValue={warrantyValue}
                warrantyUnit={warrantyUnit}
            />
        </>
    );
};

export default InvoiceGenerator;
