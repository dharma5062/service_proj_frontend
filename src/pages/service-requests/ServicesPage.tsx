import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
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

import { toast } from 'sonner';
import { DataTable, Column } from '@/components/ui/table/tableComponents';
import {
    ServiceRequest,
    useServiceRequestsApi,
} from '@/pages/serviceAPI/ServiceRequestsAPI';

// ─── Status helpers ──────────────────────────────────────────────────────────

const formatStatusLabel = (status?: string) => {
    if (!status) return 'N/A';
    // Convert underscores to spaces and capitalize each word
    return status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
};

const capitalizeWords = (str?: string) => {
    if (!str) return '-';
    return str.replace(/\b\w/g, (c) => c.toLocaleUpperCase());
};

// ─── Component ───────────────────────────────────────────────────────────────

const ServicesPage = () => {
    const navigate = useNavigate();
    const { shopId, hasPermission, user, isShopEmployee } = useAuth();
    const { useGetServiceRequests, useDeleteServiceRequest } = useServiceRequestsApi();
    const { data: rawServiceRequests = [], isLoading: loading } = useGetServiceRequests();
    const deleteServiceRequestMutation = useDeleteServiceRequest();

    // Filter and sort service requests
    const serviceRequests = useMemo(() => {
        let filtered = [...rawServiceRequests];

        // If the user is a shop employee, filter to only show requests assigned to them
        if (isShopEmployee && user?.id) {
            filtered = filtered.filter(req => req.assigned_technician?.id === user.id);
        }

        return filtered.sort((a, b) => b.id - a.id); // Sort by newest first (descending ID)
    }, [rawServiceRequests, isShopEmployee, user?.id]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Reset pagination when branch changes
    useEffect(() => {
        setCurrentPage(1);
    }, [shopId]);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);

    // ── Column definitions ───────────────────────────────────────────────────

    const columns: Column<ServiceRequest>[] = [
        {
            key: 'id',
            title: 'Request ID',
            dataIndex: 'id',
            sortable: true,
            filterable: true,
            render: (value) => (
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                    SR{String(value).padStart(3, '0')}
                </span>
            ),
        },
        {
            key: 'service_type',
            title: 'Service Type',
            dataIndex: 'form',
            sortable: true,
            filterable: true,
            render: (_value, record) => {
                const formName = record.form?.name;
                if (formName) return <span className="text-xs font-semibold text-gray-900">{capitalizeWords(formName)}</span>;

                const details = parseJson(record.service_details);
                if (details?.serviceType) return <span className="text-xs font-semibold text-gray-900">{capitalizeWords(details.serviceType)}</span>;
                if (details?.productType) return <span className="text-xs font-semibold text-gray-900">{capitalizeWords(details.productType)}</span>;

                return <span className="text-xs text-gray-400">-</span>;
            },
        },
        {
            key: 'customer',
            title: 'Customer',
            dataIndex: 'customer',
            sortable: true,
            filterable: true,
            render: (_value, record) => {
                const customer = record.customer;
                if (!customer) return <span className="text-xs text-gray-400">-</span>;
                return (
                    <div>
                        <p className="text-xs font-semibold text-gray-900">{capitalizeWords(customer.name)}</p>
                        {customer.phone && (
                            <p className="text-[11px] text-gray-500 mt-0.5">{customer.phone}</p>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'device',
            title: 'Product / Brand',
            dataIndex: 'product',
            sortable: true,
            filterable: true,
            render: (_value, record) => {
                const productName = record.product?.name;
                const brandName = record.brand?.name;
                const serviceName = record.form?.name;

                if (!productName && !brandName) {
                    return <span className="text-xs text-gray-400">-</span>;
                }

                const subtitleParts: string[] = [];
                if (brandName) subtitleParts.push(capitalizeWords(brandName));
                if (serviceName) subtitleParts.push(capitalizeWords(serviceName));

                return (
                    <div>
                        <p className="text-xs font-semibold text-gray-900">{capitalizeWords(productName) || '-'}</p>
                        {subtitleParts.length > 0 && (
                            <p className="text-[11px] text-gray-500 mt-0.5">{subtitleParts.join(' · ')}</p>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'assigned_technician',
            title: 'Shop Employee',
            dataIndex: 'assigned_technician',
            sortable: true,
            filterable: true,
            render: (_value, record) => {
                const technician = record.assigned_technician;
                if (!technician) return <span className="text-xs text-gray-400">Not Assigned</span>;
                return (
                    <div>
                        <p className="text-xs font-semibold text-gray-900">{capitalizeWords(technician.name)}</p>
                        {technician.phone && (
                            <p className="text-[11px] text-gray-500 mt-0.5">{technician.phone}</p>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'technician_role',
            title: 'Role',
            dataIndex: 'assigned_technician',
            sortable: true,
            filterable: true,
            render: (_value, record) => {
                const role = record.assigned_technician?.role;
                if (!role) return <span className="text-xs text-gray-400">-</span>;
                return (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">
                        {capitalizeWords(role)}
                    </span>
                );
            },
        },
        {
            key: 'service_status',
            title: 'Status',
            dataIndex: 'service_status',
            sortable: true,
            filterable: true,
            filterOptions: [
                { label: 'Pending', value: 'pending' },
                { label: 'Assigned', value: 'assigned' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'Completed', value: 'completed' },
                { label: 'Cancelled', value: 'cancelled' },
            ],
            render: (_value, record) => {
                const status = record.service_status || record.status;
                const styleMap: Record<string, string> = {
                    in_progress: 'text-blue-700 bg-blue-50',
                    assigned: 'text-purple-700 bg-purple-50 border border-purple-100',
                    pending: 'text-yellow-700 bg-yellow-50',
                    completed: 'text-green-700 bg-green-50',
                    cancelled: 'text-red-700 bg-red-50',
                };
                const key = (status || 'pending').toLowerCase();
                const style = styleMap[key] ?? 'text-gray-700 bg-gray-50';
                return (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${style}`}>
                        {formatStatusLabel(status)}
                    </span>
                );
            },
        },
        {
            key: 'created_at',
            title: 'Created Date',
            dataIndex: 'created_at',
            sortable: true,
            render: (value) => (
                <span className="text-xs text-gray-600 whitespace-nowrap">{formatDate(value)}</span>
            ),
        },
    ];

    // ── Action handlers ──────────────────────────────────────────────────────

    const handleView = (record: ServiceRequest) => {
        navigate(`/dashboard/services/view/${record.id}`);
    };

    const handleEdit = (record: ServiceRequest) => {
        navigate(`/dashboard/services/edit/${record.id}`);
    };

    const handleDeleteClick = (record: ServiceRequest) => {
        setSelectedDeleteId(record.id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedDeleteId) {
            try {
                await deleteServiceRequestMutation.mutateAsync(selectedDeleteId);
                toast.success('Service request deleted successfully');
            } catch (error) {
                toast.error('Failed to delete service request', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        setDeleteDialogOpen(false);
        setSelectedDeleteId(null);
    };

    const handleAddNew = () => {
        navigate('/dashboard/services/create');
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="p-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Service Requests</h1>
                    <p className="text-xs sm:text-sm mt-0.5 text-blue-600">
                        Manage all service requests and repairs.
                    </p>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={serviceRequests}
                title="Service Requests List"
                searchable={true}
                showActions={true}
                showAdd={hasPermission('service.create')}
                showExport={true}
                onAdd={hasPermission('service.create') ? handleAddNew : undefined}
                onView={handleView}
                onEdit={hasPermission('service.update') ? handleEdit : undefined}
                onDelete={hasPermission('service.delete') ? handleDeleteClick : undefined}
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
                loading={loading}
            />


            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the service request.
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

// ─── Utilities ───────────────────────────────────────────────────────────────

function parseJson(value: any): any {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}
