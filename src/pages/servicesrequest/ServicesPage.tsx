import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DataTable, Column } from '@/components/ui/table/tableComponents';
import { useServiceRequest, ServiceRequest } from '@/contexts/ServiceRequestContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ServicesPage = () => {
    const navigate = useNavigate();
    const { serviceRequests, deleteServiceRequest } = useServiceRequest();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<ServiceRequest | null>(null);

    const getStatusBadge = (status: string) => {
        const statusColors = {
            'Pending': 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
            'In Progress': 'bg-blue-100 text-blue-700 hover:bg-blue-100',
            'Completed': 'bg-green-100 text-green-700 hover:bg-green-100',
            'Cancelled': 'bg-red-100 text-red-700 hover:bg-red-100'
        };
        return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700';
    };

    const columns: Column<ServiceRequest>[] = [
        {
            key: 'id',
            title: 'Request ID',
            dataIndex: 'id',
            sortable: true,
            filterable: true,
            render: (value) => <span className="font-medium text-blue-600">{value}</span>,
        },
        {
            key: 'serviceType',
            title: 'Service Type',
            dataIndex: 'serviceType',
            sortable: true,
            filterable: true,
        },
        {
            key: 'customer',
            title: 'Customer',
            dataIndex: 'customer',
            sortable: true,
            filterable: true,
            render: (value) => (
                <div className="flex flex-col">
                    <span className="font-medium">{value.name}</span>
                    <span className="text-xs text-gray-500">{value.phone}</span>
                </div>
            ),
        },
        {
            key: 'device',
            title: 'Device',
            dataIndex: 'device',
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
                { label: 'Cancelled', value: 'Cancelled' },
            ],
            render: (value) => (
                <Badge className={getStatusBadge(value)}>
                    {value}
                </Badge>
            ),
        },
        {
            key: 'createdDate',
            title: 'Created Date',
            dataIndex: 'createdDate',
            sortable: true,
            render: (value) => (
                <span className="text-gray-600">
                    {new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </span>
            ),
        },
    ];

    const handleView = (record: ServiceRequest) => {
        setSelectedService(record);
        setDialogOpen(true);
    };

    const handleEdit = (record: ServiceRequest) => {
        toast.info(`Editing service request ${record.id}`);
        navigate(`/dashboard/services/edit/${record.id}`);
    };

    const handleDeleteClick = (record: ServiceRequest) => {
        setSelectedServiceId(record.id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedServiceId) {
            deleteServiceRequest(selectedServiceId);
            toast.success('Service request deleted successfully', {
                description: `Service request ${selectedServiceId} has been removed.`,
            });
        }
        setDeleteDialogOpen(false);
        setSelectedServiceId(null);
    };

    const handleAddNew = () => {
        navigate('/dashboard/services/create');
    };

    return (
        <div className="p-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Service Requests</h1>
                    <p className="text-xs sm:text-sm mt-0.5 text-blue-600">Manage all service requests and repairs.</p>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={serviceRequests}
                title="Service Requests List"
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
                    total: serviceRequests.length,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
                hoverable
                bordered
            />

            {/* Service Request Detail Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Service Request {selectedService?.id}</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Created on {selectedService?.createdDate ? new Date(selectedService.createdDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            }) : ''}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedService && (
                        <div className="space-y-3">
                            {/* Customer Details */}
                            <Card>
                                <CardHeader className="pb-2 pt-3 px-3">
                                    <CardTitle className="text-xs font-bold">Customer Details</CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 pb-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Name</p>
                                            <p className="text-sm font-medium">{selectedService.customer.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="text-sm font-medium">{selectedService.customer.phone}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="text-sm font-medium">{selectedService.customer.email}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Product Details */}
                            <Card>
                                <CardHeader className="pb-2 pt-3 px-3">
                                    <CardTitle className="text-xs font-bold">Product Information</CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 pb-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Category</p>
                                            <p className="text-sm font-medium capitalize">{selectedService.productCategory}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Type</p>
                                            <p className="text-sm font-medium capitalize">{selectedService.productType}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Brand</p>
                                            <p className="text-sm font-medium">{selectedService.brand}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Model</p>
                                            <p className="text-sm font-medium">{selectedService.model}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Problem Details */}
                            <Card>
                                <CardHeader className="pb-2 pt-3 px-3">
                                    <CardTitle className="text-xs font-bold">Problem Details</CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 pb-3 space-y-2">
                                    <div>
                                        <p className="text-xs text-gray-500">Service Type</p>
                                        <p className="text-sm font-medium">{selectedService.serviceType}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Description</p>
                                        <p className="text-sm text-gray-700">{selectedService.problemDescription}</p>
                                    </div>
                                    {selectedService.internalNotes && (
                                        <div>
                                            <p className="text-xs text-gray-500">Internal Notes</p>
                                            <p className="text-sm text-gray-700">{selectedService.internalNotes}</p>
                                        </div>
                                    )}
                                    {selectedService.tags && (
                                        <div>
                                            <p className="text-xs text-gray-500">Tags</p>
                                            <p className="text-sm">{selectedService.tags}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Parts & Pricing */}
                            {selectedService.parts && selectedService.parts.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-2 pt-3 px-3">
                                        <CardTitle className="text-xs font-bold">Parts & Pricing</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-3 pb-3 space-y-2">
                                        {selectedService.parts.map((part) => (
                                            <div key={part.id} className="flex justify-between items-center py-1.5 border-b last:border-b-0">
                                                <div>
                                                    <p className="text-sm font-medium">{part.name}</p>
                                                    <p className="text-xs text-gray-500">SKU: {part.sku} • Qty: {part.quantity}</p>
                                                </div>
                                                <p className="text-sm font-medium">${part.price.toFixed(2)}</p>
                                            </div>
                                        ))}
                                        <div className="pt-2 space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-600">Subtotal</span>
                                                <span className="font-medium">${selectedService.subtotal.toFixed(2)}</span>
                                            </div>
                                            {selectedService.discount > 0 && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">Discount</span>
                                                    <span className="font-medium text-green-600">-${selectedService.discount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-600">Tax</span>
                                                <span className="font-medium">${selectedService.tax.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-bold border-t pt-1.5">
                                                <span>Grand Total</span>
                                                <span>${selectedService.grandTotal.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Images */}
                            {selectedService.images && selectedService.images.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-2 pt-3 px-3">
                                        <CardTitle className="text-xs font-bold">Images</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-3 pb-3">
                                        <div className="grid grid-cols-3 gap-2">
                                            {selectedService.images.map((img, index) => (
                                                <img
                                                    key={index}
                                                    src={img}
                                                    alt={`Service ${index + 1}`}
                                                    className="w-full aspect-square object-cover rounded border"
                                                />
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Status Badge */}
                            <div className="flex items-center gap-2 pt-1">
                                <span className="text-xs font-medium">Status:</span>
                                <Badge className={getStatusBadge(selectedService.status)}>
                                    {selectedService.status}
                                </Badge>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the service request
                            {selectedServiceId && ` ${selectedServiceId}`}.
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

export default ServicesPage;
