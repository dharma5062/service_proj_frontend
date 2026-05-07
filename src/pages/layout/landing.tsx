import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ClipboardList,
    Store,
    Users,
    BarChart3,
    CheckCircle2,
    Shield,
    Zap,
    ArrowRight,
    FileText,
    TrendingUp,
    LayoutDashboard,
    Clock
} from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="h-screen w-full font-sans text-gray-900 bg-gray-50/50 overflow-hidden flex flex-col">
            {/* Navigation - Outside ScrollArea for perfect "fixed" behavior */}
            <nav className="shrink-0 w-full bg-white/70 backdrop-blur-md border-b border-gray-100 z-50">
                <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between relative">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-600 rounded-lg">
                            <ClipboardList className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">ServiceHub</span>
                    </div>

                    {/* Centered Links */}
                    <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                        {['Features', 'Security', 'Privacy', 'Status'].map(link => (
                            <a key={link} href={`#${link.toLowerCase()}`} className="text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors">
                                {link}
                            </a>
                        ))}
                    </div>
                    
                    {/* CTAs */}
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors">
                            Sign In
                        </Link>
                        <Link to="/register">
                            <Button size="sm" className="text-[11px] font-bold h-8 px-4 rounded-full shadow-sm">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Scrollable Content Area */}
            <ScrollArea className="flex-1 w-full">
                <main className="pt-10 pb-12">
                    <div className="max-w-6xl mx-auto px-4">
                        {/* Hero Section */}
                        <div className="max-w-3xl mx-auto text-center mb-20">
                            <div className="inline-flex items-center gap-2 px-2 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-6">
                                <Zap className="h-3 w-3" />
                                Next-Gen Service Management
                            </div>
                            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1]">
                                Manage Multi-Shop Service Operations 
                                <span className="text-blue-600"> with Precision.</span>
                            </h1>
                            <p className="text-base md:text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
                                A minimal, high-performance platform for multi-location businesses. 
                                Track reports, manage staff, and analyze growth in one unified dashboard.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to="/register">
                                    <Button className="h-11 px-8 rounded-lg text-xs font-bold shadow-md w-full sm:w-auto">
                                        Create Free Account
                                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button variant="outline" className="h-11 px-8 rounded-lg text-xs font-bold bg-white w-full sm:w-auto">
                                        View Demo
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Dashboard Preview */}
                        <div className="relative group mb-32">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100/50 to-purple-100/50 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                            <Card className="relative bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <div className="min-w-[800px] p-6 md:p-8">
                                        {/* Mock Dashboard Header */}
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <LayoutDashboard className="h-4 w-4 text-blue-600" />
                                                    Dashboard Overview
                                                </h2>
                                                <p className="text-[10px] text-blue-600 font-medium mt-0.5">Real-time performance metrics across all shops</p>
                                            </div>
                                            <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 border rounded-lg">
                                                <Clock className="h-3 w-3 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-700">Live Updates</span>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-4 gap-4 mb-8">
                                            {[
                                                { title: "Total Services", value: "1,482", change: "+12%", icon: Clock },
                                                { title: "Active Shops", value: "18", change: "+2", icon: Store },
                                                { title: "Staff Members", value: "84", change: "+5", icon: Users },
                                                { title: "Completion Rate", value: "94%", change: "+3%", icon: CheckCircle2 }
                                            ].map((stat, i) => (
                                                <div key={i} className="bg-gray-50/50 rounded-lg border border-gray-100 p-4 hover:border-blue-200 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{stat.title}</span>
                                                        <div className="p-1 bg-white rounded shadow-sm">
                                                            <stat.icon className="h-3 w-3 text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-xl font-bold text-gray-900">{stat.value}</span>
                                                        <span className="text-[9px] font-bold text-green-500">{stat.change}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Activity & Trends */}
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="bg-white rounded-lg border border-gray-100 p-5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-tight">Recent Activity</h3>
                                                    <TrendingUp className="h-3 w-3 text-gray-400" />
                                                </div>
                                                <div className="space-y-4">
                                                    {[
                                                        { label: "SR-842 Completed", time: "2m ago", status: "completed" },
                                                        { label: "New Tech Assigned", time: "15m ago", status: "assigned" },
                                                        { label: "Parts Ordered #94", time: "1h ago", status: "pending" }
                                                    ].map((act, i) => (
                                                        <div key={i} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`h-1.5 w-1.5 rounded-full ${act.status === 'completed' ? 'bg-green-500' : act.status === 'assigned' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                                                                <span className="text-[11px] font-medium text-gray-700">{act.label}</span>
                                                            </div>
                                                            <span className="text-[10px] text-gray-400">{act.time}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-lg border border-gray-100 p-5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-tight">Weekly Throughput</h3>
                                                    <BarChart3 className="h-3 w-3 text-gray-400" />
                                                </div>
                                                <div className="h-28 flex items-end justify-between gap-2 px-2">
                                                    {[40, 65, 45, 90, 70, 85, 95].map((h, i) => (
                                                        <div key={i} className="bg-blue-600/10 hover:bg-blue-600/20 transition-colors rounded-t w-full" style={{ height: `${h}%` }}></div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between mt-3 px-1">
                                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                                                        <span key={d} className="text-[9px] font-bold text-gray-400">{d}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Features Grid */}
                        <div id="features" className="mt-24 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-center sm:text-left">
                            {[
                                { title: "Multi-Shop Control", desc: "Manage all branches from one master account.", icon: Store },
                                { title: "Dynamic Forms", desc: "Custom service report templates for every need.", icon: FileText },
                                { title: "Staff Analytics", desc: "Monitor technician performance and workload.", icon: Users },
                                { title: "Enterprise Security", desc: "Role-based access and data encryption.", icon: Shield }
                            ].map((feature, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="h-12 w-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm mx-auto sm:mx-0">
                                        <feature.icon className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 tracking-tight">{feature.title}</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Final CTA */}
                        <div className="mt-32 py-16 px-8 bg-blue-600 rounded-3xl text-center relative overflow-hidden mb-12">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent"></div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 relative tracking-tight">Ready to optimize your workflow?</h2>
                            <p className="text-blue-100 text-sm md:text-base mb-10 max-w-md mx-auto relative opacity-90">
                                Join 500+ businesses scaling their service operations with ServiceHub. 
                                Start your 14-day free trial today.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
                                <Link to="/register">
                                    <Button className="bg-white text-blue-600 hover:bg-gray-50 h-12 px-10 text-xs font-bold rounded-lg shadow-xl">
                                        Get Started Free
                                    </Button>
                                </Link>
                                <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 h-12 px-10 text-xs font-bold rounded-lg">
                                    Contact Sales
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="border-t border-gray-100 py-16 bg-white">
                        <div className="max-w-6xl mx-auto px-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
                                {/* Brand Column */}
                                <div className="col-span-2 md:col-span-1">
                                    <div className="flex items-center gap-2 mb-6 text-center sm:text-left">
                                        <div className="p-1.5 bg-blue-600 rounded-lg mx-auto sm:mx-0">
                                            <ClipboardList className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="text-sm font-bold tracking-tight">ServiceHub</span>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed max-w-xs text-center sm:text-left mx-auto sm:mx-0">
                                        Empowering multi-shop businesses with intelligent service reporting and staff management solutions.
                                    </p>
                                </div>

                                {/* Product Column */}
                                <div className="text-center sm:text-left">
                                    <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-widest mb-6">Product</h4>
                                    <ul className="space-y-4">
                                        {['Features', 'Dashboard', 'Security', 'Integrations'].map(item => (
                                            <li key={item}><a href="#" className="text-xs text-gray-500 hover:text-blue-600 transition-colors">{item}</a></li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Company Column */}
                                <div className="text-center sm:text-left">
                                    <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-widest mb-6">Company</h4>
                                    <ul className="space-y-4">
                                        {['About Us', 'Success Stories', 'Privacy Policy', 'Terms of Service'].map(item => (
                                            <li key={item}><a href="#" className="text-xs text-gray-500 hover:text-blue-600 transition-colors">{item}</a></li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Support Column */}
                                <div className="text-center sm:text-left">
                                    <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-widest mb-6">Support</h4>
                                    <ul className="space-y-4">
                                        {['Help Center', 'Status', 'Contact', 'Knowledge Base'].map(item => (
                                            <li key={item}><a href="#" className="text-xs text-gray-500 hover:text-blue-600 transition-colors">{item}</a></li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest order-2 md:order-1 text-center md:text-left">
                                    &copy; 2025 ServiceHub. All rights reserved.
                                </p>
                                <div className="flex gap-6 order-1 md:order-2">
                                    {['Twitter', 'LinkedIn', 'GitHub'].map(social => (
                                        <a key={social} href="#" className="text-[10px] font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors">
                                            {social}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </footer>
                </main>
            </ScrollArea>
        </div>
    );
}
