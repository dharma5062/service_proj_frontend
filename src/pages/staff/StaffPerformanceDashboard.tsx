import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import {
    Users, Wrench, CheckCircle2, IndianRupee, AlertCircle,
    Star, ArrowLeft, Wallet,
    CreditCard, Calendar, Phone, Mail, BarChart2
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, Column } from '@/components/ui/table/datatable';
import {
    useStaffPerformanceApi,
    EmployeePerformance,
    EmployeeServiceRecord,
    EmployeeInvoiceRecord,
} from '@/pages/serviceAPI/StaffPerformanceAPI';
import { useAuth } from '@/AuthContext';

// ─── Helper ───────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatStatus = (status: string) =>
    status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—';

const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'paid') return 'bg-green-100 text-green-700 border-green-200';
    if (s === 'in_progress' || s === 'accepted' || s === 'ready') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s === 'waiting_parts') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (s === 'pending' || s === 'assigned') return 'bg-orange-100 text-orange-700 border-orange-200';
    if (s === 'cancelled') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
};

const renderStars = (rating: number | null) => {
    if (rating === null) return <span className="text-xs text-gray-400">No ratings</span>;
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={`h-3 w-3 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
                />
            ))}
            <span className="text-xs font-bold text-gray-700 ml-1">{rating.toFixed(1)}</span>
        </div>
    );
};

const getInitials = (name: string) =>
    name?.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '??';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: 'primary' | 'green' | 'amber' | 'blue' | 'red' | 'purple';
    subtitle?: string;
}

const colorMap = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'hover:border-primary/30' },
    green:   { bg: 'bg-green-100',  text: 'text-green-600', border: 'hover:border-green-200' },
    amber:   { bg: 'bg-amber-100',  text: 'text-amber-600', border: 'hover:border-amber-200' },
    blue:    { bg: 'bg-blue-100',   text: 'text-blue-600',  border: 'hover:border-blue-200' },
    red:     { bg: 'bg-red-100',    text: 'text-red-600',   border: 'hover:border-red-200' },
    purple:  { bg: 'bg-purple-100', text: 'text-purple-600',border: 'hover:border-purple-200' },
};

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
    const c = colorMap[color];
    return (
        <div className={`bg-white rounded border border-gray-200 p-2.5 shadow-sm`}>
            <div className="flex justify-between items-start mb-1 gap-1">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight">{title}</p>
                <div className={`p-1 rounded ${c.bg} shrink-0`}>
                    <Icon className={`h-3 w-3 ${c.text}`} />
                </div>
            </div>
            <p className={`text-base font-black ${c.text}`}>{value}</p>
            {subtitle && <p className="text-[9px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
    );
};

// ─── Top Services Card ────────────────────────────────────────────────────────

const TopServicesCard = ({ services }: { services: EmployeeServiceRecord[] }) => {
    const { chartData, totalServices } = useMemo(() => {
        if (!services || services.length === 0) return { chartData: [], totalServices: 0 };
        const counts: Record<string, number> = {};
        services.forEach(s => {
            const name = s.product_name || 'Other';
            counts[name] = (counts[name] || 0) + 1;
        });
        
        const sorted = Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
            
        const top3 = sorted.slice(0, 3);
        const remainingCount = sorted.slice(3).reduce((sum, item) => sum + item.count, 0);
        
        const chartData = [...top3];
        if (remainingCount > 0) {
            chartData.push({ name: 'Others', count: remainingCount });
        }
        
        return { chartData, totalServices: services.length };
    }, [services]);

    const colors = ['#3b82f6', '#22c55e', '#eab308', '#ef4444'];

    if (chartData.length === 0) return null;

    return (
        <div className="bg-white rounded border border-gray-200 shadow-sm p-3.5 flex flex-col h-full relative overflow-hidden group w-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded shrink-0">
                        <BarChart2 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-bold text-gray-900 leading-none">Top Services</h3>
                        <p className="text-[9px] text-gray-500 mt-0.5 font-medium">Service distribution</p>
                    </div>
                </div>
                <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider animate-pulse">Live</span>
            </div>

            {/* Content */}
            <div className="flex items-center gap-3 flex-1 min-h-0">
                {/* Donut Chart */}
                <div className="w-[85px] h-[85px] relative shrink-0">
                    <PieChart width={85} height={85}>
                        <Pie
                            data={chartData}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={40}
                            stroke="none"
                        >
                            {chartData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip 
                            contentStyle={{ borderRadius: '6px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px', padding: '4px 8px' }}
                            itemStyle={{ color: '#111827', fontWeight: 'bold' }}
                        />
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider leading-none mt-1">Total</span>
                        <span className="text-[11px] font-black text-gray-900 leading-none mt-0.5">{totalServices}</span>
                    </div>
                </div>

                {/* Bars */}
                <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
                    {chartData.map((item, index) => {
                        const pct = totalServices > 0 ? Math.round((item.count / totalServices) * 100) : 0;
                        const color = colors[index % colors.length];
                        return (
                            <div key={item.name} className="flex flex-col gap-1 w-full">
                                <div className="flex justify-between items-center text-[10px]">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                        <span className="font-bold text-gray-700 truncate text-[10px]" title={item.name}>{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 pl-2">
                                        <span className="text-[9px] text-gray-400 font-medium">{item.count} req</span>
                                        <span className="font-black text-gray-900 w-6 text-right text-[10px]">{pct}%</span>
                                    </div>
                                </div>
                                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${pct}%`, backgroundColor: color }} 
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ─── Employee History View ─────────────────────────────────────────────────────

