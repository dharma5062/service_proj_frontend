import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    useServiceRequestsApi,
} from '@/pages/serviceAPI/ServiceRequestsAPI';
import { useShopEmployeesApi } from '@/pages/serviceAPI/ShopEmployeesAPI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    UserCheck,
    ArrowLeft,
    LayoutDashboard
} from 'lucide-react';
import { toast } from 'sonner';

const AssignTechnician = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const numericId = id ? Number(id) : undefined;

    const { useGetServiceRequestById, useAssignTechnician } = useServiceRequestsApi();
    const { useGetShopEmployees } = useShopEmployeesApi();

    const { data: service, isLoading: loading } = useGetServiceRequestById(numericId);
    const { data: employeesData } = useGetShopEmployees({ per_page: 100 });
    
    const assignMutation = useAssignTechnician();

    const [selectedTechId, setSelectedTechId] = useState<string>('');
    const [description, setDescription] = useState<string>('');

    // Filter employees to only show technicians or lead technicians
    const technicians = employeesData?.data?.filter(emp => 
        ['Technician', 'Lead Technician', 'Junior Mechanic'].includes(emp.role)
    ) || [];

    const handleAssignTechnician = async () => {
        if (!selectedTechId || !numericId) {
            toast.error('Please select a technician');
            return;
        }
        
        try {
            await assignMutation.mutateAsync({
                service_id: numericId,
                user_id: Number(selectedTechId),
                admin_note: description
            });
            toast.success('Technician assigned successfully');
            // After assignment, redirect to the View Request page to see the details properly
            navigate(`/dashboard/services/view/${id}`);
        } catch (error) {
            toast.error('Failed to assign technician');
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Service request not found.</p>
                <Button variant="link" onClick={() => navigate('/dashboard/services')}>
                    Back to Services
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 py-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Assign Technician</h1>
                    <p className="text-sm text-gray-500">Service Request #{service.id}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/services')} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back list
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/services/view/${id}`)} className="gap-2">
                        View Request
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Request Summary Card */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Request Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Customer</p>
                            <p className="text-sm font-medium text-gray-900">{service.customer?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{service.customer?.phone || ''}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Device</p>
                            <p className="text-sm font-medium text-gray-900">
                                {(() => {
                                    const brand = service.brand?.name || '';
                                    const product = service.product?.name || '';
                                    // If product already contains the brand name at the start, don't repeat it
                                    if (product.toLowerCase().startsWith(brand.toLowerCase())) {
                                        return product;
                                    }
                                    return `${brand} ${product}`;
                                })()}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Status</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                {(() => {
                                    const status = (service.service_status || 'pending').toLowerCase();
                                    const isAssigned = status === 'assigned';
                                    const isPending = status === 'pending';
                                    
                                    return (
                                        <>
                                            <Clock className={`h-3.5 w-3.5 ${isAssigned ? 'text-purple-500' : isPending ? 'text-yellow-500' : 'text-blue-500'}`} />
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                                                isAssigned ? 'text-purple-700 bg-purple-50' : 
                                                isPending ? 'text-yellow-700 bg-yellow-50' : 
                                                'text-blue-700 bg-blue-50'
                                            }`}>
                                                {status.replace('_', ' ')}
                                            </span>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assignment Main Card */}
                <Card className="md:col-span-2 border-primary/20 shadow-lg shadow-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-primary" />
                            Select Technician
                        </CardTitle>
                        <CardDescription>
                            Assign a technician to start working on this service request.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">Available Staff</label>
                            <Select value={selectedTechId} onValueChange={setSelectedTechId}>
                                <SelectTrigger className="w-full h-12 bg-gray-50/50">
                                    <SelectValue placeholder="Choose a technician..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {technicians.length > 0 ? (
                                        technicians.map((tech) => (
                                            <SelectItem key={tech.id} value={tech.id.toString()}>
                                                <div className="flex flex-col py-1">
                                                    <span className="font-medium">{tech.name}</span>
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-tight">{tech.role}</span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-xs text-gray-500 italic">
                                            No technicians found. Please add staff first.
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">Assignment Notes / Description</label>
                            <Textarea 
                                placeholder="Add specific instructions for the technician..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[100px] bg-gray-50/50"
                            />
                        </div>

                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div className="text-sm text-gray-600 leading-relaxed">
                                Once assigned, the technician will be notified and this request status will change to <span className="font-bold text-gray-900">Assigned</span>.
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 gap-4">
                             <Button 
                                variant="ghost" 
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => navigate(`/dashboard/services/view/${id}`)}
                            >
                                Skip for now
                            </Button>
                            <Button 
                                className="flex-1 h-11 text-base font-semibold gap-2 shadow-md shadow-primary/20"
                                onClick={handleAssignTechnician}
                                disabled={!selectedTechId || assignMutation.isPending}
                            >
                                {assignMutation.isPending ? 'Assigning...' : 'Complete Assignment'}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="flex justify-center pt-8 border-t border-dashed">
                <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors">
                    <LayoutDashboard className="h-4 w-4" />
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default AssignTechnician;
