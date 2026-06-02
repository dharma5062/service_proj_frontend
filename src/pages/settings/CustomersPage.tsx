import { useState, useEffect, useMemo } from 'react';
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
import { DataTable, Column } from '@/components/ui/table/datatable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Customer,
    useCustomersApi,
    CreateCustomerPayload,
    UpdateCustomerPayload
} from '@/pages/serviceAPI/CustomersAPI';
import { Users, Mail, Phone, MapPin, Send } from 'lucide-react';

interface CustomerFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
}

const CustomersPage = () => {
    const { shopId, hasPermission } = useAuth();
    const {
        useGetCustomers,
        useCreateCustomer,
        useUpdateCustomer,
        useDeleteCustomer,
        useSendInvite
    } = useCustomersApi();

    const { data: customers = [], isLoading: loading } = useGetCustomers();

    const createMutation = useCreateCustomer();
    const updateMutation = useUpdateCustomer();
    const deleteMutation = useDeleteCustomer();
    const sendInviteMutation = useSendInvite();

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Reset pagination when branch changes
    useEffect(() => {
        setCurrentPage(1);
        setFormDialogOpen(false);
        setViewDialogOpen(false);
    }, [shopId]);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [formData, setFormData] = useState<CustomerFormData>({
        name: '',
        email: '',
        phone: '',
        address: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const mappedCustomers = useMemo(() => {
        return customers.map((c) => {
            const status = c.customer_approved ? 'approved' : 'pending';
            return {
                ...c,
                _filter_status: status,
                _search_blob: `${c.name} ${c.email || ''} ${c.phone} ${c.address || ''}`.toLowerCase(),
            };
        });
    }, [customers]);

    const handleResendInvite = async (customer: Customer) => {
        try {
            await sendInviteMutation.mutateAsync({
                phone: customer.phone,
                shop_id: shopId,
            });
            toast.success('Invitation resent successfully');
        } catch (error) {
            toast.error('Failed to send invitation', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const columns: Column<Customer>[] = [
        {
            key: 'name',
            title: 'Customer Name',
            dataIndex: 'name',
            sortable: true,
            render: (value) => (
                <span className="text-xs font-bold text-gray-900 leading-tight">
                    {value ? value.charAt(0).toUpperCase() + value.slice(1) : '-'}
                </span>
            ),
        },
        {
            key: 'email',
            title: 'Email Address',
            dataIndex: 'email',
            render: (value) => (
                <span className="text-xs text-gray-600 font-medium">
                    {value || '-'}
                </span>
            ),
        },
        {
            key: 'phone',
            title: 'Phone Number',
            dataIndex: 'phone',
            render: (value) => (
                <span className="text-xs text-gray-700 font-semibold">
                    {value}
                </span>
            ),
        },
        {
            key: 'address',
            title: 'Address',
            dataIndex: 'address',
            render: (value) => (
                <span className="text-[10px] text-gray-500 font-medium line-clamp-1 max-w-[250px]">
                    {value || 'No address provided'}
                </span>
            ),
        },
        {
            key: 'status',
            title: 'Status',
            dataIndex: 'customer_approved',
            render: (value, record) => {
                if (value) {
                    return (
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 shadow-sm inline-flex items-center">
                            Approved
                        </span>
                    );
                }
                return (
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shadow-sm inline-flex items-center">
                            Pending Invite
                        </span>
                        {hasPermission('customer.create') && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 rounded-md hover:bg-amber-100 hover:text-amber-700 text-amber-600"
                                title="Resend Invite"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleResendInvite(record);
                                }}
                            >
                                <Send className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    const handleView = (record: Customer) => {
        setSelectedCustomer(record);
        setViewDialogOpen(true);
    };

    const handleEdit = (record: Customer) => {
        setIsEditMode(true);
        setSelectedCustomerId(record.id);
        setFormData({
            name: record.name,
            email: record.email || '',
            phone: record.phone,
            address: record.address || '',
        });
        setFormErrors({});
        setFormDialogOpen(true);
    };

    const handleDeleteClick = (record: Customer) => {
        setSelectedCustomerId(record.id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedCustomerId) {
            try {
                await deleteMutation.mutateAsync(selectedCustomerId);
                toast.success('Customer detached from shop successfully');
            } catch (error) {
                toast.error('Failed to detach customer', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        setDeleteDialogOpen(false);
        setSelectedCustomerId(null);
    };

    const handleAddNew = () => {
        setIsEditMode(false);
        setSelectedCustomerId(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
        });
        setFormErrors({});
        setFormDialogOpen(true);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = 'Customer name is required';
        } else if (formData.name.trim().length < 3) {
            errors.name = 'Name must be at least 3 characters';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email address is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Invalid email address';
        }

        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required';
        } else if (!/^\+?[0-9]{10,14}$/.test(formData.phone.trim())) {
            errors.phone = 'Phone number must be between 10 and 14 digits';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !shopId) {
            return;
        }

        setSubmitting(true);
        try {
            if (isEditMode && selectedCustomerId) {
                const payload: UpdateCustomerPayload = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address || undefined,
                };
                await updateMutation.mutateAsync({ id: selectedCustomerId, payload });
                toast.success('Customer details updated successfully');
            } else {
                const payload: CreateCustomerPayload = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address || undefined,
                    shop_id: shopId,
                };
                const result = await createMutation.mutateAsync(payload);
                toast.success(result.message || 'Customer added successfully');
            }

            setFormDialogOpen(false);
        } catch (error) {
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} customer`, {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-0">
            {/* DataTable */}
            <DataTable
                columns={columns}
                data={mappedCustomers}
                title="Customers List"
                headerStats={[
                    {
                        label: 'Total Customers',
                        value: mappedCustomers.length,
                        icon: <Users className="h-3 w-3" />,
                        color: 'primary'
                    }
                ]}
                filterConfig={[
                    {
                        key: '_filter_status',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { label: 'Approved', value: 'approved' },
                            { label: 'Pending Invite', value: 'pending' }
                        ]
                    }
                ]}
                searchKey="_search_blob"
                searchable={true}
                showActions={true}
                showAdd={hasPermission('customer.create')}
                showExport={true}
                onAdd={hasPermission('customer.create') ? handleAddNew : undefined}
                onView={handleView}
                onEdit={hasPermission('customer.update') ? handleEdit : undefined}
                onDelete={hasPermission('customer.delete') ? handleDeleteClick : undefined}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: mappedCustomers.length,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
                hoverable
                bordered
                density="compact"
                loading={loading}
            />

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Customer Details</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Detailed view of the customer profile.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedCustomer && (
                        <div className="space-y-3">
                            <Card>
                                <CardHeader className="pb-2 pt-3 px-3">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Profile Info</CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 pb-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500">Full Name</p>
                                            <p className="text-sm font-semibold text-gray-900">{selectedCustomer.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-gray-400" /> Email</p>
                                            <p className="text-xs font-semibold text-gray-900">{selectedCustomer.email || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" /> Phone</p>
                                            <p className="text-xs font-semibold text-gray-900">{selectedCustomer.phone}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" /> Address</p>
                                            <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-100 min-h-[40px]">
                                                {selectedCustomer.address || 'No address provided.'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Status</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm inline-flex items-center mt-1 ${
                                                selectedCustomer.customer_approved 
                                                    ? 'text-green-700 bg-green-50 border-green-200' 
                                                    : 'text-amber-700 bg-amber-50 border-amber-200'
                                            }`}>
                                                {selectedCustomer.customer_approved ? 'Approved' : 'Pending Invite'}
                                            </span>
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
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-5 gap-4">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-base font-bold flex items-center gap-1.5 text-gray-900">
                            <Users className="h-4 w-4 text-primary" />
                            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            {isEditMode ? 'Update customer profile details.' : 'Provide details for the new customer.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-3 py-1">
                        {/* Name */}
                        <div className="col-span-2 space-y-1">
                            <Label htmlFor="name" className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-gray-400" />
                                Full Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g., Jane Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={`h-8 text-xs placeholder:text-gray-400 ${formErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {formErrors.name && (
                                <p className="text-[10px] text-red-500 font-medium mt-0.5 leading-none">{formErrors.name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="col-span-1 space-y-1">
                            <Label htmlFor="email" className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                Email Address <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="e.g., jane.doe@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`h-8 text-xs placeholder:text-gray-400 ${formErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {formErrors.email && (
                                <p className="text-[10px] text-red-500 font-medium mt-0.5 leading-none">{formErrors.email}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="col-span-1 space-y-1">
                            <Label htmlFor="phone" className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                Phone Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="phone"
                                placeholder="e.g., +919876543210"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className={`h-8 text-xs placeholder:text-gray-400 ${formErrors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {formErrors.phone && (
                                <p className="text-[10px] text-red-500 font-medium mt-0.5 leading-none">{formErrors.phone}</p>
                            )}
                        </div>

                        {/* Address */}
                        <div className="col-span-2 space-y-1">
                            <Label htmlFor="address" className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                Address
                            </Label>
                            <Textarea
                                id="address"
                                placeholder="e.g., 123 Main St, Anytown"
                                className="resize-none text-xs min-h-[50px] py-1.5 placeholder:text-gray-400"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-2 gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" className="h-8 text-xs px-3" onClick={() => setFormDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button size="sm" className="h-8 text-xs px-3" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Saving...' : isEditMode ? 'Update Customer' : 'Create Customer'}
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
                            This will detach the customer from this shop. The customer will no longer be visible in your shop, but their global user account will not be deleted.
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

export default CustomersPage;