const EmployeeHistoryView: React.FC<{ employeeId: number; onBack: () => void }> = ({ employeeId, onBack }) => {
    const { useGetEmployeeHistory } = useStaffPerformanceApi();
    const { data, isLoading } = useGetEmployeeHistory(employeeId);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'services';

    const handleTabChange = (val: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tab', val);
        setSearchParams(newParams, { replace: true });
    };
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('all');

    const ratings = data?.ratings ?? [];
    
    const filteredRatings = useMemo(() => {
        if (selectedRatingFilter === 'all') return ratings;
        return ratings.filter((r) => Math.round(r.rating) === parseInt(selectedRatingFilter));
    }, [ratings, selectedRatingFilter]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs text-gray-500">Loading employee history...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { employee, summary, services, invoices } = data;

    // Services table columns
    const serviceColumns: Column<EmployeeServiceRecord>[] = [
        {
            key: 'sr_number', title: 'SR #', dataIndex: 'sr_number', sortable: true,
            render: (v, r) => (
                <button 
                    onClick={() => navigate(`/dashboard/services/view/${r.id}`)}
                    className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded hover:bg-primary/20 hover:underline transition-colors"
                >
                    {v}
                </button>
            ),
        },
        {
            key: 'customer_name', title: 'Customer', dataIndex: 'customer_name', sortable: true,
            render: (v, r) => (
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-900">{v}</span>
                    <span className="text-[9px] text-gray-400">{r.customer_phone}</span>
                </div>
            ),
        },
        {
            key: 'product_name', title: 'Device', dataIndex: 'product_name', sortable: true,
            render: (v, r) => (
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-800">{v || '—'}</span>
                    <span className="text-[9px] text-gray-400">{r.brand_name}</span>
                </div>
            ),
        },
        {
            key: 'service_status', title: 'Status', dataIndex: 'service_status', sortable: true,
            render: (v) => (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getStatusBadge(v)}`}>
                    {formatStatus(v)}
                </span>
            ),
        },
        {
            key: 'rating', title: 'Rating', dataIndex: 'id', sortable: false, align: 'center' as const,
            render: (_, r) => {
                const ratingObj = ratings.find(rt => rt.service_id === r.id);
                return ratingObj ? renderStars(ratingObj.rating) : <span className="text-[9px] text-gray-400 italic">No rating</span>;
            }
        },
        {
            key: 'invoice_amount', title: 'Amount', dataIndex: 'invoice_amount', sortable: true, align: 'right' as const,
            render: (v, r) => (
                <div className="text-right">
                    <p className="text-[11px] font-bold text-gray-900">{v != null ? formatCurrency(v) : '—'}</p>
                    {r.invoice_status && (
                        <span className={`text-[8px] font-bold uppercase tracking-wider ${r.invoice_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                            {r.invoice_status === 'paid' ? '✓ Paid' : 'Unpaid'}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'created_at', title: 'Date', dataIndex: 'created_at', sortable: true,
            render: (v) => (
                <span className="text-[10px] font-medium text-gray-500">
                    {v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                </span>
            ),
        },

    ];

    // Invoices table columns
    const invoiceColumns: Column<EmployeeInvoiceRecord>[] = [
        {
            key: 'invoice_number', title: 'Invoice #', dataIndex: 'invoice_number', sortable: true,
            render: (v, r) => (
                <button 
                    onClick={() => navigate(`/dashboard/invoice/view/${r.id}`)}
                    className="text-[11px] font-mono font-bold text-primary hover:underline hover:text-primary/80 transition-colors"
                >
                    {v || '—'}
                </button>
            ),
        },
        {
            key: 'sr_number', title: 'SR #', dataIndex: 'sr_number', sortable: true,
            render: (v) => <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{v}</span>,
        },
        {
            key: 'customer_name', title: 'Customer', dataIndex: 'customer_name', sortable: true,
            render: (v) => <span className="text-[11px] font-bold text-gray-900">{v || 'Walk-in'}</span>,
        },
        {
            key: 'total_amount', title: 'Amount', dataIndex: 'total_amount', sortable: true, align: 'right' as const,
            render: (v) => <span className="text-[11px] font-bold text-gray-900">{formatCurrency(v)}</span>,
        },
        {
            key: 'status', title: 'Status', dataIndex: 'status', sortable: true,
            render: (v) => (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${v === 'paid' ? 'bg-green-50/80 text-green-700 border-green-100' : 'bg-amber-50/80 text-amber-700 border-amber-100'}`}>
                    {v === 'paid' ? '✓ Paid' : 'Pending'}
                </span>
            ),
        },
        {
            key: 'payment_type', title: 'Method', dataIndex: 'payment_type', sortable: true,
            render: (v) => <span className="text-[10px] font-medium text-gray-500 capitalize">{v || '—'}</span>,
        },
        {
            key: 'paid_at', title: 'Paid On', dataIndex: 'paid_at', sortable: true,
            render: (v) => (
                <span className="text-[10px] font-medium text-gray-500">
                    {v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            {/* Back button */}
            <Button variant="ghost" size="sm" className="gap-2 text-xs text-gray-500 hover:text-primary h-7 px-2" onClick={onBack}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Staff Performance
            </Button>

            {/* Top Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-2">
                {/* Employee Profile Card */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-3.5 flex flex-col justify-center">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        {/* Left: User Info */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Avatar className="h-11 w-11 shrink-0 border shadow-sm">
                                <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                                    {getInitials(employee.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-bold text-gray-900">{employee.name}</h2>
                                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded capitalize">
                                        {employee.role || 'Employee'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-500 mt-0.5">
                                    <span className="flex items-center gap-1 font-medium"><Mail className="h-2.5 w-2.5 text-gray-400" />{employee.email}</span>
                                    <span className="flex items-center gap-1 font-medium"><Phone className="h-2.5 w-2.5 text-gray-400" />{employee.phone || '—'}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Right: Top KPIs */}
                        <div className="flex items-center gap-4 shrink-0 w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-end bg-gray-50/50 md:bg-transparent p-2 md:p-0 rounded-md border md:border-none">
                            <div className="flex flex-col md:items-end">
                                <p className="text-sm font-black text-gray-800">{summary.total_services}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Services</p>
                            </div>
                            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                            <div className="flex flex-col md:items-end">
                                <p className="text-sm font-black text-green-600">{formatCurrency(summary.revenue_collected)}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Collected</p>
                            </div>
                            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                            <div className="flex flex-col md:items-end">
                                <div className="flex items-center gap-1 h-[20px]">
                                    {summary.avg_rating !== null ? (
                                        <>
                                            <span className="text-sm font-black text-amber-500">{summary.avg_rating.toFixed(1)}</span>
                                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                        </>
                                    ) : (
                                        <span className="text-xs font-bold text-gray-400">—</span>
                                    )}
                                </div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{summary.total_ratings} Ratings</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Detailed Status */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between bg-green-50 rounded p-2 border border-green-100/50">
                            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Completed</span>
                            <span className="text-sm font-black text-green-700">{summary.completed_services}</span>
                        </div>
                        <div className="flex items-center justify-between bg-blue-50 rounded p-2 border border-blue-100/50">
                            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">In Progress</span>
                            <span className="text-sm font-black text-blue-700">{summary.in_progress_services}</span>
                        </div>
                        <div className="flex items-center justify-between bg-amber-50 rounded p-2 border border-amber-100/50">
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending</span>
                            <span className="text-sm font-black text-amber-700">{summary.pending_services}</span>
                        </div>
                        <div className="flex items-center justify-between bg-red-50 rounded p-2 border border-red-100/50">
                            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Pending Amt</span>
                            <span className="text-sm font-black text-red-600">{formatCurrency(summary.pending_amount)}</span>
                        </div>
                    </div>
                </div>

                {/* Top Services Card */}
                <div className="lg:col-span-1 h-full min-w-0">
                    <TopServicesCard services={services} />
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger value="services" className="text-xs gap-1.5">
                        <Wrench className="h-3 w-3" /> Service History
                        <span className="ml-1 bg-gray-100 text-gray-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{services.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="text-xs gap-1.5">
                        <CreditCard className="h-3 w-3" /> Payment History
                        <span className="ml-1 bg-gray-100 text-gray-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{invoices.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="ratings" className="text-xs gap-1.5">
                        <Star className="h-3 w-3" /> Customer Ratings
                        <span className="ml-1 bg-gray-100 text-gray-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{ratings.length}</span>
                    </TabsTrigger>
                </TabsList>

                {/* Service History */}
                <TabsContent value="services" className="mt-3">
                    <DataTable
                        columns={serviceColumns}
                        data={services}
                        title="Service History"
                        searchable={true}
                        searchKey="customer_name"
                        showActions={false}
                        showExport={true}
                        filterConfig={[
                            {
                                key: 'service_status',
                                label: 'Status',
                                type: 'select',
                                options: [
                                    { label: 'Pending', value: 'pending' },
                                    { label: 'Assigned', value: 'assigned' },
                                    { label: 'Accepted', value: 'accepted' },
                                    { label: 'In Progress', value: 'in_progress' },
                                    { label: 'Waiting Parts', value: 'waiting_parts' },
                                    { label: 'Ready', value: 'ready' },
                                    { label: 'Completed', value: 'completed' },
                                    { label: 'Cancelled', value: 'cancelled' }
                                ]
                            },
                            {
                                key: 'invoice_status',
                                label: 'Invoice Status',
                                type: 'select',
                                options: [
                                    { label: 'Paid', value: 'paid' },
                                    { label: 'Unpaid', value: 'unpaid' }
                                ]
                            }
                        ]}
                        pagination={{
                            current: currentPage,
                            pageSize,
                            total: services.length,
                            onChange: (p) => setCurrentPage(p),
                        }}
                        hoverable
                        bordered
                        density="compact"
                    />
                </TabsContent>

                {/* Payment History */}
                <TabsContent value="payments" className="mt-3">
                    <DataTable
                        columns={invoiceColumns}
                        data={invoices as any[]}
                        title="Payment History"
                        searchable={true}
                        searchKey="customer_name"
                        showActions={false}
                        showExport={true}
                        filterConfig={[
                            {
                                key: 'status',
                                label: 'Status',
                                type: 'select',
                                options: [
                                    { label: 'Paid', value: 'paid' },
                                    { label: 'Pending', value: 'sent' },
                                    { label: 'Draft', value: 'draft' },
                                    { label: 'Cancelled', value: 'cancelled' }
                                ]
                            },
                            {
                                key: 'payment_type',
                                label: 'Method',
                                type: 'select',
                                options: [
                                    { label: 'Cash', value: 'cash' },
                                    { label: 'Online', value: 'online' },
                                    { label: 'UPI', value: 'upi' }
                                ]
                            }
                        ]}
                        pagination={{
                            current: currentPage,
                            pageSize,
                            total: invoices.length,
                            onChange: (p) => setCurrentPage(p),
                        }}
                        hoverable
                        bordered
                        density="compact"
                    />
                </TabsContent>

                {/* Customer Ratings — Card Style */}
                <TabsContent value="ratings" className="mt-3">
                    {ratings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100">
                            <Star className="h-10 w-10 text-gray-200 mb-3" />
                            <p className="text-sm font-semibold text-gray-500">No ratings yet</p>
                            <p className="text-xs text-gray-400 mt-1">Customer ratings will appear here after service completion</p>
                        </div>
                    ) : (() => {
                        // Compute breakdown
                        const avg = summary.avg_rating;
                        const starBreakdown = [5,4,3,2,1].map((s) => ({
                            star: s,
                            count: ratings.filter((r) => Math.round(r.rating) === s).length,
                        }));
                        return (
                            <div className="space-y-3">
                                {/* Summary Bar */}
                                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-lg p-2.5 flex flex-col sm:flex-row items-center gap-4">
                                    {/* Big avg */}
                                    <div className="text-center shrink-0">
                                        <p className="text-3xl font-black text-amber-500 leading-none">{avg?.toFixed(1) ?? '—'}</p>
                                        <div className="flex items-center justify-center gap-0.5 mt-1">
                                            {[1,2,3,4,5].map((s) => (
                                                <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(avg ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                                            ))}
                                        </div>
                                        <p className="text-[9px] text-amber-600 font-bold mt-1 capitalize tracking-wider">{ratings.length} reviews</p>
                                    </div>
                                    {/* Star breakdown */}
                                    <div className="flex-1 w-full space-y-0.5">
                                        {starBreakdown.map(({ star, count }) => {
                                            const pct = ratings.length ? Math.round((count / ratings.length) * 100) : 0;
                                            return (
                                                <div key={star} className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-gray-500 w-3 text-right">{star}</span>
                                                    <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 shrink-0" />
                                                    <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[9px] font-semibold text-gray-400 w-4">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Rating Filter Pills */}
                                <div className="flex flex-wrap items-center gap-1.5 py-1">
                                    <span className="text-[10px] font-bold text-gray-400 capitalize tracking-wider mr-1">Filter Ratings:</span>
                                    {['all', '5', '4', '3', '2', '1'].map((star) => {
                                        const count = star === 'all' 
                                            ? ratings.length 
                                            : ratings.filter((r) => Math.round(r.rating) === parseInt(star)).length;
                                        const isActive = selectedRatingFilter === star;
                                        return (
                                            <button
                                                key={star}
                                                onClick={() => setSelectedRatingFilter(star)}
                                                className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-all capitalize tracking-wider ${
                                                    isActive 
                                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm' 
                                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                {star === 'all' ? 'All' : `${star} Star`} ({count})
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Individual Rating Cards */}
                                <div className="space-y-2">
                                    {filteredRatings.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 bg-white rounded-xl border border-gray-100">
                                            <Star className="h-6 w-6 text-gray-200 mb-2" />
                                            <p className="text-xs font-semibold text-gray-500">No reviews match this filter</p>
                                        </div>
                                    ) : (
                                        filteredRatings.map((r) => (
                                            <div 
                                                key={r.id} 
                                                onClick={() => navigate(`/dashboard/services/view/${r.service_id}`)}
                                                className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-start gap-2.5">
                                                    {/* Avatar */}
                                                    <Avatar className="h-7 w-7 shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all rounded">
                                                        <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary rounded">
                                                            {getInitials(r.customer_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <p className="text-[11px] font-bold text-gray-900 group-hover:text-primary transition-colors">{r.customer_name}</p>
                                                                    <span className="text-[8px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded uppercase tracking-wider">
                                                                        SR#{r.service_id}
                                                                    </span>
                                                                </div>
                                                                {r.product_name && (
                                                                    <p className="text-[9px] text-gray-400 mt-0.5">{r.product_name}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-0.5">
                                                                {[1,2,3,4,5].map((s) => (
                                                                    <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                                                                ))}
                                                                <span className="text-[10px] font-bold text-gray-600 ml-1">{r.rating}/5</span>
                                                            </div>
                                                        </div>
                                                        {r.review && (
                                                            <p className="text-[10px] text-gray-600 italic bg-gray-50/80 rounded px-2.5 py-1.5 mt-1">
                                                                " {r.review} "
                                                            </p>
                                                        )}
                                                        <p className="text-[9px] font-medium text-gray-400 mt-1.5 text-right">
                                                            {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </TabsContent>
            </Tabs>
        </div>
    );
};

// ─── Main Staff Performance Dashboard ─────────────────────────────────────────

const StaffPerformanceDashboard: React.FC = () => {
    const { employeeId: routeEmployeeId } = useParams<{ employeeId?: string }>();
    const navigate = useNavigate();
    useAuth();
    const { useGetStaffPerformance } = useStaffPerformanceApi();
    const { data, isLoading } = useGetStaffPerformance();

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
        routeEmployeeId ? parseInt(routeEmployeeId) : null
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    const handleViewEmployee = (employee: EmployeePerformance) => {
        setSelectedEmployeeId(employee.id);
        navigate(`/dashboard/staff/performance/${employee.id}`);
    };

    const handleBack = () => {
        setSelectedEmployeeId(null);
        navigate('/dashboard/staff/performance');
    };

    const summary = data?.summary;
    const employees = data?.employees ?? [];

    const roleOptions = useMemo(() => {
        const roles = new Set<string>();
        employees.forEach((emp) => {
            if (emp.role) roles.add(emp.role);
        });
        return Array.from(roles).map((role) => ({
            label: role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            value: role,
        }));
    }, [employees]);

    // If we're showing employee drill-down
    if (selectedEmployeeId) {
        return (
            <div className="p-0">
                <EmployeeHistoryView employeeId={selectedEmployeeId} onBack={handleBack} />
            </div>
        );
    }

    const employeeColumns: Column<EmployeePerformance>[] = [
        {
            key: 'name', title: 'Employee', dataIndex: 'name', sortable: true,
            render: (v, r) => (
                <button 
                    onClick={() => handleViewEmployee(r)}
                    className="flex items-center gap-2 text-left group"
                >
                    <Avatar className="h-6 w-6 shrink-0 rounded">
                        <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary rounded">
                            {getInitials(v)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-[11px] font-bold text-gray-900 group-hover:text-primary group-hover:underline transition-colors">{v}</p>
                        <span className="text-[8px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded uppercase tracking-wider">
                            {r.role || 'Employee'}
                        </span>
                    </div>
                </button>
            ),
        },
        {
            key: 'total_services', title: 'Total', dataIndex: 'total_services', sortable: true, align: 'center' as const,
            render: (v) => (
                <span className="text-[11px] font-bold text-gray-800">{v}</span>
            ),
        },
        {
            key: 'completed_services', title: 'Completed', dataIndex: 'completed_services', sortable: true, align: 'center' as const,
            render: (v) => (
                <span className="text-[10px] font-bold text-green-700 bg-green-50/80 border border-green-100 px-1.5 py-0.5 rounded">{v}</span>
            ),
        },
        {
            key: 'in_progress_services', title: 'In Progress', dataIndex: 'in_progress_services', sortable: true, align: 'center' as const,
            render: (v) => (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50/80 border border-blue-100 px-1.5 py-0.5 rounded">{v}</span>
            ),
        },
        {
            key: 'pending_services', title: 'Pending', dataIndex: 'pending_services', sortable: true, align: 'center' as const,
            render: (v) => (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50/80 border border-amber-100 px-1.5 py-0.5 rounded">{v}</span>
            ),
        },
        {
            key: 'revenue_collected', title: 'Revenue Collected', dataIndex: 'revenue_collected', sortable: true, align: 'right' as const,
            render: (v) => (
                <span className="text-[11px] font-bold text-gray-900">{formatCurrency(v)}</span>
            ),
        },
        {
            key: 'pending_amount', title: 'Pending Amount', dataIndex: 'pending_amount', sortable: true, align: 'right' as const,
            render: (v) => (
                <span className={`text-[11px] font-bold ${v > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {v > 0 ? formatCurrency(v) : '—'}
                </span>
            ),
        },
        {
            key: 'avg_rating', title: 'Rating', dataIndex: 'avg_rating', sortable: true, align: 'center' as const,
            render: (v) => renderStars(v),
        },
        {
            key: 'last_service_date', title: 'Last Activity', dataIndex: 'last_service_date', sortable: true,
            render: (v) => (
                <span className="text-[10px] font-medium text-gray-400">
                    {v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                </span>
            ),
        },
    ];

    return (
        <div className="p-0">
            {/* Header */}
            <div className="flex flex-wrap justify-between gap-3 items-center mb-5">
                <div>
                    <h1 className="text-[15px] font-bold text-gray-900 tracking-tight">Staff Performance Dashboard</h1>
                    <p className="text-[10px] sm:text-sm mt-0.5 text-primary font-medium">
                        Complete performance overview of all shop employees
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1.5 shadow-sm">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-700">
                        {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                <KpiCard title="Total Employees"     value={summary?.total_employees ?? '—'}    icon={Users}        color="primary" />
                <KpiCard title="Total Services"      value={summary?.total_services ?? '—'}     icon={Wrench}       color="blue"    />
                <KpiCard title="Completed"           value={summary?.completed_services ?? '—'} icon={CheckCircle2} color="green"   />
                <KpiCard title="Pending"             value={summary?.pending_services ?? '—'}   icon={AlertCircle}  color="amber"   />
                <KpiCard
                    title="Revenue Collected"
                    value={summary ? formatCurrency(summary.total_revenue_collected) : '—'}
                    icon={IndianRupee}
                    color="green"
                />
                <KpiCard
                    title="Pending Amount"
                    value={summary ? formatCurrency(summary.total_pending_amount) : '—'}
                    icon={Wallet}
                    color="red"
                />
            </div>

            {/* Employee Performance Table */}
            <DataTable
                columns={employeeColumns}
                data={employees}
                title="Employee Performance"
                searchable={true}
                searchKey="name"
                showActions={false}
                showExport={true}
                loading={isLoading}
                filterConfig={[
                    ...(roleOptions.length > 0 ? [{
                        key: 'role',
                        label: 'Role',
                        type: 'select' as const,
                        options: roleOptions
                    }] : []),
                    {
                        key: 'active',
                        label: 'Status',
                        type: 'select' as const,
                        options: [
                            { label: 'Active', value: 'true' },
                            { label: 'Inactive', value: 'false' }
                        ]
                    }
                ]}
                pagination={{
                    current: currentPage,
                    pageSize,
                    total: employees.length,
                    onChange: (p) => setCurrentPage(p),
                }}
                hoverable
                bordered
                density="compact"
                emptyText={
                    isLoading ? 'Loading performance data...' :
                    employees.length === 0 ? 'No employees with assigned services found.' : undefined
                }
            />
        </div>
    );
};

export default StaffPerformanceDashboard;
