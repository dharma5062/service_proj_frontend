import { useState, useEffect } from 'react';
import { useAuth } from '@/AuthContext';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { DataTable, Column } from '@/components/ui/table/tableComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ServiceCharge,
    fetchServiceChargeById,
    CreateServiceChargePayload,
    useServiceChargesApi
} from '@/pages/serviceAPI/ServiceChargesAPI';
import { IndianRupee } from 'lucide-react';

interface ServiceChargeFormData {
    name: string;
    description: string;
    amount: string | number;
}

const ServiceChargesPage = () => {
    const { shopId, user } = useAuth();
    const { 
        useGetServiceCharges, 
        useCreateServiceCharge, 
        useUpdateServiceCharge, 
        useDeleteServiceCharge 
    } = useServiceChargesApi();

    const { data: serviceCharges = [], isLoading: loading } = useGetServiceCharges();

    const createMutation = useCreateServiceCharge();
    const updateMutation = useUpdateServiceCharge();
    const deleteMutation = useDeleteServiceCharge();

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Reset pagination when branch changes
    useEffect(() => {
        setCurrentPage(1);
        setFormDialogOpen(false);
        setViewDialogOpen(false);
    }, [shopId]);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedChargeId, setSelectedChargeId] = useState<number | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedCharge, setSelectedCharge] = useState<ServiceCharge | null>(null);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    
    const [formData, setFormData] = useState<ServiceChargeFormData>({
        name: '',
        description: '',
        amount: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const columns: Column<ServiceCharge>[] = [
        {
            key: 'name',
            title: 'Charge Name',
            dataIndex: 'name',
            sortable: true,
            filterable: true,
            render: (value) => (
                <span className="font-medium text-gray-900">{value}</span>
            ),
        },
        {
            key: 'description',
            title: 'Description',
            dataIndex: 'description',
            render: (value) => (
                <span className="text-gray-500 text-sm line-clamp-1">{value || '-'}</span>
            ),
        },
        {
            key: 'amount',
            title: 'Amount',
            dataIndex: 'amount',
            sortable: true,
            render: (value) => (
                <div className="flex items-center font-medium text-gray-900">
                    <IndianRupee className="w-3 h-3 mr-0.5 mt-0.5 text-gray-400" />
                    {Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            ),
        },
    ];

    const handleView = async (record: ServiceCharge) => {
        try {
            console.log('Viewing record:', record);
            const charge = await fetchServiceChargeById(record.id);
            setSelectedCharge(charge);
            setViewDialogOpen(true);
        } catch (error) {
            console.error('Failed to load service charge details:', error);
            toast.error('Failed to load service charge details', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const handleEdit = (record: ServiceCharge) => {
        setIsEditMode(true);
        setSelectedChargeId(record.id);
        setFormData({
            name: record.name,
            description: record.description || '',
            amount: record.amount,
        });
        setFormErrors({});
        setFormDialogOpen(true);
    };

    const handleDeleteClick = (record: ServiceCharge) => {
        setSelectedChargeId(record.id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedChargeId) {
            try {
                await deleteMutation.mutateAsync(selectedChargeId);
                toast.success('Service charge deleted successfully');
            } catch (error) {
                toast.error('Failed to delete service charge', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        setDeleteDialogOpen(false);
        setSelectedChargeId(null);
    };

    const handleAddNew = () => {
        setIsEditMode(false);
        setSelectedChargeId(null);
        setFormData({
            name: '',
            description: '',
            amount: '',
        });
        setFormErrors({});
        setFormDialogOpen(true);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = 'Charge name is required';
        }

        if (formData.amount === '' || isNaN(Number(formData.amount))) {
            errors.amount = 'Valid amount is required';
        } else if (Number(formData.amount) < 0) {
            errors.amount = 'Amount cannot be negative';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !shopId || !user) {
            return;
        }

        setSubmitting(true);
        try {
            const payload: CreateServiceChargePayload = {
                name: formData.name,
                description: formData.description || null,
                amount: Number(formData.amount),
                user_id: user.id,
                shop_id: shopId,
            };

            if (isEditMode && selectedChargeId) {
                await updateMutation.mutateAsync({ id: selectedChargeId, payload });
                toast.success('Service charge updated successfully');
            } else {
                await createMutation.mutateAsync(payload);
                toast.success('Service charge created successfully');
            }

            setFormDialogOpen(false);
        } catch (error) {
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} service charge`, {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Service Charges</h1>
                    <p className="text-xs sm:text-sm mt-0.5 text-blue-600">Manage standard charges for various services.</p>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={serviceCharges}
                title="Service Charges List"
                searchable={true}
                showActions={true}
                showAdd={true}
                showExport={true}
                onAdd={handleAddNew}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: serviceCharges.length,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
                hoverable
                bordered
                loading={loading}
            />

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Service Charge Details</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Detailed view of the selected service charge.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedCharge && (
                        <div className="space-y-3">
                            <Card>
                                <CardHeader className="pb-2 pt-3 px-3">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Details</CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 pb-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500">Charge Name</p>
                                            <p className="text-sm font-semibold text-gray-900">{selectedCharge.name}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500">Amount</p>
                                            <p className="text-lg font-bold text-blue-600 flex items-center">
                                                <IndianRupee className="w-3.5 h-3.5 mr-0.5 pt-0.5" />
                                                {Number(selectedCharge.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500">Description</p>
                                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-100 min-h-[40px]">
                                                {selectedCharge.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Created At</p>
                                            <p className="text-xs text-gray-600">
                                                {selectedCharge.created_at ? new Date(selectedCharge.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Last Updated</p>
                                            <p className="text-xs text-gray-600">
                                                {selectedCharge.updated_at ? new Date(selectedCharge.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create/Edit Form Dialog */}
            <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            {isEditMode ? 'Edit Service Charge' : 'Add New Service Charge'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            {isEditMode ? 'Update existing charge details.' : 'Provide details for the new service charge.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                                Charge Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g., Installation Fee, Service Call"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={formErrors.name ? 'border-red-500' : ''}
                            />
                            {formErrors.name && (
                                <p className="text-xs text-red-500">{formErrors.name}</p>
                            )}
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-sm font-medium">
                                Amount <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0.00"
                                    step="0.01"
                                    className={`pl-10 ${formErrors.amount ? 'border-red-500' : ''}`}
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            {formErrors.amount && (
                                <p className="text-xs text-red-500">{formErrors.amount}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Briefly describe what this charge covers..."
                                className="resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Saving...' : isEditMode ? 'Update Charge' : 'Create Charge'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the service charge.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ServiceChargesPage;
