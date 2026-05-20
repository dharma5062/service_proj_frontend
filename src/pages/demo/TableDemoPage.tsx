import { useState } from 'react';
import { DataTable, Column, HeaderStat, HeaderAction, FilterConfig } from '@/components/ui/table/datatable';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, DollarSign, Activity, Settings, Plus, Download, Printer, ActivitySquare, AlertCircle, Wrench, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// --- Mock Data: Users ---
interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'inactive' | 'pending';
    lastLogin: string;
}

const MOCK_USERS: User[] = [
    { id: 1, name: 'Alex Johnson', email: 'alex@example.com', role: 'Admin', status: 'active', lastLogin: '2023-10-15' },
    { id: 2, name: 'Sarah Williams', email: 'sarah@example.com', role: 'Editor', status: 'active', lastLogin: '2023-10-14' },
    { id: 3, name: 'Michael Brown', email: 'michael@example.com', role: 'Viewer', status: 'inactive', lastLogin: '2023-09-20' },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com', role: 'Editor', status: 'pending', lastLogin: '2023-10-16' },
    { id: 5, name: 'James Wilson', email: 'james@example.com', role: 'Viewer', status: 'active', lastLogin: '2023-10-10' },
    { id: 6, name: 'Sophia Taylor', email: 'sophia@example.com', role: 'Viewer', status: 'active', lastLogin: '2023-10-11' },
    { id: 7, name: 'David Anderson', email: 'david@example.com', role: 'Admin', status: 'inactive', lastLogin: '2023-08-05' },
    { id: 8, name: 'Emma Thomas', email: 'emma@example.com', role: 'Editor', status: 'active', lastLogin: '2023-10-12' },
];

const userColumns: Column<User>[] = [
    { key: 'name', title: 'User Name', dataIndex: 'name', sortable: true, description: 'Full name of the user', minWidth: 150 },
    { key: 'email', title: 'Email Address', dataIndex: 'email', sortable: true, ellipsis: true, maxWidth: 200 },
    {
        key: 'role', title: 'Role', dataIndex: 'role', filterable: true, sortable: true, filterOptions: [
            { label: 'Admin', value: 'Admin' }, { label: 'Editor', value: 'Editor' }, { label: 'Viewer', value: 'Viewer' }
        ]
    },
    {
        key: 'status', title: 'Status', dataIndex: 'status', align: 'center', sortable: true,
        render: (val) => (
            <Badge variant={val === 'active' ? 'default' : val === 'pending' ? 'outline' : 'secondary'}
                className={val === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : val === 'pending' ? 'text-amber-600 border-amber-600' : ''}>
                {val.charAt(0).toUpperCase() + val.slice(1)}
            </Badge>
        )
    },
    { key: 'lastLogin', title: 'Last Login', dataIndex: 'lastLogin', sortable: true },
];

const userStats: HeaderStat[] = [
    { label: 'Total Users', value: 1254, icon: <Users className="h-4 w-4" />, trend: 'up', trendValue: '12%', color: 'primary' },
    { label: 'Active Today', value: 142, icon: <Activity className="h-4 w-4" />, trend: 'neutral', trendValue: '0%', color: 'success' },
];

const userFilters: FilterConfig[] = [
    { key: 'role', label: 'User Role', type: 'select', options: [{ label: 'Admin', value: 'Admin' }, { label: 'Editor', value: 'Editor' }, { label: 'Viewer', value: 'Viewer' }] },
    { key: 'status', label: 'Account Status', type: 'select', options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }, { label: 'Pending', value: 'pending' }] },
];


// --- Mock Data: Orders ---
interface Order {
    id: string;
    customer: string;
    amount: number;
    status: 'completed' | 'processing' | 'failed';
    date: string;
}

