import { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/table/tableComponents';

const Dashboard = () => {
    const stats = [
        { title: "Today's Services", value: '12', change: '+5%', trend: 'up' },
        { title: 'Pending Requests', value: '4', change: '+2%', trend: 'up' },
        { title: 'Completed Today', value: '8', change: '-10%', trend: 'down' },
        { title: 'New Reviews', value: '3', change: '+1%', trend: 'up' },
    ];

    const weeklyData = [
        { day: 'Mon', height: 10 },
        { day: 'Tue', height: 90 },
        { day: 'Wed', height: 70 },
        { day: 'Thu', height: 60 },
        { day: 'Fri', height: 60, active: true },
        { day: 'Sat', height: 100 },
        { day: 'Sun', height: 50 },
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    interface ServiceRequest {
        service: string;
        customer: string;
        status: string;
        dueDate: string;
    }

    const pendingRequests: ServiceRequest[] = [
        { service: 'Standard Haircut', customer: 'Jane Doe', status: 'Pending', dueDate: '2023-10-28' },
        { service: 'Beard Trim', customer: 'John Smith', status: 'Pending', dueDate: '2023-10-28' },
        { service: 'Full Shave', customer: 'Mike Johnson', status: 'Pending', dueDate: '2023-10-29' },
        { service: 'Kids Cut', customer: 'Emily White', status: 'Pending', dueDate: '2023-10-30' },
    ];

    const getStatusBadge = (status: string) => {
        const statusColors = {
            'Pending': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
            'In Progress': 'bg-blue-100 text-blue-700 hover:bg-blue-100',
            'Completed': 'bg-green-100 text-green-700 hover:bg-green-100',
        };
        return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700';
    };

    const columns: Column<ServiceRequest>[] = [
        {
            key: 'service',
            title: 'Service',
            dataIndex: 'service',
            sortable: true,
            filterable: true,
            render: (value) => <span className="font-medium text-gray-900">{value}</span>,
        },
        {
            key: 'customer',
            title: 'Customer',
            dataIndex: 'customer',
            sortable: true,
            filterable: true,
        },
        {
            key: 'status',
            title: 'Status',
            dataIndex: 'status',
            sortable: true,
            filterable: true,
            filterOptions: [
                { label: 'Pending', value: 'Pending' },
                { label: 'In Progress', value: 'In Progress' },
                { label: 'Completed', value: 'Completed' },
            ],
            render: (value) => (
                <Badge className={`${getStatusBadge(value)} text-[10px] sm:text-xs`}>
                    {value}
                </Badge>
            ),
        },
        {
            key: 'dueDate',
            title: 'Due Date',
            dataIndex: 'dueDate',
            sortable: true,
        },
    ];

    return (
        <div className="p-0">
            {/* Compact Page Header - Responsive text sizing */}
            <div className="flex flex-wrap justify-between gap-3 items-center mb-4 md:mb-5">
                <div>
                    <h1 className="text-lg  font-bold text-gray-900 tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-xs sm:text-sm text-blue-600 mt-0.5">
                        An overview of your service operations.
                    </p>
                </div>
                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Last 7 Days</span>
                    <span className="sm:hidden">7 Days</span>
                </Button>
            </div>

            {/* Compact Stats Grid - Responsive spacing */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-3 mb-3 md:mb-3">
                {stats.map((stat, index) => (
                    <Card key={index} className="shadow-sm">
                        <CardContent className="p-3 sm:p-4">
                            <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1 sm:mb-1.5 truncate">
                                {stat.title}
                            </p>
                            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                                {stat.value}
                            </p>
                            <div className="flex items-center gap-1">
                                {stat.trend === 'up' ? (
                                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                                ) : (
                                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                                )}
                                <p className={`text-xs sm:text-sm font-medium ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                    {stat.change}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Compact Charts and Feedback Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
                {/* Services Chart - Compact */}
                <Card className="lg:col-span-2 shadow-sm">
                    <CardContent className="p-3 sm:p-4 md:p-5">
                        <div className="mb-3 sm:mb-4">
                            <p className="text-xs sm:text-sm font-medium text-gray-700">Services This Week</p>
                            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">84</p>
                            <div className="flex gap-2 items-center">
                                <p className="text-xs text-gray-500">This Week</p>
                                <p className="text-xs sm:text-sm font-medium text-green-500">+12.5%</p>
                            </div>
                        </div>
                        {/* Smooth Wave Chart */}
                        <div className="relative" style={{ height: '180px' }}>
                            <svg
                                viewBox="0 0 700 140"
                                className="w-full h-full"
                                preserveAspectRatio="none"
                            >
                                {/* Subtle grid lines */}
                                <line x1="0" y1="35" x2="700" y2="35" stroke="#f5f5f5" strokeWidth="1" />
                                <line x1="0" y1="70" x2="700" y2="70" stroke="#f5f5f5" strokeWidth="1" />
                                <line x1="0" y1="105" x2="700" y2="105" stroke="#f5f5f5" strokeWidth="1" />

                                {/* Area fill with gradient */}
                                <path
                                    d="M 0,130 
                                       C 50,125 70,100 100,90
                                       C 130,80 150,90 200,70
                                       C 250,50 270,55 300,70
                                       C 330,85 360,75 400,70
                                       C 450,65 470,70 500,70
                                       C 550,70 580,100 600,90
                                       C 620,80 650,55 700,35
                                       L 700,140 L 0,140 Z"
                                    fill="url(#weekGradient)"
                                />

                                {/* Smooth wave line */}
                                <path
                                    d="M 0,130 
                                       C 50,125 70,100 100,90
                                       C 130,80 150,90 200,70
                                       C 250,50 270,55 300,70
                                       C 330,85 360,75 400,70
                                       C 450,65 470,70 500,70
                                       C 550,70 580,100 600,90
                                       C 620,80 650,55 700,35"
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Gradient definition */}
                                <defs>
                                    <linearGradient id="weekGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.1" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        {/* Day labels */}
                        <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                            {weeklyData.map((item) => (
                                <span key={item.day} className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide ${item.active ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {item.day}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Customer Feedback - Compact */}
                <Card className="shadow-sm">
                    <CardHeader className="p-3 sm:p-4 pb-2">
                        <CardTitle className="text-sm sm:text-base">Customer Feedback</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="flex flex-col items-center gap-1.5 py-2 sm:py-3">
                            <p className="text-3xl sm:text-4xl font-bold text-gray-900">4.8</p>
                            <div className="flex text-yellow-400">
                                {[...Array(4)].map((_, i) => (
                                    <svg key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                ))}
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" clipPath="polygon(0 0, 50% 0, 50% 100%, 0 100%)" />
                                </svg>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-500">Based on 125 reviews</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:gap-3 border-t pt-2 sm:pt-3">
                            <p className="text-xs sm:text-sm font-medium text-gray-700">Recent Comments:</p>
                            <div className="flex flex-col gap-2">
                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                    "Fantastic service, very quick and professional. Highly recommend!"
                                </p>
                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                    "Good communication throughout the process. Job well done."
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Service Requests - DataTable */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                    Recent Service Requests
                </h2>
                <DataTable
                    columns={columns}
                    data={pendingRequests}
                    title="Pending Approval"
                    searchable={false}
                    showActions={true}
                    onView={(record) => console.log('View:', record)}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: pendingRequests.length,
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
