import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import {
    useServiceRequestsApi,
} from '@/pages/serviceAPI/ServiceRequestsAPI';
import { useShopEmployeesApi } from '@/pages/serviceAPI/ShopEmployeesAPI';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    CheckCircle2,
    UserCheck,
    ArrowLeft} from 'lucide-react';
import { toast } from 'sonner';

const AssignTechnician = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { isShopEmployee } = useAuth();
    const numericId = id ? Number(id) : undefined;

    useEffect(() => {
        if (isShopEmployee) {
            toast.error('You do not have permission to assign technicians');
            navigate('/dashboard/services');
        }
    }, [isShopEmployee, navigate]);

    const { useGetServiceRequestById, useAssignTechnician } = useServiceRequestsApi();
    const { useGetShopEmployees } = useShopEmployeesApi();

    const { data: service, isLoading: loading } = useGetServiceRequestById(numericId);
    const { data: employeesData } = useGetShopEmployees({ per_page: 100 });
    
    const assignMutation = useAssignTechnician();

    const [selectedTechId, setSelectedTechId] = useState<string>('');
    const [description, setDescription] = useState<string>('');

    // ── Pre-fill existing assignment ─────────────────────────────────────────
    useEffect(() => {
        if (service?.assigned_technician) {
            setSelectedTechId(service.assigned_technician.id.toString());
        }
        
        if (service?.admin_note) {
            try {
                const parsed = JSON.parse(service.admin_note);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setDescription(parsed[0].internalNotes || '');
                } else if (typeof parsed === 'object') {
                    setDescription(parsed.internalNotes || '');
                } else {
                    setDescription(service.admin_note);
                }
            } catch {
                setDescription(service.admin_note);
            }
        }
    }, [service]);

    // Allow all shop employees to be assigned, as roles are fully customizable
    const technicians = employeesData?.data || [];

    const handleAssignTechnician = async () => {
        if (!selectedTechId || !numericId) {
            toast.error('Please select a technician');
            return;
        }

        // If the technician is already assigned and hasn't changed, just navigate to the view page
        if (service?.assigned_technician?.id?.toString() === selectedTechId) {
            navigate('/dashboard/services');
            return;
        }
        
        try {
            await assignMutation.mutateAsync({
                service_id: numericId,
                user_id: Number(selectedTechId),
                admin_note: description
            });
            toast.success('Technician assigned successfully');
            // After assignment, redirect to the Service Requests list
            navigate('/dashboard/services');
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
        <div className="p-0">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/dashboard/services')}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 tracking-tight">Assign Technician</h1>
                        <p className="text-xs text-primary mt-0.5">Service Request SR{String(service.id).padStart(3, '0')}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left Column: Request Summary (1/3) */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Request Summary</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer</p>
                                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900">{service.customer?.name || 'Walk-in'}</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">{service.customer?.phone || 'No phone'}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Device Info</p>
                                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {(() => {
                                            const brand = service.brand?.name || '';
                                            const product = service.product?.name || '';
                                            if (product.toLowerCase().startsWith(brand.toLowerCase())) return product;
                                            return `${brand} ${product}`.trim() || 'General Service';
                                        })()}
                                    </p>
                                    <p className="text-[11px] text-primary font-medium mt-0.5">
                                        {service.form?.name || 'Standard Form'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Status</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {(() => {
                                        const status = (service.service_status || 'pending').toLowerCase();
                                        const styles: Record<string, string> = {
                                            pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
                                            assigned: 'bg-purple-50 text-purple-700 border-purple-100',
                                            in_progress: 'bg-primary/10 text-primary border-primary/20',
                                            completed: 'bg-green-50 text-green-700 border-green-100',
                                        };
                                        return (
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${styles[status] || 'bg-gray-50 text-gray-600'}`}>
                                                {status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Assignment Form (2/3) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-primary" />
                                <h3 className="text-sm font-bold text-gray-900">Assignment Details</h3>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium italic">Updated real-time</span>
                        </div>
                        
                        <div className="p-5 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Select Technician</label>
                                <Select value={selectedTechId} onValueChange={setSelectedTechId}>
                                    <SelectTrigger className="w-full h-10 text-sm border-gray-200 focus:ring-primary/20">
                                        <SelectValue placeholder="Select a staff member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {technicians.length > 0 ? (
                                            technicians.map((tech) => (
                                                <SelectItem key={tech.id} value={tech.id.toString()} className="text-sm">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{tech.name}</span>
                                                        <span className="text-[10px] text-gray-400 capitalize">{tech.role}</span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-xs text-gray-400 italic">
                                                No staff members available.
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Internal Instructions</label>
                                <Textarea 
                                    placeholder="Add notes or specific instructions for the technician..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-[120px] text-sm border-gray-200 resize-none focus:ring-primary/20"
                                />
                            </div>

                            <div className="bg-primary/10 rounded-lg p-3.5 border border-primary/20 flex items-start gap-3">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <p className="text-xs text-primary leading-relaxed">
                                    Assigning a technician will notify them via their dashboard. The request status will automatically update to <span className="font-bold">ASSIGNED</span>.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-xs text-gray-500 hover:text-gray-700 h-9"
                                    onClick={() => navigate('/dashboard/services')}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    size="sm"
                                    className="h-9 text-xs px-6 font-bold bg-primary hover:bg-primary/90 shadow-sm"
                                    onClick={handleAssignTechnician}
                                    disabled={!selectedTechId || assignMutation.isPending}
                                >
                                    {assignMutation.isPending ? 'Processing...' : 'Complete Assignment'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignTechnician;
