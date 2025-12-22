import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/table/tableComponents';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// Type definitions for our data
interface Staff {
    id: number;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Inactive';
    avatar: string;
}

interface Performance {
    id: number;
    name: string;
    role: string;
    services?: number;
    avgTime?: string;
    rating: number;
    workload?: string;
    bookings?: number;
    checkIns?: number;
    status?: string;
}

interface ScheduleRow {
    id: number;
    staff: string;
    role: string;
    mon?: string;
    tue?: string;
    wed?: string;
    thu?: string;
    fri?: string;
    sat?: string;
    sun?: string;
}

const StaffPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Mock staff data
    const staffList: Staff[] = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@email.com',
            role: 'Lead Technician',
            status: 'Active',
            avatar: 'JD',
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@email.com',
            role: 'Junior Mechanic',
            status: 'Active',
            avatar: 'JS',
        },
        {
            id: 3,
            name: 'Alex Johnson',
            email: 'alex.j@email.com',
            role: 'Admin',
            status: 'Active',
            avatar: 'AJ',
        },
        {
            id: 4,
            name: 'Sam Wilson',
            email: 'sam.wilson@email.com',
            role: 'Technician',
            status: 'Inactive',
            avatar: 'SW',
        },
    ];

    const performanceData: Performance[] = [
        {
            id: 1,
            name: 'Jordan Lee',
            role: 'Technician',
            services: 142,
            avgTime: '28 min',
            rating: 4.9,
            workload: '3 Open',
        },
        {
            id: 2,
            name: 'Alex Rivera',
            role: 'Technician',
            services: 118,
            avgTime: '35 min',
            rating: 4.6,
            workload: '5 Open',
        },
        {
            id: 3,
            name: 'Casey Morgan',
            role: 'Front Desk',
            bookings: 350,
            checkIns: 345,
            rating: 5.0,
            status: 'On Shift',
        },
    ];

    const scheduleData: ScheduleRow[] = [
        {
            id: 1,
            staff: 'Jordan Lee',
            role: 'Technician',
            wed: '9:00 AM - 5:00 PM|General Shift',
            fri: '9:00 AM - 1:00 PM|Half Day',
        },
        {
            id: 2,
            staff: 'Alex Rivera',
            role: 'Technician',
            mon: '12:00 PM - 8:00 PM|Late Shift',
            tue: '12:00 PM - 8:00 PM|Late Shift',
        },
    ];

    // Staff List Columns
    const staffColumns: Column<Staff>[] = [
        {
            key: 'name',
            title: 'Staff Name',
            dataIndex: 'name',
            sortable: true,
            filterable: true,
            render: (value, record) => (
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                            {record.avatar}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-900">{value}</span>
                </div>
            ),
        },
        {
            key: 'email',
            title: 'Contact Info',
            dataIndex: 'email',
            sortable: true,
            filterable: true,
            render: (value) => <span className="text-gray-600">{value}</span>,
        },
        {
            key: 'role',
            title: 'Role',
            dataIndex: 'role',
            sortable: true,
            filterable: true,
            render: (value) => <span className="text-blue-600">{value}</span>,
        },
        {
            key: 'status',
            title: 'Status',
            dataIndex: 'status',
            sortable: true,
            filterable: true,
            render: (value) => (
                <Badge
                    className={
                        value === 'Active'
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                    }
                >
                    {value}
                </Badge>
            ),
        },
    ];

    // Performance Columns
    const performanceColumns: Column<Performance>[] = [
        {
            key: 'name',
            title: 'Staff Name',
            dataIndex: 'name',
            sortable: true,
            render: (value, record) => (
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                            {value.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-gray-900">{value}</p>
                        <p className="text-xs text-gray-500">{record.role}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'services',
            title: 'Services',
            dataIndex: 'services',
            align: 'center',
            sortable: true,
            render: (value) => value ? <span className="font-semibold">{value}</span> : '-',
        },
        {
            key: 'bookings',
            title: 'Bookings',
            dataIndex: 'bookings',
            align: 'center',
            sortable: true,
            render: (value) => value ? <span className="font-semibold">{value}</span> : '-',
        },
        {
            key: 'avgTime',
            title: 'Avg. Time',
            dataIndex: 'avgTime',
            align: 'center',
            sortable: true,
            render: (value) => value ? <span className="font-semibold">{value}</span> : '-',
        },
        {
            key: 'checkIns',
            title: 'Check-ins',
            dataIndex: 'checkIns',
            align: 'center',
            sortable: true,
            render: (value) => value ? <span className="font-semibold">{value}</span> : '-',
        },
        {
            key: 'rating',
            title: 'Rating',
            dataIndex: 'rating',
            align: 'center',
            sortable: true,
            render: (value) => <span className="font-semibold text-yellow-600">{value} ★</span>,
        },
        {
            key: 'workload',
            title: 'Workload',
            dataIndex: 'workload',
            align: 'center',
            render: (value) => value ? <span className="font-semibold">{value}</span> : '-',
        },
        {
            key: 'status',
            title: 'Status',
            dataIndex: 'status',
            align: 'center',
            render: (value) => value ? <span className="font-semibold text-green-600">{value}</span> : '-',
        },
    ];

    // Schedule Columns
    const scheduleColumns: Column<ScheduleRow>[] = [
        {
            key: 'staff',
            title: 'Staff',
            dataIndex: 'staff',
            render: (value, record) => (
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                            {value.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium text-sm text-gray-900">{value}</p>
                        <p className="text-xs text-gray-500">{record.role}</p>
                    </div>
                </div>
            ),
        },
        ...[
            { key: 'mon', title: 'MON 12' },
            { key: 'tue', title: 'TUE 13' },
            { key: 'wed', title: 'WED 14' },
            { key: 'thu', title: 'THU 15' },
            { key: 'fri', title: 'FRI 16' },
            { key: 'sat', title: 'SAT 17' },
            { key: 'sun', title: 'SUN 18' },
        ].map(day => ({
            key: day.key,
            title: day.title,
            dataIndex: day.key,
            align: 'center' as const,
            render: (value: string) => {
                if (!value) return null;
                const [time, type] = value.split('|');
                const bgColor = type === 'General Shift'
                    ? 'bg-blue-100 text-blue-700'
                    : type === 'Half Day'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700';

                return (
                    <div className={`rounded p-2 text-xs ${bgColor}`}>
                        <p className="font-medium">{time}</p>
                        <p className="text-xs mt-1">{type}</p>
                    </div>
                );
            },
        })),
    ];

    const handleAddStaff = () => {
        console.log('Add new staff');
    };

    const handleEditStaff = (record: Staff) => {
        console.log('Edit staff:', record);
    };

    const handleDeleteStaff = (record: Staff) => {
        console.log('Delete staff:', record);
    };

    const handleViewPerformance = (record: Performance) => {
        console.log('View performance details:', record);
    };

    const handleExportReport = () => {
        console.log('Export performance report');
    };

    const handleAddShift = () => {
        console.log('Add shift');
    };

    return (
        <div className="p-0">
            <Tabs defaultValue="staff" className="w-full">
                <div className="flex justify-between items-center mb-3">
                    <h1 className="text-lg font-bold text-gray-900 tracking-tights">Staff & Technician Management</h1>
                    <TabsList>
                        <TabsTrigger value="staff">Staff List</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                        <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
                    </TabsList>
                </div>

                {/* Tab 1: Staff List */}
                <TabsContent value="staff">
                    <DataTable
                        columns={staffColumns}
                        data={staffList}
                        title="Staff Members"
                        searchable={true}
                        rowSelection={false}
                        showActions={true}
                        showAdd={true}
                        showExport={true}
                        onAdd={handleAddStaff}
                        onEdit={handleEditStaff}
                        onDelete={handleDeleteStaff}
                        pagination={{
                            current: currentPage,
                            pageSize: pageSize,
                            total: staffList.length,
                            onChange: (page, size) => {
                                setCurrentPage(page);
                                setPageSize(size);
                            },
                        }}
                        hoverable
                        bordered
                    />
                </TabsContent>

                {/* Tab 2: Performance Metrics */}
                <TabsContent value="performance">
                    <div className="space-y-3">
                        {/* Team Summary Cards */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Team Summary</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white rounded-lg border p-3">
                                    <p className="text-sm text-gray-600 mb-1">Total Services Completed</p>
                                    <p className="text-lg font-bold text-gray-900">1,204</p>
                                    <p className="text-sm text-green-600 mt-1">↑ +5.2%</p>
                                </div>
                                <div className="bg-white rounded-lg border p-3">
                                    <p className="text-sm text-gray-600 mb-1">Average Customer Rating</p>
                                    <p className="text-lg font-bold text-gray-900">4.8 ★</p>
                                    <p className="text-sm text-green-600 mt-1">↑ +0.1</p>
                                </div>
                                <div className="bg-white rounded-lg border p-3">
                                    <p className="text-sm text-gray-600 mb-1">Average Service Time</p>
                                    <p className="text-lg font-bold text-gray-900">32 min</p>
                                    <p className="text-sm text-red-600 mt-1">↓ -1.5%</p>
                                </div>
                            </div>
                        </div>

                        {/* Performance Table */}
                        <div>
                            <DataTable
                                columns={performanceColumns}
                                data={performanceData}
                                title="Individual Performance"
                                searchable={true}
                                showActions={true}
                                showExport={true}
                                onView={handleViewPerformance}
                                onExport={handleExportReport}
                                actions={
                                    <Button variant="outline" className="gap-2 h-8 text-xs" onClick={handleExportReport}>
                                        <Download className="h-3 w-3" />
                                        Export Report
                                    </Button>
                                }
                                pagination={{
                                    current: currentPage,
                                    pageSize: pageSize,
                                    total: performanceData.length,
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
                </TabsContent>

                {/* Tab 3: Scheduling */}
                <TabsContent value="scheduling">
                    <div className="space-y-4">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between bg-white rounded-lg border p-2">
                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="sm" className="text-xs">
                                    Today
                                </Button>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" className="text-xs">
                                        ←
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        →
                                    </Button>
                                </div>
                                <h3 className="text-xs font-semibold">August 12 - 18, 2024</h3>
                            </div>
                            <div className="flex gap-2">
                                <Select>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="All Staff" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className='text-xs'>All Staff</SelectItem>
                                        <SelectItem value="technician" className='text-xs'>Technicians</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-1 border rounded-lg p-1">
                                    <Button variant="ghost" size="sm" className="bg-gray-100 text-xs">
                                        Week
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-xs">
                                        Day
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Schedule Table */}
                        <DataTable
                            columns={scheduleColumns}
                            data={scheduleData}
                            title="Weekly Schedule"
                            showAdd={true}
                            onAdd={handleAddShift}
                            hoverable
                            bordered
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default StaffPage;
