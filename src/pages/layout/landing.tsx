import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    Settings,
    TrendingUp
} from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <ClipboardList className="h-8 w-8 text-blue-600" />
                            <span className="text-xl font-bold text-gray-900">ServiceHub</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
                            <a href="#benefits" className="text-gray-600 hover:text-blue-600 transition-colors">Benefits</a>
                            <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
                            <Link to="/login">
                                <Button variant="ghost">Sign In</Button>
                            </Link>
                            <Link to="/register">
                                <Button variant="ghost">Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center space-y-8">
                        <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-4">
                            <Zap className="h-4 w-4 mr-2" />
                            Streamline Your Service Operations
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight">
                            Manage Multi-Shop
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                                Service Reports
                            </span>
                            with Ease
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
                            Complete service report management system for multi-location businesses.
                            Track, manage, and analyze service operations across all your shops in one powerful platform.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                            <Link to="/register">
                                <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                                    Start Free Trial
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                                    View Demo
                                </Button>
                            </Link>
                        </div>

                        <div className="pt-8 flex items-center justify-center gap-8 text-sm text-gray-500">
                            <div className="flex items-center">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                                No credit card required
                            </div>
                            <div className="flex items-center">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                                14-day free trial
                            </div>
                            <div className="flex items-center">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                                Cancel anytime
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Preview */}
                    <div className="mt-16 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-3xl"></div>
                        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
                            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Dashboard Overview</h3>
                                        <p className="text-sm text-gray-500">Real-time analytics & insights</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                                        <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-500">Total Reports</span>
                                            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">1,284</div>
                                        <div className="flex items-center text-xs text-green-600 mt-1">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            <span>+12%</span>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-500">Active Shops</span>
                                            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <Store className="h-4 w-4 text-purple-600" />
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">24</div>
                                        <div className="flex items-center text-xs text-green-600 mt-1">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            <span>+3</span>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-500">Staff Members</span>
                                            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                                                <Users className="h-4 w-4 text-green-600" />
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">156</div>
                                        <div className="flex items-center text-xs text-green-600 mt-1">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            <span>+8</span>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-500">Completed</span>
                                            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                                <CheckCircle2 className="h-4 w-4 text-orange-600" />
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">892</div>
                                        <div className="flex items-center text-xs text-green-600 mt-1">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            <span>+18%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-semibold text-gray-900">Report Trends</h4>
                                            <BarChart3 className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div className="h-32 flex items-end justify-between gap-2">
                                            <div className="bg-blue-500 rounded-t w-full h-[60%]"></div>
                                            <div className="bg-blue-400 rounded-t w-full h-[75%]"></div>
                                            <div className="bg-blue-500 rounded-t w-full h-[55%]"></div>
                                            <div className="bg-blue-400 rounded-t w-full h-[85%]"></div>
                                            <div className="bg-blue-500 rounded-t w-full h-[70%]"></div>
                                            <div className="bg-blue-600 rounded-t w-full h-[95%]"></div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-semibold text-gray-900">Recent Activity</h4>
                                            <ClipboardList className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-2">
                                                <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-900 font-medium truncate">Report #1284 completed</p>
                                                    <p className="text-xs text-gray-500">2 min ago</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-900 font-medium truncate">New shop added</p>
                                                    <p className="text-xs text-gray-500">1 hour ago</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="h-2 w-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-900 font-medium truncate">Staff assigned</p>
                                                    <p className="text-xs text-gray-500">3 hours ago</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="h-2 w-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-900 font-medium truncate">Service updated</p>
                                                    <p className="text-xs text-gray-500">5 hours ago</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Powerful Features
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Everything you need to manage service operations across multiple locations
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Card className="hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
                            <CardHeader>
                                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                    <Store className="h-6 w-6 text-blue-600" />
                                </div>
                                <CardTitle>Multi-Shop Management</CardTitle>
                                <CardDescription>
                                    Manage unlimited shops and locations from a single dashboard. Track performance across all your service centers.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
                            <CardHeader>
                                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                    <Users className="h-6 w-6 text-purple-600" />
                                </div>
                                <CardTitle>Staff Management</CardTitle>
                                <CardDescription>
                                    Assign technicians, track workload, and monitor staff performance with detailed analytics and reporting.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
                            <CardHeader>
                                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                    <FileText className="h-6 w-6 text-green-600" />
                                </div>
                                <CardTitle>Dynamic Service Reports</CardTitle>
                                <CardDescription>
                                    Create custom report templates with dynamic forms. Capture signatures, attach files, and track status in real-time.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
                            <CardHeader>
                                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                                    <BarChart3 className="h-6 w-6 text-orange-600" />
                                </div>
                                <CardTitle>Advanced Analytics</CardTitle>
                                <CardDescription>
                                    Gain insights with powerful charts and reports. Track KPIs, service trends, and make data-driven decisions.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
                            <CardHeader>
                                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                                    <Shield className="h-6 w-6 text-red-600" />
                                </div>
                                <CardTitle>Secure & Reliable</CardTitle>
                                <CardDescription>
                                    Enterprise-grade security with role-based access control. Your data is encrypted and backed up automatically.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
                            <CardHeader>
                                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                                    <Settings className="h-6 w-6 text-indigo-600" />
                                </div>
                                <CardTitle>Customizable Workflows</CardTitle>
                                <CardDescription>
                                    Build custom service types and forms tailored to your business needs. Full flexibility and control.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                                Why Choose ServiceHub?
                            </h2>
                            <p className="text-xl text-gray-600">
                                Built specifically for multi-location service businesses that need powerful reporting and analytics.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <TrendingUp className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Increase Efficiency</h3>
                                        <p className="text-gray-600">Reduce paperwork by 80% and complete reports 3x faster with digital workflows.</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <BarChart3 className="h-6 w-6 text-purple-600" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Better Insights</h3>
                                        <p className="text-gray-600">Make informed decisions with real-time analytics and comprehensive reports.</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <Users className="h-6 w-6 text-green-600" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Team Collaboration</h3>
                                        <p className="text-gray-600">Keep everyone in sync with real-time updates and role-based permissions.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-2xl"></div>
                            <Card className="relative shadow-xl">
                                <CardContent className="p-8">
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                                            <h4 className="font-semibold text-gray-900 mb-4">Real-time Activity</h4>
                                            <div className="h-40 bg-white rounded-lg shadow-sm p-4 space-y-3">
                                                <div className="flex items-start gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                                                    <p className="text-xs font-medium text-gray-800 flex-1">Report completed</p>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
                                                    <p className="text-xs font-medium text-gray-800 flex-1">New assignment created</p>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-purple-500 mt-1 flex-shrink-0"></div>
                                                    <p className="text-xs font-medium text-gray-800 flex-1">Status updated</p>
                                                </div>
                                                <div className="h-12 flex items-end justify-between gap-1 mt-4">
                                                    <div className="bg-blue-300 rounded-t w-full h-[40%]"></div>
                                                    <div className="bg-blue-400 rounded-t w-full h-[65%]"></div>
                                                    <div className="bg-blue-300 rounded-t w-full h-[50%]"></div>
                                                    <div className="bg-blue-500 rounded-t w-full h-[80%]"></div>
                                                    <div className="bg-blue-400 rounded-t w-full h-[60%]"></div>
                                                    <div className="bg-blue-300 rounded-t w-full h-[75%]"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-blue-100 rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-blue-600">250+</div>
                                                <div className="text-sm text-gray-600">Reports</div>
                                            </div>
                                            <div className="bg-purple-100 rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-purple-600">15</div>
                                                <div className="text-sm text-gray-600">Shops</div>
                                            </div>
                                            <div className="bg-green-100 rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-green-600">45</div>
                                                <div className="text-sm text-gray-600">Staff</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold text-white">
                        Ready to Transform Your Service Operations?
                    </h2>
                    <p className="text-xl text-blue-100">
                        Join hundreds of businesses already using ServiceHub to streamline their operations
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register">
                            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10  border-white hover:bg-white hover:text-blue-600">
                            Schedule Demo
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <ClipboardList className="h-6 w-6 text-blue-400" />
                                <span className="text-lg font-bold text-white">ServiceHub</span>
                            </div>
                            <p className="text-sm">
                                Complete service report management for multi-location businesses.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-4">Product</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-4">Company</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
                        <p>&copy; 2025 ServiceHub. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
