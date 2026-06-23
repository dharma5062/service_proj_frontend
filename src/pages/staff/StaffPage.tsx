import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, ShieldCheck, Calendar } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/table/datatable';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useShopEmployeesApi, ShopEmployee, ShopEmployeePayload } from '@/pages/serviceAPI/ShopEmployeesAPI';
import { useAuth } from '@/AuthContext';
import { useRolesPermissionsApi } from '@/pages/serviceAPI/RolesPermissionsAPI';
import { useQueryClient } from '@tanstack/react-query';



const StaffPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customRoleName, setCustomRoleName] = useState('');
    const [editCustomRoleName, setEditCustomRoleName] = useState('');

    // Form state for new employee
    const [newEmployee, setNewEmployee] = useState<ShopEmployeePayload>({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: '',
        address: '',
    });

    const { axiosInstance, shopId, hasPermission } = useAuth();
    const queryClient = useQueryClient();
    const { useGetRoles } = useRolesPermissionsApi();
    const { data: rolesList = [] } = useGetRoles();

    const {
        useGetShopEmployees,
        useCreateShopEmployee,
        useUpdateShopEmployee,
        useDeleteShopEmployee
    } = useShopEmployeesApi();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<ShopEmployee | null>(null);
    const [editForm, setEditForm] = useState<ShopEmployeePayload>({
        name: '',
        email: '',
        phone: '',
        role: '',
        address: '',
    });

    const { data: employeesData, isLoading } = useGetShopEmployees({
        per_page: 500, // Fetch all to allow smooth client-side search
    });

    const createEmployeeMutation = useCreateShopEmployee();
    const updateEmployeeMutation = useUpdateShopEmployee();
    const deleteEmployeeMutation = useDeleteShopEmployee();

    const staffList = employeesData?.data || [];

    const mappedStaffList = React.useMemo(() => {
        return staffList.map(emp => {
            const matchedRole = rolesList.find(r => r.id.toString() === emp.role?.toString());
            const roleName = matchedRole ? matchedRole.name : (emp.role || '');
            return {
                ...emp,
                _filter_role: emp.role?.toString() || '',
                _search_blob: `${emp.name} ${emp.email} ${emp.phone || ''} ${roleName}`.toLowerCase()
            };
        });
    }, [staffList, rolesList]);

    const totalEmployees = mappedStaffList.length;



    // Staff List Columns
    const staffColumns: Column<ShopEmployee>[] = [
        {
            key: 'name',
            title: 'Staff Name',
            dataIndex: 'name',
            sortable: true,
            filterable: true,
            render: (value, record) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                            {record.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold text-gray-900">
                        {value ? value.charAt(0).toUpperCase() + value.slice(1) : '-'}
                    </span>
                </div>
            ),
        },
        {
            key: 'email',
            title: 'Contact Info',
            dataIndex: 'email',
            sortable: true,
            filterable: true,
            render: (value, record) => (
                <div className="flex flex-col">
                    <span className="text-gray-900 font-bold text-xs">{value}</span>
                    <span className="text-gray-500 font-medium text-[10px]">{record.phone}</span>
                </div>
            ),
        },
        {
            key: 'role',
            title: 'Role',
            dataIndex: 'role',
            sortable: true,
            filterable: true,
            render: (value) => {
                const matched = rolesList.find(r => r.id.toString() === value?.toString());
                const displayName = matched ? matched.name : (value || '—');
                return (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 capitalize">
                        {displayName}
                    </span>
                );
            },
        },
    ];


    const handleAddStaff = () => {
        setIsAddModalOpen(true);
    };

    const handleCreateEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let finalRoleId = newEmployee.role;

            // Handle custom role creation
            if (newEmployee.role === 'other') {
                if (!customRoleName.trim()) {
                    toast.error('Please enter a custom role name');
                    setIsSubmitting(false);
                    return;
                }
                let fallbackPermId = 1;
                try {
                    const permsRes = await axiosInstance.get('/permissions');
                    const permsData = permsRes.data?.data || permsRes.data;
                    if (permsData && typeof permsData === 'object') {
                        const firstModule = Object.values(permsData)[0] as any[];
                        if (firstModule && firstModule.length > 0) {
                            fallbackPermId = firstModule[0].id;
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch fallback permission", e);
                }

                const roleRes = await axiosInstance.post('/roles-store', {
                    shop_id: shopId,
                    name: customRoleName,
                    permissions: [fallbackPermId]
                });
                const createdRole = roleRes.data?.data || roleRes.data;
                finalRoleId = createdRole.id.toString();
                // Invalidate roles cache so React Query re-fetches fresh list
                queryClient.invalidateQueries({ queryKey: ['roles'] });
            }

            const payload = { ...newEmployee, role: finalRoleId };
            const res = await createEmployeeMutation.mutateAsync(payload);

            // Extract created user id. Backend likely returns it in res.data?.id or res.id
            const newUserId = res.data?.id || (res as any).id;

            // If they picked a numeric custom role id
            if (newUserId && !isNaN(Number(finalRoleId))) {
                await axiosInstance.post('/roles-assign', {
                    user_id: newUserId,
                    role_id: Number(finalRoleId)
                });
            }

            toast.success('Staff member added successfully');
            setIsAddModalOpen(false);
            setNewEmployee({
                name: '',
                email: '',
                phone: '',
                password: '',
                role: '',
                address: '',
            });
            setCustomRoleName('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to add staff member');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewStaff = (record: ShopEmployee) => {
        setSelectedEmployee(record);
        setIsViewModalOpen(true);
    };

    const handleEditStaff = (record: ShopEmployee) => {
        setSelectedEmployee(record);

        // Find the role ID from the name to populate the select input correctly
        const matchedRole = rolesList.find(r => r.name === record.role || r.id.toString() === record.role?.toString());

        setEditForm({
            name: record.name,
            email: record.email,
            phone: record.phone,
            role: matchedRole ? matchedRole.id.toString() : (record.role || ''),
            address: record.address || '',
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedEmployee) return;

        setIsSubmitting(true);
        try {
            let finalRoleId = editForm.role;

            // Handle custom role creation in edit modal
            if (editForm.role === 'other') {
                if (!editCustomRoleName.trim()) {
                    toast.error('Please enter a custom role name');
                    setIsSubmitting(false);
                    return;
                }
                let fallbackPermId = 1;
                try {
                    const permsRes = await axiosInstance.get('/permissions');
                    const permsData = permsRes.data?.data || permsRes.data;
                    if (permsData && typeof permsData === 'object') {
                        const firstModule = Object.values(permsData)[0] as any[];
                        if (firstModule && firstModule.length > 0) {
                            fallbackPermId = firstModule[0].id;
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch fallback permission", e);
                }

                const roleRes = await axiosInstance.post('/roles-store', {
                    shop_id: shopId,
                    name: editCustomRoleName,
                    permissions: [fallbackPermId]
                });
                const createdRole = roleRes.data?.data || roleRes.data;
                finalRoleId = createdRole.id.toString();
                // Invalidate roles cache so React Query re-fetches fresh list
                queryClient.invalidateQueries({ queryKey: ['roles'] });
            }

            const payload = { ...editForm, role: finalRoleId };
            await updateEmployeeMutation.mutateAsync({
                id: selectedEmployee.id,
                payload
            });

            // Assign role
            if (!isNaN(Number(finalRoleId))) {
                try {
                    await axiosInstance.post('/roles-assign', {
                        user_id: selectedEmployee.id,
                        role_id: Number(finalRoleId)
                    });
                } catch (rErr) {
                    console.error("Role assignment failed", rErr);
                }
            }

            toast.success('Staff member updated successfully');
            setIsEditModalOpen(false);
            setEditCustomRoleName('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update staff member');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStaff = (record: ShopEmployee) => {
        setSelectedEmployee(record);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteEmployee = async () => {
        if (!selectedEmployee) return;

        setIsSubmitting(true);
        try {
            await deleteEmployeeMutation.mutateAsync(selectedEmployee.id);
            toast.success('Staff member deleted successfully');
            setIsDeleteModalOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete staff member');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="p-0">
            {/* <div className="flex justify-between items-start mb-0">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Staff & Technician Management</h1>
                </div>
            </div> */}

            <DataTable
                columns={staffColumns}
                data={mappedStaffList}
                title="Staff Members"
                filterConfig={[
                    {
                        key: '_filter_role',
                        label: 'Role',
                        type: 'select',
                        options: rolesList.map(r => ({
                            label: r.name,
                            value: r.id.toString()
                        }))
                    }
                ]}
                searchKey="_search_blob"
                searchable={true}
                rowSelection={false}
                showActions={true}
                showAdd={hasPermission('employee.create')}
                showExport={true}
                onAdd={hasPermission('employee.create') ? handleAddStaff : undefined}
                onView={handleViewStaff}
                onEdit={hasPermission('employee.update') ? handleEditStaff : undefined}
                onDelete={hasPermission('employee.delete') ? handleDeleteStaff : undefined}
                loading={isLoading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalEmployees,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
                hoverable
                bordered
                density="compact"
            />

            {/* Add Staff Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Staff Member</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm mt-0.5 text-primary font-medium">
                            Create a new shop employee. They will be able to log in with their email and password.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateEmployee} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    required
                                    value={newEmployee.name}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    required
                                    value={newEmployee.email}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    placeholder="+91 99999 99999"
                                    required
                                    value={newEmployee.phone}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={newEmployee.role}
                                    onValueChange={(val) => setNewEmployee({ ...newEmployee, role: val })}
                                >
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rolesList.map(r => (
                                            <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                                        ))}
                                        <SelectItem value="other">Other (Manual)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {newEmployee.role === 'other' && (
                                    <Input
                                        className="mt-2"
                                        placeholder="Enter custom role name"
                                        value={customRoleName}
                                        onChange={(e) => setCustomRoleName(e.target.value)}
                                        required
                                    />
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={newEmployee.password}
                                onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address (Optional)</Label>
                            <Input
                                id="address"
                                placeholder="123 Main St, City"
                                value={newEmployee.address || ''}
                                onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Adding...' : 'Add Member'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Staff Details Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Staff Details</DialogTitle>
                    </DialogHeader>
                    {selectedEmployee && (
                        <div className="space-y-6 py-4">
                            <div className="flex items-center gap-4 border-b pb-6">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                        {selectedEmployee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedEmployee.name}</h3>
                                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 mt-1">
                                        {(() => {
                                            const matched = rolesList.find(r => r.id.toString() === selectedEmployee.role?.toString());
                                            return matched ? matched.name : (selectedEmployee.role || 'No Role');
                                        })()}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <Mail className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-xs">Email Address</span>
                                        <span className="font-medium">{selectedEmployee.email}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <Phone className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-xs">Phone Number</span>
                                        <span className="font-medium">{selectedEmployee.phone}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <ShieldCheck className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-xs">Account Status</span>
                                        <span className="font-medium text-green-600">{selectedEmployee.status || 'Active'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <MapPin className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-xs">Address</span>
                                        <span className="font-medium">{selectedEmployee.address || 'Not Provided'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <Calendar className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-xs">Member Since</span>
                                        <span className="font-medium">
                                            {selectedEmployee.created_at ? new Date(selectedEmployee.created_at).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsViewModalOpen(false)} className="w-full">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Staff Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Staff Member</DialogTitle>
                        <DialogDescription>
                            Update the profile information for {selectedEmployee?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateEmployee} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Full Name</Label>
                                <Input
                                    id="edit-name"
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">Email Address</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    required
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-phone">Phone Number</Label>
                                <Input
                                    id="edit-phone"
                                    required
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-role">Role</Label>
                                <Select
                                    value={editForm.role}
                                    onValueChange={(val) => setEditForm({ ...editForm, role: val })}
                                >
                                    <SelectTrigger id="edit-role">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rolesList.map(r => (
                                            <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                                        ))}
                                        <SelectItem value="other">Other (Manual)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {editForm.role === 'other' && (
                                    <Input
                                        className="mt-2"
                                        placeholder="Enter custom role name"
                                        value={editCustomRoleName}
                                        onChange={(e) => setEditCustomRoleName(e.target.value)}
                                        required
                                    />
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-address">Address (Optional)</Label>
                            <Input
                                id="edit-address"
                                value={editForm.address || ''}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update Member'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete Staff Member</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-bold text-gray-900">{selectedEmployee?.name}</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDeleteEmployee}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete Staff'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StaffPage;
