import { useState, useEffect } from 'react';
import { Download, Calendar, ChevronDown, Activity, Users, IndianRupee, CheckCircle, Package, ChevronRight, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAnalytics, AnalyticsData } from '../serviceAPI/AnalyticsAPI';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const COLORS = ['#1F80FF', '#149447', '#F7B318', '#C6212C', '#8b5cf6', '#64748b'];

const ReportingPage = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('last30days');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);

    const periods = [
        { id: 'last1day', label: 'Last 24 Hours' },
        { id: 'last1week', label: 'Last 7 Days' },
        { id: 'last2weeks', label: 'Last 14 Days' },
        { id: 'last30days', label: 'Last 30 Days' },
        { id: 'alltime', label: 'All Time' },
    ];

    const currentPeriodLabel = periods.find(p => p.id === selectedPeriod)?.label || 'Select Period';

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const response = await fetchAnalytics(selectedPeriod);
                if (response.status) {
                    setData(response.data);
                } else {
                    toast.error(response.message || 'Failed to load analytics');
                }
            } catch (error: any) {
                toast.error(error.message || 'An error occurred loading analytics');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [selectedPeriod]);

    const handleExport = () => {
        toast.info('Export functionality will be implemented soon');
    };

    const getIconForStat = (title: string) => {
        if (title.includes('Revenue')) return <IndianRupee className="w-5 h-5 text-green-600" />;
        if (title.includes('Bookings')) return <Activity className="w-5 h-5 text-blue-600" />;
        if (title.includes('Completed')) return <CheckCircle className="w-5 h-5 text-emerald-600" />;
        return <Users className="w-5 h-5 text-purple-600" />;
    };

    const getBgForStat = (title: string) => {
        if (title.includes('Revenue')) return 'bg-green-100';
        if (title.includes('Bookings')) return 'bg-blue-100';
        if (title.includes('Completed')) return 'bg-emerald-100';
        return 'bg-purple-100';
    };

    const totalServicesCount = data?.topServices.reduce((sum, item) => sum + item.count, 0) || 0;

    return (
        <div className="p-0 animate-in fade-in duration-500">
            <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-base font-bold text-gray-900 tracking-tight">Reporting &amp; Analytics</h1>
                        <p className="text-xs sm:text-sm mt-0.5 text-gray-500 font-medium">Gain real-time insights into your business performance.</p>
                    </div>
                    <Button onClick={handleExport} variant="outline" size="sm" className="h-7 px-2.5 text-[10px] bg-white hover:bg-gray-50 border-gray-200 text-gray-700 transition-all">
                        <Download className="h-3 w-3 mr-1.5" />
                        Export
                    </Button>
                </div>

                {/* Period Filters */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex gap-1.5">
                            {periods.slice(1, 4).map((period) => (
                                <button
                                    key={period.id}
                                    onClick={() => setSelectedPeriod(period.id)}
                                    className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all duration-200 ${selectedPeriod === period.id
                                        ? 'bg-primary text-white'
                                        : 'bg-white border text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    {period.label}
                                </button>
                            ))}
                        </div>

                        {/* Dropdown for smaller screens or all options */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border text-gray-700 rounded-md font-medium text-xs hover:bg-gray-50 transition-colors">
                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                    {currentPeriodLabel}
                                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-1" align="start">
                                {periods.map((period) => (
                                    <button
                                        key={period.id}
                                        onClick={() => setSelectedPeriod(period.id)}
                                        className={`w-full text-left px-3 py-1.5 text-xs rounded-sm transition-colors ${selectedPeriod === period.id
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        {period.label}
                                    </button>
                                ))}
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {loading ? (
                        Array(4).fill(0).map((_, i) => (
                            <Card key={i} className="bg-white border-none shadow-sm rounded-md">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
                                    </div>
                                    <div className="h-6 w-24 bg-gray-200 rounded mb-1.5 animate-pulse"></div>
                                    <div className="h-2.5 w-32 bg-gray-200 rounded animate-pulse"></div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        data?.stats.map((stat, index) => (
                            <Card key={index} className="bg-white border-none shadow-sm rounded-md hover:shadow transition-shadow duration-200">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <p className="text-xs font-medium text-gray-500">{stat.title}</p>
                                        <div className={`p-1.5 rounded-md ${getBgForStat(stat.title)}`}>
                                            <div className="scale-75 origin-center">{getIconForStat(stat.title)}</div>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1.5">{stat.value}</h3>
                                    <div className="flex items-center">
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${stat.color === 'text-green-600' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {stat.change.split('%')[0]}%
                                        </span>
                                        <span className="text-[10px] text-gray-400 ml-1.5">vs prev</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Main Content Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Full Width Revenue & Bookings Chart */}
                    <Card className="col-span-1 lg:col-span-2 bg-white border-none shadow-sm rounded-md">
                        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-gray-50">
                            <div>
                                <CardTitle className="text-sm font-bold text-gray-900">Revenue &amp; Bookings</CardTitle>
                                <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{currentPeriodLabel} Overview</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-3">
                            {loading ? (
                                <div className="w-full h-[200px] bg-gray-50 rounded-md animate-pulse flex items-center justify-center">
                                    <p className="text-gray-400 font-medium text-xs">Loading Chart Data...</p>
                                </div>
                            ) : data?.chartData.length === 0 ? (
                                <div className="w-full h-[200px] flex items-center justify-center bg-gray-50 rounded-md border border-dashed">
                                    <p className="text-gray-500 font-medium text-xs">No data available for this period</p>
                                </div>
                            ) : (
                                <div className="w-full h-[200px] outline-none">
                                    <ResponsiveContainer width="100%" height="100%" className="outline-none">
                                        <AreaChart
                                            data={data?.chartData}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                                            style={{ outline: 'none' }}
                                        >
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#149447" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#149447" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#1F80FF" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#1F80FF" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#888' }}
                                                dy={10}
                                            />
                                            <YAxis
                                                yAxisId="left"
                                                width={60}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#888' }}
                                                tickFormatter={(value) => `₹${value}`}
                                            />
                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#888' }}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: any, name: any) => {
                                                    if (name === 'revenue') return [`₹${Number(value).toFixed(2)}`, 'Revenue'];
                                                    return [value, 'Bookings'];
                                                }}
                                                labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                                            />
                                            <Area
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#149447"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorRevenue)"
                                                activeDot={{ r: 6, strokeWidth: 0, fill: '#149447' }}
                                            />
                                            <Area
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="bookings"
                                                stroke="#1F80FF"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorBookings)"
                                                activeDot={{ r: 6, strokeWidth: 0, fill: '#1F80FF' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Services - Donut Chart UI */}
                    <Card className="bg-white border shadow-sm rounded-md overflow-hidden">
                        <CardHeader className="p-4 pb-2 border-b border-gray-50 flex flex-row items-center gap-2">
                            <div className="p-1.5 rounded-md bg-blue-50">
                                <BarChart2 className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold text-gray-900">Top Services</CardTitle>
                                <p className="text-[10px] text-gray-500">Service distribution</p>
                            </div>
                            <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">LIVE</span>
                        </CardHeader>
                        <CardContent className="p-4">
                            {loading ? (
                                <div className="h-[200px] flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (!data?.topServices || data.topServices.length === 0) ? (
                                <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded-md border border-dashed">
                                    <p className="text-gray-500 font-medium text-xs">No services recorded</p>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="relative w-[140px] h-[140px] shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data.topServices}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={45}
                                                    outerRadius={70}
                                                    paddingAngle={2}
                                                    dataKey="count"
                                                    stroke="none"
                                                >
                                                    {data.topServices.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                                    itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-[10px] font-bold text-gray-500">TOTAL</span>
                                            <span className="text-xl font-bold text-gray-900">{totalServicesCount}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full space-y-3">
                                        {data.topServices.map((service, index) => (
                                            <div key={index} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                        <span className="font-semibold text-gray-700 truncate max-w-[100px]">{service.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500 font-medium">{service.count} req</span>
                                                        <span className="font-bold text-gray-900 w-8 text-right">{service.percentage}%</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                                        style={{ width: `${service.percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Products - Top Listings UI */}
                    <Card className="bg-white border shadow-sm rounded-md overflow-hidden">
                        <CardHeader className="p-4 pb-2 border-b border-gray-50 flex flex-row items-center gap-2">
                            <div className="p-1.5 rounded-md bg-purple-50">
                                <Package className="w-4 h-4 text-purple-500" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold text-gray-900">Top Products</CardTitle>
                                <p className="text-[10px] text-gray-500">Most serviced items</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-4 space-y-4">
                                    {Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="flex gap-3">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                                                <div className="h-2 w-20 bg-gray-200 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (!data?.topProducts || data.topProducts.length === 0) ? (
                                <div className="h-[200px] flex items-center justify-center">
                                    <p className="text-gray-500 font-medium text-xs">No products recorded</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {data.topProducts.map((product, index) => {
                                        // Generate a soft background color for the circle based on index
                                        const bgColors = ['bg-amber-50', 'bg-blue-50', 'bg-rose-50', 'bg-emerald-50', 'bg-indigo-50'];
                                        const textColors = ['text-amber-600', 'text-blue-600', 'text-rose-600', 'text-emerald-600', 'text-indigo-600'];
                                        const bgClass = bgColors[index % bgColors.length];
                                        const textClass = textColors[index % textColors.length];

                                        return (
                                            <div key={index} className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors group">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${bgClass} ${textClass}`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-gray-900 truncate">{product.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                            <Activity className="w-3 h-3" />
                                                            {product.count} requests
                                                        </span>
                                                        <span className="text-[10px] font-medium text-gray-400">•</span>
                                                        <span className="text-[10px] text-gray-500">{product.percentage}%</span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ReportingPage;