const MOCK_ORDERS: Order[] = Array.from({ length: 45 }).map((_, i) => ({
    id: `ORD-${2000 + i}`,
    customer: ['Acme Corp', 'Globex', 'Soylent Corp', 'Initech', 'Umbrella Corp'][Math.floor(Math.random() * 5)],
    amount: Math.floor(Math.random() * 10000) + 100,
    status: ['completed', 'processing', 'failed'][Math.floor(Math.random() * 3)] as any,
    date: `2023-10-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
}));

const orderColumns: Column<Order>[] = [
    { key: 'id', title: 'Order ID', dataIndex: 'id', sortable: true, className: 'font-mono text-xs' },
    { key: 'customer', title: 'Customer', dataIndex: 'customer', sortable: true },
    {
        key: 'amount', title: 'Amount', dataIndex: 'amount', sortable: true, align: 'right',
        render: (val) => <span className="font-semibold">${val.toLocaleString()}</span>
    },
    {
        key: 'status', title: 'Status', dataIndex: 'status', align: 'center', sortable: true,
        render: (val) => (
            <Badge variant="outline" className={
                val === 'completed' ? 'border-green-500 text-green-600' :
                    val === 'processing' ? 'border-blue-500 text-blue-600' :
                        'border-red-500 text-red-600'
            }>
                {val.toUpperCase()}
            </Badge>
        )
    },
    { key: 'date', title: 'Date', dataIndex: 'date', sortable: true, align: 'right' },
];

const orderStats: HeaderStat[] = [
    { label: 'Total Revenue', value: '$45,231', icon: <DollarSign className="h-4 w-4" />, trend: 'up', trendValue: '23.4%', color: 'success' },
    { label: 'Orders (30d)', value: 892, icon: <TrendingUp className="h-4 w-4" />, color: 'primary' },
];

// --- Mock Data: Service Requests ---
interface ServiceRequest {
    id: string;
    image: string;
    problem: string;
    progress: number;
    customer: { name: string; phone: string; address: string };
    technician: string;
    cost: number;
    date: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
}

const MOCK_SERVICES: ServiceRequest[] = [
    { id: 'SR-1001', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=100&q=80', problem: 'Water leaking from bottom of washing machine', progress: 25, customer: { name: 'John Doe', phone: '555-0100', address: '123 Main St' }, technician: 'Mike Smith', cost: 150, date: '2023-10-25', priority: 'high' },
    { id: 'SR-1002', image: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=100&q=80', problem: 'AC unit not cooling properly', progress: 80, customer: { name: 'Alice Ray', phone: '555-0102', address: '456 Oak Ave' }, technician: 'Sarah Jones', cost: 320, date: '2023-10-26', priority: 'medium' },
    { id: 'SR-1003', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&q=80', problem: 'Making loud noise during spin cycle', progress: 10, customer: { name: 'Bob Ford', phone: '555-0103', address: '789 Pine Ln' }, technician: 'Unassigned', cost: 0, date: '2023-10-27', priority: 'critical' },
    { id: 'SR-1004', image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=100&q=80', problem: 'Microwave door won\'t close', progress: 100, customer: { name: 'Carol Dan', phone: '555-0104', address: '321 Elm St' }, technician: 'Mike Smith', cost: 85, date: '2023-10-24', priority: 'low' },
];

const serviceColumns: Column<ServiceRequest>[] = [
    { key: 'image', title: 'Image', dataIndex: 'image', render: (val) => <img src={val} alt="Defect" className="w-10 h-10 rounded-md object-cover border" /> },
    {
        key: 'problem', title: 'Problem/Defect', dataIndex: 'problem', sortable: true, ellipsis: true, maxWidth: 220,
        render: (val, record) => (
            <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-xs leading-tight">{val}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className={cn("px-1 py-0 h-4 text-[9px] uppercase tracking-wider",
                        record.priority === 'critical' ? "border-red-500 text-red-600 bg-red-50" :
                            record.priority === 'high' ? "border-orange-500 text-orange-600 bg-orange-50" :
                                record.priority === 'medium' ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-500 text-gray-600 bg-gray-50"
                    )}>{record.priority}</Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">{record.id}</span>
                </div>
            </div>
        )
    },
    {
        key: 'customer', title: 'Customer Info', dataIndex: 'customer',
        render: (val) => (
            <div className="flex flex-col">
                <span className="text-xs font-semibold">{val.name}</span>
                <span className="text-[10px] text-muted-foreground">{val.phone}</span>
            </div>
        )
    },
    {
        key: 'technician', title: 'Technician', dataIndex: 'technician', sortable: true,
        render: (val) => (
            <span className="flex items-center gap-1 text-xs">
                <UserIcon className="h-3 w-3 text-muted-foreground/70" />
                {val}
            </span>
        )
    },
    {
        key: 'progress', title: 'Progress', dataIndex: 'progress', sortable: true, width: 140,
        render: (val) => (
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", val === 100 ? "bg-green-500" : val > 50 ? "bg-blue-500" : val > 0 ? "bg-amber-500" : "bg-gray-300")} style={{ width: `${Math.max(val, 5)}%` }} />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground w-6 text-right">{val}%</span>
            </div>
        )
    },
    {
        key: 'cost', title: 'Service Cost', dataIndex: 'cost', sortable: true, align: 'right',
        render: (val) => val > 0 ? <span className="font-semibold text-xs whitespace-nowrap">${val.toFixed(2)}</span> : <span className="text-[10px] text-muted-foreground uppercase tracking-wider bg-muted/50 px-1.5 py-0.5 rounded">Pending</span>
    },
];

const serviceStats: HeaderStat[] = [
    { label: 'Total Requests', value: '1,045', icon: <ActivitySquare />, color: 'primary' },
    { label: 'Critical Defects', value: '13', icon: <AlertCircle />, color: 'danger' },
    { label: 'Active Techs', value: '42', icon: <Wrench />, color: 'success' },
];

export default function TableDemoPage() {
    const [userPagination, setUserPagination] = useState({ current: 1, pageSize: 5, total: MOCK_USERS.length });
    const [orderPagination, setOrderPagination] = useState({ current: 1, pageSize: 5, total: MOCK_ORDERS.length });
    const [servicePagination, setServicePagination] = useState({ current: 1, pageSize: 5, total: MOCK_SERVICES.length });
    const [selectedUsers, setSelectedUsers] = useState<(string | number)[]>([]);

    const userActions: HeaderAction[] = [
        { key: 'add', label: 'New User', icon: <Plus className="h-3.5 w-3.5" />, onClick: () => toast('Create new user clicked'), variant: 'default' },
        { key: 'export', label: 'Export', icon: <Download className="h-3.5 w-3.5" />, onClick: () => toast('Exporting users...'), variant: 'outline' },
    ];

    const orderActions: HeaderAction[] = [
        { key: 'print', label: 'Print Report', icon: <Printer className="h-3.5 w-3.5" />, onClick: () => toast('Printing...'), variant: 'secondary' as any },
        { key: 'settings', label: 'View Settings', icon: <Settings className="h-3.5 w-3.5" />, onClick: () => toast('Opening settings...'), variant: 'outline' },
    ];

    const serviceActions: HeaderAction[] = [
        { key: 'add', label: 'New Request', icon: <Plus className="h-3.5 w-3.5" />, onClick: () => toast('Create new request'), variant: 'default' },
    ];

    return (
        <div className="p-6 space-y-8 bg-muted/20 min-h-screen">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">DataTable Showcase</h1>
                <p className="text-muted-foreground mt-1">Explore the new capabilities of the enhanced DataTable component.</p>
            </div>

            {/* Example 3: Service Requests (New) */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">1. Service Requests (Compact & Feature-rich)</h2>
                    <p className="text-sm text-muted-foreground mb-2">Features: Compact density, Inline badge stats, Custom column rendering (Images, Progress bars, Complex data).</p>
                </div>
                <DataTable
                    title="Active Service Requests"
                    data={MOCK_SERVICES}
                    columns={serviceColumns}
                    density="compact"
                    headerStats={serviceStats}
                    headerActions={serviceActions}
                    searchable={true}
                    striped={true}
                    defaultSort={{ key: 'priority', direction: 'desc' }}
                    pagination={{
                        ...servicePagination,
                        onChange: (page, size) => setServicePagination(prev => ({ ...prev, current: page, pageSize: size }))
                    }}
                    onView={(record) => toast(`Viewing request ${record.id}`)}
                    onEdit={(record) => toast(`Editing request ${record.id}`)}
                    showActions={true}
                />
            </section>

            {/* Example 1: Comfortable Density, Rich Header, Popover Filters, Row Selection */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">2. User Management (Comfortable Density)</h2>
                    <p className="text-sm text-muted-foreground mb-2">Features: Comfortable sizing, Popover filters, Row selection.</p>
                </div>
                <DataTable
                    title="System Users"
                    description="Manage team members and their account permissions."
                    data={MOCK_USERS}
                    columns={userColumns}
                    density="comfortable"
                    headerStats={userStats}
                    headerActions={userActions}
                    filterConfig={userFilters}
                    searchable={true}
                    rowSelection={true}
                    selectedRowKeys={selectedUsers}
                    onSelectionChange={(keys) => setSelectedUsers(keys)}
                    pagination={{
                        ...userPagination,
                        onChange: (page, size) => setUserPagination(prev => ({ ...prev, current: page, pageSize: size }))
                    }}
                    onView={(record) => toast(`View user: ${record.name}`)}
                    onEdit={(record) => toast(`Edit user: ${record.name}`)}
                    onDelete={(record) => toast.error(`Delete user: ${record.name}`)}
                    showActions={true}
                />
            </section>

            {/* Example 2: Default Density, Simple */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">3. Order History (Default Density)</h2>
                    <p className="text-sm text-muted-foreground mb-2">Features: Default sizing, Default sorting.</p>
                </div>
                <DataTable
                    title="Recent Orders"
                    data={MOCK_ORDERS}
                    columns={orderColumns}
                    density="default"
                    headerStats={orderStats}
                    headerActions={orderActions}
                    searchable={true}
                    defaultSort={{ key: 'date', direction: 'desc' }}
                    pagination={{
                        ...orderPagination,
                        onChange: (page, size) => setOrderPagination(prev => ({ ...prev, current: page, pageSize: size }))
                    }}
                />
            </section>
        </div>
    );
}
