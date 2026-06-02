import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { useInvoiceApi, Invoice } from '@/pages/serviceAPI/InvoiceAPI';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/table/datatable';
import {
    FileText,
    Eye,
    Send,
    Clock,
    CheckCircle2,
    XCircle,
    MailCheck,
    User,
    Smartphone,
    Calendar,
    IndianRupee,
    CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600', icon: <Clock className="w-3 h-3" /> },
    sent: { label: 'Sent', className: 'bg-blue-100 text-blue-700', icon: <MailCheck className="w-3 h-3" /> },
    paid: { label: 'Paid', className: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-600', icon: <XCircle className="w-3 h-3" /> },
};

const getStatusConfig = (status: string) =>
    STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600', icon: null };

const formatCurrency = (amount: string | number, currency = 'INR') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const symbol = currency === 'INR' ? '₹' : currency + ' ';
    return symbol + num.toFixed(2);
};

const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    } catch { return dateStr; }
};

// ─── Component ────────────────────────────────────────────────────────────────

const InvoicesListPage = () => {
    const navigate = useNavigate();
    const { isCustomer, isShopOwner, isSuperAdmin } = useAuth();
    const { useGetInvoices, useResendInvoice } = useInvoiceApi();

    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');

    const { data: paginated, isLoading } = useGetInvoices({
        per_page: 15,
        page,
        ...(statusFilter ? { status: statusFilter } : {}),
    });

    const resendMutation = useResendInvoice();

    const invoices: Invoice[] = paginated?.data ?? [];
    const totalCount = paginated?.total ?? 0;

    const handleResend = async (inv: Invoice) => {
        try {
            const res = await resendMutation.mutateAsync(inv.id);
            if (res.email_sent) {
                toast.success(`Invoice ${inv.invoice_number} re-sent to customer's email!`);
            } else {
                toast.warning(`Invoice updated, but email could not be sent. ${res.email_error ?? ''}`);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to resend invoice');
        }
    };

    const canResend = isShopOwner || isSuperAdmin;

    // Search blob mapping for DataTable internal search
    const mappedInvoices = useMemo(() => {
        return invoices.map((inv) => ({
            ...inv,
            _search_blob: `${inv.invoice_number} ${inv.customer?.name ?? ''} ${inv.service?.product?.name ?? ''} ${inv.service?.brand?.name ?? ''}`.toLowerCase(),
        }));
    }, [invoices]);

    // DataTable columns definition
    const columns: Column<Invoice>[] = useMemo(() => {
        const cols: Column<Invoice>[] = [
            {
                key: 'invoice_number',
                title: 'Invoice #',
                dataIndex: 'invoice_number',
                sortable: true,
                render: (_: any, inv: Invoice) => (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-xs font-mono tracking-tight">
                                {inv.invoice_number}
                            </p>
                            <p className="text-[10px] text-gray-400">SR #{inv.service_id}</p>
                        </div>
                    </div>
                )
            },
            ...(!isCustomer ? [
                {
                    key: 'customer',
                    title: 'Customer',
                    render: (_: any, inv: Invoice) => (
                        <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-900 text-xs leading-tight">
                                    {inv.customer?.name ?? '—'}
                                </p>
                                <p className="text-[10px] text-gray-400">{inv.customer?.email ?? ''}</p>
                            </div>
                        </div>
                    )
                }
            ] : []),
            {
                key: 'device',
                title: 'Device',
                render: (_: any, inv: Invoice) => (
                    <div className="flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-700 font-medium">
                            {inv.service?.product?.name ?? inv.service?.brand?.name ?? '—'}
                        </span>
                    </div>
                )
            },
            {
                key: 'date',
                title: 'Date',
                render: (_: any, inv: Invoice) => (
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-600 font-medium">{formatDate(inv.created_at)}</p>
                            {inv.sent_at && (
                                <p className="text-[10px] text-gray-400">Sent {formatDate(inv.sent_at)}</p>
                            )}
                        </div>
                    </div>
                )
            },
            {
                key: 'total',
                title: 'Total',
                align: 'right' as const,
                render: (_: any, inv: Invoice) => (
                    <span className="font-bold text-gray-900 text-xs">
                        {formatCurrency(inv.total_amount, inv.currency)}
                    </span>
                )
            },
            {
                key: 'status',
                title: 'Status',
                align: 'center' as const,
                render: (_: any, inv: Invoice) => {
                    const sc = getStatusConfig(inv.status);
                    return (
                        <Badge className={`${sc.className} gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm`}>
                            {sc.icon}
                            {sc.label}
                        </Badge>
                    );
                }
            },
            {
                key: 'actions',
                title: 'Actions',
                align: 'right' as const,
                render: (_: any, inv: Invoice) => {
                    const isResending = resendMutation.isPending;
                    return (
                        <div className="flex items-center gap-1 justify-end">
                            <Button
                                id={`view-invoice-${inv.id}`}
                                variant="outline"
                                size="sm"
                                className="h-5 px-1.5 text-[9px] gap-0.5"
                                onClick={() => navigate(`/dashboard/invoice/view/${inv.id}`)}
                            >
                                <Eye className="w-2.5 h-2.5" />
                                View
                            </Button>
                            {canResend && inv.status !== 'paid' && (
                                <Button
                                    id={`resend-invoice-${inv.id}`}
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-1.5 text-[9px] gap-0.5 text-blue-600 hover:bg-blue-50"
                                    disabled={isResending}
                                    onClick={() => handleResend(inv)}
                                >
                                    <Send className="w-2.5 h-2.5" />
                                    Resend
                                </Button>
                            )}
                            {isCustomer && inv.status === 'sent' && (
                                <Button
                                    id={`pay-invoice-${inv.id}`}
                                    size="sm"
                                    className="h-5 px-1.5 text-[9px] gap-0.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                    onClick={() => navigate(`/dashboard/invoice/view/${inv.id}`)}
                                >
                                    <CreditCard className="w-2.5 h-2.5" />
                                    Pay Now
                                </Button>
                            )}
                        </div>
                    );
                }
            }
        ];
        return cols;
    }, [isCustomer, canResend, resendMutation.isPending]);

    return (
        <div className="p-0 space-y-6">

            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-5">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        {isCustomer ? 'My Invoices' : 'Invoices'}
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        {isCustomer
                            ? 'View and pay your service invoices'
                            : 'Manage and send invoices to customers'}
                    </p>
                </div>
                {!isCustomer && (
                    <div className="flex flex-wrap gap-2.5 items-center">
                        {[
                            {
                                label: 'Total Invoices',
                                value: totalCount,
                                textColor: 'text-gray-900',
                                borderClass: 'border-indigo-100 hover:border-indigo-300',
                                iconBg: 'bg-indigo-50',
                                iconColor: 'text-indigo-600',
                                labelColor: 'text-indigo-600',
                                icon: <FileText className="w-4 h-4" />
                            },
                            {
                                label: 'Sent',
                                value: invoices.filter(i => i.status === 'sent').length,
                                textColor: 'text-gray-900',
                                borderClass: 'border-blue-100 hover:border-blue-300',
                                iconBg: 'bg-blue-50',
                                iconColor: 'text-blue-600',
                                labelColor: 'text-blue-600',
                                icon: <MailCheck className="w-4 h-4" />
                            },
                            {
                                label: 'Paid',
                                value: invoices.filter(i => i.status === 'paid').length,
                                textColor: 'text-gray-900',
                                borderClass: 'border-emerald-100 hover:border-emerald-300',
                                iconBg: 'bg-emerald-50',
                                iconColor: 'text-emerald-600',
                                labelColor: 'text-emerald-600',
                                icon: <CheckCircle2 className="w-4 h-4" />
                            },
                            {
                                label: 'Revenue',
                                value: '₹' + invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(String(i.total_amount)), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }),
                                textColor: 'text-gray-900',
                                borderClass: 'border-pink-100 hover:border-pink-300',
                                iconBg: 'bg-pink-50',
                                iconColor: 'text-pink-600',
                                labelColor: 'text-pink-600',
                                icon: <IndianRupee className="w-4 h-4" />
                            },
                        ].map(({ label, value, textColor, borderClass, iconBg, iconColor, labelColor, icon }) => (
                            <div
                                key={label}
                                className={`flex items-center bg-white border rounded-xl p-2 px-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer min-w-[130px] ${borderClass}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
                                    {icon}
                                </div>
                                <div className="flex flex-col items-start ml-2.5 leading-tight">
                                    <p className={`text-[9px] font-bold uppercase tracking-wider ${labelColor}`}>
                                        {label}
                                    </p>
                                    <p className={`text-sm font-extrabold mt-0.5 ${textColor}`}>
                                        {value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Status Tabs ── */}
            <div className="flex justify-start border-b border-gray-100 pb-1">
                <div className="flex gap-1.5 flex-wrap">
                    {['', 'sent', 'paid', 'draft', 'cancelled'].map((s) => {
                        const count = s === '' 
                            ? totalCount 
                            : invoices.filter(i => i.status === s).length;
                        return (
                            <button
                                key={s}
                                onClick={() => { setStatusFilter(s); setPage(1); }}
                                className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 transition-all ${
                                    statusFilter === s
                                        ? 'border-primary text-primary bg-primary/5'
                                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
                                }`}
                            >
                                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                                <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Data Table ── */}
            <DataTable
                columns={columns}
                data={mappedInvoices}
                searchKey="_search_blob"
                searchable={true}
                searchAlign="left"
                pagination={{
                    current: page,
                    pageSize: 15,
                    total: totalCount,
                    onChange: (newPage) => setPage(newPage),
                }}
                hoverable
                bordered
                density="compact"
                loading={isLoading}
                serverSidePagination={true}
            />
        </div>
    );
};

export default InvoicesListPage;
