import { useState, useMemo } from 'react';
import { Calendar, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/table/tableComponents';
import { useAuth } from '@/AuthContext';
import { useServiceRequestsApi, ServiceRequest } from '@/pages/serviceAPI/ServiceRequestsAPI';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, isShopEmployee } = useAuth();
    const { useGetServiceRequests } = useServiceRequestsApi();
    const { data: rawServiceRequests = [], isLoading: loading } = useGetServiceRequests();

    // ─── Filtered Data ────────────────────────────────────────────────────────
    const filteredRequests = useMemo(() => {
        let filtered = [...rawServiceRequests];
        if (isShopEmployee && user?.id) {
            filtered = filtered.filter(req => req.assigned_technician?.id === user.id);
        }
        return filtered.sort((a, b) => b.id - a.id);
    }, [rawServiceRequests, isShopEmployee, user?.id]);

    // ─── Stats Calculation ────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = filteredRequests.length;
        const pending = filteredRequests.filter(r => (r.service_status || r.status) === 'pending').length;
        const inProgress = filteredRequests.filter(r => (r.service_status || r.status) === 'in_progress').length;
        const completed = filteredRequests.filter(r => (r.service_status || r.status) === 'completed').length;

        return [
            { title: "Total Services", value: total.toString(), change: '+0%', trend: 'up', icon: Clock },
            { title: 'Pending Requests', value: pending.toString(), change: '+0%', trend: 'up', icon: AlertCircle },
            { title: 'In Progress', value: inProgress.toString(), change: '+0%', trend: 'up', icon: TrendingUp },
            { title: 'Completed Services', value: completed.toString(), change: '+0%', trend: 'up', icon: CheckCircle2 },
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
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap">
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
                    <span className="text-[10px] text-blue-600 mt-0.5 font-medium">{record.product?.name || record.brand?.name || ''}</span>
                </div>
            ),
        },
        {
            key: 'status',
            title: 'Status',
            dataIndex: 'service_status',
            sortable: true,
            render: (_value, record) => {
                const status = record.service_status || record.status || 'pending';
                const styleMap: Record<string, string> = {
                    in_progress: 'text-blue-700 bg-blue-50',
                    assigned: 'text-purple-700 bg-purple-50 border border-purple-100',
                    pending: 'text-yellow-700 bg-yellow-50',
                    completed: 'text-green-700 bg-green-50',
                    cancelled: 'text-red-700 bg-red-50',
                };
                const key = status.toLowerCase();
                const style = styleMap[key] ?? 'text-gray-700 bg-gray-50';
                return (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${style}`}>
                        {formatStatus(status)}
                    </span>
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
                    <p className="text-xs text-blue-600 mt-0.5 font-medium">
                        {isShopEmployee ? `Assigned to ${user?.name}` : 'Overview of service operations'}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1.5 shadow-sm">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-700">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-blue-100 transition-colors">
                        <div className="flex justify-between items-start mb-2.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {stat.title}
                            </p>
                            <div className="p-1.5 bg-blue-50 rounded-lg">
                                <stat.icon className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-gray-900">
                                {stat.value}
                            </p>
                            <div className="flex items-center text-[10px] font-bold text-green-500">
                                <TrendingUp className="h-3 w-3 mr-0.5" />
                                {stat.change}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Service Requests - DataTable */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold text-gray-900">
                        {isShopEmployee ? 'My Assigned Requests' : 'Recent Service Requests'}
                    </h2>
                    <Button
                        variant="link"
                        size="sm"
                        className="text-blue-600 text-[10px] font-bold h-6 p-0"
                        onClick={() => navigate('/dashboard/services')}
                    >
                        View All
                    </Button>
                </div>
                <DataTable
                    columns={columns}
                    data={filteredRequests}
                    title={isShopEmployee ? 'Active Tasks' : 'All Requests'}
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
