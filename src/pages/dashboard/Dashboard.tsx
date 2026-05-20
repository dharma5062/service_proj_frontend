import { useState, useMemo } from 'react';
import { Calendar, TrendingUp, Clock, CheckCircle2, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/table/datatable';
import { useAuth } from '@/AuthContext';
import { useServiceRequestsApi, ServiceRequest } from '@/pages/serviceAPI/ServiceRequestsAPI';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, isShopEmployee, isCustomer } = useAuth();
    const { useGetServiceRequests } = useServiceRequestsApi();
    const { data: rawServiceRequests = [], isLoading: loading } = useGetServiceRequests();

    // ─── Filtered Data ────────────────────────────────────────────────────────
    const filteredRequests = useMemo(() => {
        let filtered = [...rawServiceRequests];
        if (isShopEmployee && user?.id) {
            filtered = filtered.filter(req => req.assigned_technician?.id === user.id);
        } else if (isCustomer && user?.id) {
            filtered = filtered.filter(req => req.customer?.id === user.id);
        }
        return filtered.sort((a, b) => b.id - a.id);
    }, [rawServiceRequests, isShopEmployee, isCustomer, user?.id]);

    // ─── Stats Calculation ────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = filteredRequests.length;
        const pending = filteredRequests.filter(r => (r.service_status || r.status) === 'pending').length;
        const assigned = filteredRequests.filter(r => (r.service_status || r.status) === 'assigned').length;
        const inProgress = filteredRequests.filter(r => (r.service_status || r.status) === 'in_progress').length;
        const completed = filteredRequests.filter(r => (r.service_status || r.status) === 'completed').length;

        return [
            { title: "Total Services", value: total.toString(), trend: 'up', icon: Clock, color: 'primary' },
            { title: 'Pending Requests', value: pending.toString(), trend: 'up', icon: AlertCircle, color: 'danger' },
            { title: 'Assigned Requests', value: assigned.toString(), trend: 'up', icon: User, color: 'blue' },
            { title: 'In Progress', value: inProgress.toString(), trend: 'up', icon: TrendingUp, color: 'warning' },
            { title: 'Completed Services', value: completed.toString(), trend: 'up', icon: CheckCircle2, color: 'secondary' },
        ];
    }, [filteredRequests]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);


    const formatStatus = (status: string) => {
        if (!status) return 'Pending';
        return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const columns: Column<ServiceRequest>[] = [
        {
            key: 'id',
            title: 'Request ID',
            dataIndex: 'id',
            sortable: true,
            render: (value) => (
                <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                    SR{String(value).padStart(3, '0')}
                </span>
            ),
        },
        {
            key: 'customer',
            title: 'Customer',
            dataIndex: 'customer',
            sortable: true,
            render: (_value, record) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900 leading-tight">{record.customer?.name || 'Walk-in'}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">{record.customer?.phone || ''}</span>
                </div>
            ),
        },
        {
            key: 'service',
            title: 'Service / Device',
            dataIndex: 'form',
            sortable: true,
            render: (_value, record) => (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-900 leading-tight">{record.form?.name || 'Repair'}</span>
                    <span className="text-[10px] text-primary mt-0.5 font-medium">{record.product?.name || record.brand?.name || ''}</span>
                </div>
            ),
        },
        {
            key: 'status',
            title: 'Progress',
            dataIndex: 'service_status',
            sortable: true,
            render: (_value, record) => {
                const status = (record.service_status || record.status || 'pending').toLowerCase();
                let progress = 0;
                let colorClass = 'bg-gray-200';
                let indicatorClass = 'bg-gray-500';

                if (status === 'pending') { progress = 25; colorClass = 'bg-[#C6212C]/20'; indicatorClass = 'bg-[#C6212C]'; }
                else if (status === 'assigned') { progress = 50; colorClass = 'bg-blue-100'; indicatorClass = 'bg-blue-500'; }
                else if (status === 'in_progress') { progress = 75; colorClass = 'bg-[#F7B318]/20'; indicatorClass = 'bg-[#F7B318]'; }
                else if (status === 'completed') { progress = 100; colorClass = 'bg-green-100'; indicatorClass = 'bg-green-500'; }
                else if (status === 'cancelled') { progress = 100; colorClass = 'bg-red-100'; indicatorClass = 'bg-red-500'; }

                const displayLabel = formatStatus(status);
                const tooltipContent = status === 'assigned' && record.assigned_technician
                    ? `Assigned to ${record.assigned_technician.name}`
                    : displayLabel;

                return (
                    <div className="w-24 group relative" title={tooltipContent}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-semibold text-gray-700">{displayLabel}</span>
                            <span className="text-[9px] text-gray-500">{progress}%</span>
                        </div>
                        <div className={`h-1.5 w-full rounded-full ${colorClass} overflow-hidden`}>
                            <div className={`h-full ${indicatorClass} rounded-full transition-all duration-300`} style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'created_at',
            title: 'Date',
            dataIndex: 'created_at',
            sortable: true,
            render: (value) => (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                    {value ? new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : '-'}
                </span>
            ),
        },
    ];

    return (
        <div className="p-0">
            {/* Compact Page Header */}
            <div className="flex flex-wrap justify-between gap-3 items-center mb-5">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-xs sm:text-sm mt-0.5 text-primary font-medium">
                        {isShopEmployee ? `Assigned to ${user?.name}` : isCustomer ? 'My Service Requests' : 'Overview of service operations'}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1.5 shadow-sm">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-700">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {stats.map((stat, index) => {
                    const colorClasses: Record<string, string> = {
                        primary: 'hover:border-primary/40 bg-white',
                        warning: 'hover:border-warning/40 bg-white',
                        secondary: 'hover:border-secondary/40 bg-white',
                        blue: 'hover:border-blue-400/40 bg-white',
                        danger: 'hover:border-destructive/40 bg-white',
                    };
                    const iconBgClasses: Record<string, string> = {
                        primary: 'bg-primary/10 text-primary',
                        warning: 'bg-warning/10 text-warning',
                        secondary: 'bg-secondary/10 text-secondary',
                        blue: 'bg-blue-100 text-blue-600',
                        danger: 'bg-destructive/10 text-destructive',
                    };

                    return (
                        <div key={index} className={`rounded-xl border border-gray-100 p-4 shadow-sm transition-all duration-200 ${colorClasses[stat.color || 'primary']}`}>
                            <div className="flex justify-between items-start mb-2.5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {stat.title}
                                </p>
                                <div className={`p-1.5 rounded-lg ${iconBgClasses[stat.color || 'primary']}`}>
                                    <stat.icon className="h-3.5 w-3.5" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-gray-900">
                                    {stat.value}
                                </p>
                                <div className={`flex items-center text-[10px] font-bold ${stat.color === 'warning' ? 'text-warning' : stat.color === 'danger' ? 'text-destructive' : 'text-secondary'}`}>
                                    <TrendingUp className="h-3 w-3 mr-0.5" />
                                    {/* {stat.change} */}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Service Requests - DataTable */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold text-gray-900">
                        {isShopEmployee ? 'My Assigned Requests' : isCustomer ? 'My Requests' : 'Recent Service Requests'}
                    </h2>
                    <Button
                        variant="link"
                        size="sm"
                        className="text-primary text-[10px] font-bold h-6 p-0"
                        onClick={() => navigate('/dashboard/services')}
                    >
                        View All
                    </Button>
                </div>
                <DataTable
                    columns={columns}
                    data={filteredRequests}
                    title={isShopEmployee ? 'Active Tasks' : isCustomer ? 'My Services' : 'All Requests'}
                    searchable={false}
                    showActions={true}
                    loading={loading}
                    onView={(record) => navigate(`/dashboard/services/view/${record.id}`)}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: filteredRequests.length,
                        onChange: (page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        },
                    }}
                    hoverable
                    bordered
                />
            </div>
        </div>
    );
};

export default Dashboard;
