import React, { useState } from 'react';
import { useAuth } from '@/AuthContext';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DataTable, Column } from '@/components/ui/table/datatable';
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
    useRolesPermissionsApi,
    type Role,
} from '@/pages/serviceAPI/RolesPermissionsAPI';

const RolesPermissionsPage: React.FC = () => {
    const { hasPermission } = useAuth();
    const navigate = useNavigate();

    const { useGetRoles, useDeleteRole } = useRolesPermissionsApi();

    // ── Data Fetching ──────────────────────────────────────────────────────────
    const { data: roles = [], isLoading } = useGetRoles();

    // ── Delete Logic ───────────────────────────────────────────────────────────
    const deleteMutation = useDeleteRole();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);

    // ── Pagination ─────────────────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const handleOpenRolePage = (role?: Role) => {
        if (role) {
            navigate(`/dashboard/settings/roles/edit/${role.id}`);
        } else {
            navigate('/dashboard/settings/roles/create');
        }
    };

    const handleDeleteClick = (role: Role) => {
        setSelectedDeleteId(role.id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedDeleteId === null) return;

        try {
            await deleteMutation.mutateAsync(selectedDeleteId);
            toast.success('Role deleted successfully');
        } catch (error: any) {
            console.error('Error deleting role:', error);
            toast.error(error.message || 'Failed to delete role');
        } finally {
            setDeleteDialogOpen(false);
            setSelectedDeleteId(null);
        }
    };

    // ── Table Columns ──────────────────────────────────────────────────────────
    const columns: Column<Role>[] = [
        {
            key: 'name',
            title: 'Role Name',
            dataIndex: 'name',
            sortable: true,
            filterable: true,
            render: (value) => (
                <span className="text-xs font-bold text-gray-900 leading-tight">
                    {value ? value.charAt(0).toUpperCase() + value.slice(1) : '-'}
                </span>
            ),
        },
        {
            key: 'description',
            title: 'Description',
            dataIndex: 'description',
            render: (value) => (
                <span className="text-[10px] text-gray-500 font-medium line-clamp-1 max-w-[300px]">
                    {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'No description provided'}
                </span>
            ),
        },
        {
            key: 'permissions',
            title: 'Permissions',
            dataIndex: 'permissions',
            render: (_value, record) => (
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {record.permissions.slice(0, 3).map((p) => (
                        <Badge
                            key={p.id}
                            variant="secondary"
                            className="text-[10px] font-normal px-1.5 py-0"
                        >
                            {p.display_name}
                        </Badge>
                    ))}
                    {record.permissions.length > 3 && (
                        <Badge
                            variant="outline"
                            className="text-[10px] font-normal px-1.5 py-0 bg-gray-50 text-gray-600 border-gray-200"
                        >
                            +{record.permissions.length - 3} more
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'type',
            title: 'Type',
            dataIndex: 'shop_id',
            sortable: true,
            render: (value) =>
                value === null ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap text-primary bg-primary/10 border border-primary/20">
                        System Role
                    </span>
                ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap text-green-700 bg-green-100 border border-green-200">
                        Custom Role
                    </span>
                ),
        },
    ];

    // ── Permission Guard ───────────────────────────────────────────────────────
    if (!hasPermission('role.view')) {
        return (
            <div className="p-8 text-center text-xs text-muted-foreground">
                Access Restricted. You do not have permission to view roles.
            </div>
        );
    }

    return (
        <div className="p-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                        Roles &amp; Privileges
                    </h1>
                    <p className="text-xs sm:text-sm mt-0.5 text-primary font-medium">
                        Manage employee access levels and system permissions.
                    </p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={roles}
                title="Roles List"
                searchable={true}
                showActions={true}
                showAdd={hasPermission('role.create')}
                showExport={false}
                onAdd={
                    hasPermission('role.create')
                        ? () => handleOpenRolePage()
                        : undefined
                }
                onEdit={
                    hasPermission('role.update')
                        ? (record) => {
                            // System roles (shop_id === null) are not editable
                            if (record.shop_id !== null) {
                                handleOpenRolePage(record);
                            } else {
                                toast.error('System roles cannot be edited');
                            }
                        }
                        : undefined
                }
                onDelete={
                    hasPermission('role.delete')
                        ? (record) => {
                            // System roles (shop_id === null) are not deletable
                            if (record.shop_id !== null) {
                                handleDeleteClick(record);
                            } else {
                                toast.error('System roles cannot be deleted');
                            }
                        }
                        : undefined
                }
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: roles.length,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
                hoverable
                bordered
                loading={isLoading}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            custom role and remove it from all assigned employees.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default RolesPermissionsPage;
