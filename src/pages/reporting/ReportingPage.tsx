import { useState } from 'react';
import { Download, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReportingPage = () => {
    const [, setSelectedPeriod] = useState('last30');

    const periods = [
        { id: 'last30', label: 'Last 30 Days' },
        { id: 'quarter', label: 'This Quarter' },
        { id: 'last6months', label: 'Last 6 Months' },
        { id: 'alltime', label: 'All Time' },
    ];

    const stats = [
        {
            title: 'Total Revenue',
            value: '$45,331.89',
            change: '+20.1% vs previous 30 days',
            color: 'text-green-600'
        },
        {
            title: 'Total Bookings',
            value: '1,240',
            change: '+12.2% vs previous 30 days',
            color: 'text-green-600'
        },
        {
            title: 'New Customers',
            value: '89',
            change: '+5.0% vs previous 30 days',
            color: 'text-green-600'
        },
    ];

    const topServices = [
        { name: 'Display Service', count: 450, percentage: 90 },
        { name: 'Battery Service', count: 320, percentage: 64 },
        { name: 'Laptop display', count: 210, percentage: 42 },
        { name: 'Ram ', count: 150, percentage: 30 },
        { name: 'Hard disk', count: 80, percentage: 16 },
    ];

    return (
        <div className="p-0">
            <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Reporting &amp; Analytics</h1>
                        <p className="text-xs sm:text-sm mt-0.5 text-primary font-medium">Gain insights into your business performance.</p>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 text-sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </div>

                {/* Period Filters */}
                <div className="flex gap-3 mb-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium text-sm">
                        <Calendar className="h-4 w-4" />
                        Last 30 Days
                        <ChevronDown className="h-4 w-4" />
                    </button>
                    {periods.slice(1).map((period) => (
                        <button
                            key={period.id}
                            onClick={() => setSelectedPeriod(period.id)}
                            className="px-4 py-2 bg-white border rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50"
                        >
                            {period.label}
                        </button>
                    ))}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {stats.map((stat, index) => (
                        <Card key={index} className="bg-white">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-gray-600 mb-1">{stat.title}</p>
                                <p className="text-lg font-bold text-gray-900 mb-1">{stat.value}</p>
                                <p className={`text-xs font-medium ${stat.color}`}>{stat.change}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>


                {/* Charts Section */}
                <div className="grid grid-cols-3 gap-3">
                    {/* Revenue Over Time - Smooth Wave Chart */}
                    <Card className="col-span-2 bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-900">Revenue Over Time</CardTitle>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-lg font-bold text-gray-900">$45,331.89</span>
                                <span className="text-xs font-semibold text-green-600">+20.1%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">Jan - Jun 2024</p>
                        </CardHeader>
                        <CardContent className="pb-3">
                            {/* Smooth Wave SVG Chart */}
                            <div className="relative" style={{ height: '240px' }}>
                                <svg
                                    viewBox="0 0 700 180"
                                    className="w-full h-full"
                                    preserveAspectRatio="none"
                                >
                                    {/* Subtle grid lines */}
                                    <line x1="0" y1="45" x2="700" y2="45" stroke="#f5f5f5" strokeWidth="1" />
                                    <line x1="0" y1="90" x2="700" y2="90" stroke="#f5f5f5" strokeWidth="1" />
                                    <line x1="0" y1="135" x2="700" y2="135" stroke="#f5f5f5" strokeWidth="1" />

                                    {/* Area fill with gradient */}
                                    <path
                                        d="M 0,100 
                                           C 40,95 60,75 90,65
                                           C 120,55 140,68 160,75
                                           C 180,82 195,70 210,60
                                           C 240,45 260,52 290,65
                                           C 320,78 340,90 360,95
                                           C 390,102 410,115 440,125
                                           C 470,135 490,115 520,95
                                           C 540,82 555,70 575,65
                                           C 595,60 610,35 630,25
                                           C 650,15 670,20 700,30
                                           L 700,180 L 0,180 Z"
                                        fill="url(#areaGradient)"
                                    />

                                    {/* Smooth wave line */}
                                    <path
                                        d="M 0,100 
                                           C 40,95 60,75 90,65
                                           C 120,55 140,68 160,75
                                           C 180,82 195,70 210,60
                                           C 240,45 260,52 290,65
                                           C 320,78 340,90 360,95
                                           C 390,102 410,115 440,125
                                           C 470,135 490,115 520,95
                                           C 540,82 555,70 575,65
                                           C 595,60 610,35 630,25
                                           C 650,15 670,20 700,30"
                                        fill="none"
                                        stroke="#1F80FF"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {/* Gradient definitions */}
                                    <defs>
                                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#1F80FF" stopOpacity="0.4" />
                                            <stop offset="100%" stopColor="#1F80FF" stopOpacity="0.1" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>

                            {/* Month labels */}
                            <div className="flex justify-between border-t border-gray-200 pt-3 mt-2">
                                {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'].map((month) => (
                                    <span key={month} className="text-xs font-bold text-primary uppercase tracking-wide">
                                        {month}
                                    </span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Services - Clean Progress Bars */}
                    <Card className="bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-900">Top Services</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="space-y-3">
                                {topServices.map((service, index) => (
                                    <div key={index} className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-normal text-gray-900">{service.name}</span>
                                            <span className="text-xs font-semibold text-gray-900">{service.count}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full transition-all duration-300"
                                                style={{ width: `${service.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ReportingPage;
