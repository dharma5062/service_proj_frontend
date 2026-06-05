import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { useInvoiceApi, Invoice } from '@/pages/serviceAPI/InvoiceAPI';
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
    TrendingUp,
    Layers,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string; dotColor: string; icon: React.ReactNode }> = {
    draft:     { label: 'Draft',     className: 'bg-amber-50 text-amber-700 border-amber-200',   dotColor: 'bg-amber-400', icon: <Clock className="w-3 h-3" /> },
    sent:      { label: 'Sent',      className: 'bg-blue-50 text-blue-700 border-blue-200',       dotColor: 'bg-blue-500',  icon: <MailCheck className="w-3 h-3" /> },
    paid:      { label: 'Paid',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500', icon: <CheckCircle2 className="w-3 h-3" /> },
    cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200',           dotColor: 'bg-red-500',   icon: <XCircle className="w-3 h-3" /> },
};

const getStatusConfig = (status: string) =>
    STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-50 text-gray-600 border-gray-200', dotColor: 'bg-gray-400', icon: null };


const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    } catch { return dateStr; }
};

// ─── Tab filter config ─────────────────────────────────────────────────────────
const TAB_FILTERS = [
    { value: '',          label: 'All',       activeClass: 'border-[#1F80FF] text-[#1F80FF] bg-blue-50/60',  dotClass: 'bg-gray-400' },
    { value: 'sent',      label: 'Sent',      activeClass: 'border-blue-500 text-blue-700 bg-blue-50/60',    dotClass: 'bg-blue-500' },
    { value: 'paid',      label: 'Paid',      activeClass: 'border-emerald-500 text-emerald-700 bg-emerald-50/60', dotClass: 'bg-emerald-500' },
    { value: 'draft',     label: 'Draft',     activeClass: 'border-amber-500 text-amber-700 bg-amber-50/60',  dotClass: 'bg-amber-400' },
    { value: 'cancelled', label: 'Cancelled', activeClass: 'border-red-500 text-red-700 bg-red-50/60',       dotClass: 'bg-red-500' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const InvoicesListPage = () => {
    const navigate = useNavigate();
    const { isCustomer, isShopOwner, isSuperAdmin } = useAuth();
    const { useGetInvoices, useResendInvoice } = useInvoiceApi();

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [statusFilter, setStatusFilter] = useState('');

    const { data: paginated, isLoading } = useGetInvoices({
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

    const mappedInvoices = useMemo(() => {
        return invoices.map((inv) => ({
            ...inv,
            _search_blob: `${inv.invoice_number} ${inv.customer?.name ?? ''} ${inv.service?.product?.name ?? ''} ${inv.service?.brand?.name ?? ''}`.toLowerCase(),
        }));
    }, [invoices]);

    // ── Revenue stats ──
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const sentInvoices = invoices.filter(i => i.status === 'sent');
    const totalRevenue = paidInvoices.reduce((s, i) => s + parseFloat(String(i.total_amount)), 0);
    const pendingRevenue = sentInvoices.reduce((s, i) => s + parseFloat(String(i.total_amount)), 0);

    // ── Stats cards ──
    const statsCards = [
        {
            label: 'Total Invoices',
            value: totalCount,
            icon: <Layers className="w-4 h-4" />,
            gradient: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            border: 'border-blue-100',
            subtxt: `${invoices.length} loaded`,
        },
        {
            label: 'Sent',
            value: sentInvoices.length,
            icon: <MailCheck className="w-4 h-4" />,
            gradient: 'from-indigo-500 to-indigo-600',
            bg: 'bg-indigo-50',
            text: 'text-indigo-700',
            border: 'border-indigo-100',
            subtxt: 'Awaiting payment',
        },
        {
            label: 'Paid',
            value: paidInvoices.length,
            icon: <CheckCircle2 className="w-4 h-4" />,
            gradient: 'from-emerald-500 to-emerald-600',
            bg: 'bg-emerald-50',
            text: 'text-emerald-700',
            border: 'border-emerald-100',
            subtxt: 'Completed',
        },
        {
            label: 'Revenue',
            value: '₹' + totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
            icon: <TrendingUp className="w-4 h-4" />,
            gradient: 'from-pink-500 to-rose-500',
            bg: 'bg-pink-50',
            text: 'text-pink-700',
            border: 'border-pink-100',
            subtxt: pendingRevenue > 0 ? `₹${pendingRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} pending` : 'All collected',
        },
    ];

    // ── DataTable columns ──
    const columns: Column<Invoice>[] = useMemo(() => {
        const cols: Column<Invoice>[] = [
            {
                key: 'invoice_number',
                title: 'Invoice',
                dataIndex: 'invoice_number',
                sortable: true,
                render: (_: any, inv: Invoice) => (
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#1F80FF] to-[#0055cc] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <FileText className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-xs font-mono tracking-tight">
                                {inv.invoice_number}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">SR #{inv.service_id}</p>
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
                            <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-3.5 h-3.5 text-gray-500" />
                            </div>
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
                    <div className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
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
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
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
                title: 'Amount',
                align: 'right' as const,
                render: (_: any, inv: Invoice) => (
                    <div className="flex items-center gap-1 justify-end">
                        <IndianRupee className="w-3 h-3 text-gray-400" />
                        <span className="font-black text-gray-900 text-xs">
                            {parseFloat(String(inv.total_amount)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                )
            },
            {
                key: 'status',
                title: 'Status',
                align: 'center' as const,
                render: (_: any, inv: Invoice) => {
                    const sc = getStatusConfig(inv.status);
                    return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${sc.className}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dotColor}`} />
                            {sc.label}
                        </span>
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
                                className="h-7 px-2.5 text-[10px] gap-1 rounded-lg border-gray-200 hover:border-[#1F80FF] hover:text-[#1F80FF] hover:bg-blue-50 font-semibold transition-all"
                                onClick={() => navigate(`/dashboard/invoice/view/${inv.id}`)}
                            >
                                <Eye className="w-3 h-3" />
                                View
                            </Button>
                            {canResend && inv.status !== 'paid' && (
                                <Button
                                    id={`resend-invoice-${inv.id}`}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2.5 text-[10px] gap-1 rounded-lg text-blue-600 hover:bg-blue-50 font-semibold transition-all"
                                    disabled={isResending}
                                    onClick={() => handleResend(inv)}
                                >
                                    <Send className="w-3 h-3" />
                                    Resend
                                </Button>
                            )}
                            {isCustomer && inv.status === 'sent' && (
                                <Button
                                    id={`pay-invoice-${inv.id}`}
                                    size="sm"
                                    className="h-7 px-2.5 text-[10px] gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm font-bold transition-all"
                                    onClick={() => navigate(`/dashboard/invoice/view/${inv.id}`)}
                                >
                                    <CreditCard className="w-3 h-3" />
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
        <div className="p-0 space-y-5">

            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-gray-100">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-[#1F80FF] to-[#0055cc] rounded-xl flex items-center justify-center shadow-sm">
                            <FileText className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-tight">
                                {isCustomer ? 'My Invoices' : 'Invoices'}
                            </h1>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {isCustomer
                                    ? 'View and pay your service invoices'
                                    : 'Manage and send invoices to customers'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Stats Cards ── */}
                {!isCustomer && (
                    <div className="flex flex-wrap gap-2 items-center">
                        {statsCards.map(({ label, value, icon, bg, text, border, subtxt }) => (
                            <div
                                key={label}
                                className={`flex items-center gap-3 bg-white border rounded-xl px-3.5 py-2.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default min-w-[130px] ${border}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg} ${text}`}>
                                    {icon}
                                </div>
                                <div className="leading-tight">
                                    <p className={`text-[9px] font-bold uppercase tracking-wider ${text}`}>{label}</p>
                                    <p className="text-sm font-extrabold text-gray-900 mt-0.5">{value}</p>
                                    <p className="text-[9px] text-gray-400">{subtxt}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Status Filter Tabs ── */}
            <div className="flex justify-start gap-1 border-b border-gray-100 pb-0">
                {TAB_FILTERS.map((tab) => {
                    const count = tab.value === ''
                        ? totalCount
                        : invoices.filter(i => i.status === tab.value).length;
                    const isActive = statusFilter === tab.value;
                    return (
                        <button
                            key={tab.value}
                            id={`filter-tab-${tab.value || 'all'}`}
                            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                            className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all duration-200 ${
                                isActive
                                    ? tab.activeClass
                                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                            } rounded-t-lg`}
                        >
                            {isActive && tab.value && (
                                <span className={`w-1.5 h-1.5 rounded-full ${tab.dotClass}`} />
                            )}
                            {tab.label}
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                isActive ? 'bg-white/80 text-gray-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
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
                    pageSize: pageSize,
                    total: mappedInvoices.length,
                    onChange: (newPage, newPageSize) => {
                        setPage(newPage);
                        setPageSize(newPageSize);
                    },
                }}
                hoverable
                bordered
                density="compact"
                loading={isLoading}
            />
        </div>
    );
};

export default InvoicesListPage;
