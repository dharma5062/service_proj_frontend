import React, { useEffect, useState } from 'react';
import { useAuth } from '@/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import {
    useRolesPermissionsApi,
    type PermissionsGrouped,
    type CreateRolePayload,
    type UpdateRolePayload,
} from '@/pages/serviceAPI/RolesPermissionsAPI';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
    name: string;
    description: string;
    permissions: number[];
}

// ─── Component ─────────────────────────────────────────────────────────────────

const CreateRolePage: React.FC = () => {
    const { shopId, isSuperAdmin, hasPermission } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const roleId = id ? parseInt(id, 10) : undefined;

    const {
        useGetPermissions,
        useGetRoleById,
        useGetRoles,
        useCreateRole,
        useUpdateRole,
    } = useRolesPermissionsApi();

    // ── Remote Data ─────────────────────────────────────────────────────────

    /** Permissions grouped by module — used to render the privileges grid */
    const {
        data: permissionsGrouped = {} as PermissionsGrouped,
        isLoading: permissionsLoading,
    } = useGetPermissions();

    /**
     * Fetch the specific role when editing.
     * Uses the same cached roles query; no extra network call.
     */
    const {
        data: existingRole,
        isLoading: roleLoading,
    } = useGetRoleById(roleId);

    // rolesList is served from the same React Query cache as useGetRoleById,
    // so this does NOT fire an additional network request.
    const { data: rolesList = [] } = useGetRoles();

    // ── Mutations ────────────────────────────────────────────────────────────

    const createMutation = useCreateRole();
    const updateMutation = useUpdateRole();

    // ── Local Form State ─────────────────────────────────────────────────────

    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        permissions: [],
    });

    /**
     * Populate form when role data arrives (edit mode).
     * Also runs when roleId changes so navigating between different edit pages
     * always resets the form to the freshly fetched role data.
     */
    useEffect(() => {
        if (isEditMode && existingRole) {
            setFormData({
                name: existingRole.name,
                description: existingRole.description || '',
                permissions: existingRole.permissions.map((p) => p.id),
            });
        } else if (!isEditMode) {
            // Reset to empty when switching to create mode
            setFormData({ name: '', description: '', permissions: [] });
        }
    }, [isEditMode, existingRole, roleId]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handlePermissionToggle = (permId: number) => {
        setFormData((prev) => {
            const current = [...prev.permissions];
            if (current.includes(permId)) {
                return { ...prev, permissions: current.filter((id) => id !== permId) };
            }
            return { ...prev, permissions: [...current, permId] };
        });
    };

    const handleModuleToggleAll = (modulePerms: number[], allChecked: boolean) => {
        setFormData((prev) => {
            if (allChecked) {
                // Remove all perms in this module
                return {
                    ...prev,
                    permissions: prev.permissions.filter((id) => !modulePerms.includes(id)),
                };
            }
            // Add all perms in this module (deduplicated)
            const merged = Array.from(new Set([...prev.permissions, ...modulePerms]));
            return { ...prev, permissions: merged };
        });
    };

    const handleSaveRole = async () => {
        if (!formData.name.trim()) {
            toast.error('Role name is required');
            return;
        }
        if (formData.permissions.length === 0) {
            toast.error('At least one permission must be selected');
            return;
        }
        if (!shopId && !isSuperAdmin) {
            toast.error('No shop context found. Please select a shop.');
            return;
        }

        try {
            if (isEditMode && roleId) {
                // ── Update existing role ───────────────────────────────────────
                const payload: UpdateRolePayload = {
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                    permissions: formData.permissions,
                };
                await updateMutation.mutateAsync({ id: roleId, payload });
                toast.success('Role updated successfully');
            } else {
                // Check if role name already exists in the roles list
                const existingRoleInList = rolesList.find(
                    (r) => r.name.toLowerCase() === formData.name.trim().toLowerCase()
                );

                if (existingRoleInList) {
                    // Update the existing role instead of failing on create
                    const payload: UpdateRolePayload = {
                        name: formData.name.trim(),
                        description: formData.description.trim() || null,
                        permissions: formData.permissions,
                    };
                    await updateMutation.mutateAsync({ id: existingRoleInList.id, payload });
                    toast.success('Role updated successfully');
                } else {
                    // ── Create new role ────────────────────────────────────────────
                    const payload: CreateRolePayload = {
                        shop_id: shopId!, // validated above
                        name: formData.name.trim(),
                        description: formData.description.trim() || null,
                        permissions: formData.permissions,
                    };
                    await createMutation.mutateAsync(payload);
                    toast.success('Role created successfully');
                }
            }
            navigate('/dashboard/settings/roles');
        } catch (error: any) {
            console.error('Error saving role:', error);
            toast.error(error.message || 'Failed to save role');
        }
    };

    // ── Derived UI State ─────────────────────────────────────────────────────

    const isLoading = permissionsLoading || (isEditMode && roleLoading);
    const isSaving = createMutation.isPending || updateMutation.isPending;

    // ── Permission Guard ─────────────────────────────────────────────────────

    if (!hasPermission(isEditMode ? 'role.update' : 'role.create')) {
        return (
            <div className="p-8 text-center text-xs text-muted-foreground">
                Access Restricted. You do not have permission to view this page.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex-col">
            <main className="p-0">
                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex items-center justify-between mb-3 bg-white p-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-gray-100"
                            onClick={() => navigate('/dashboard/settings/roles')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                {isEditMode ? 'Edit Custom Role' : 'Create Custom Role'}
                            </h1>
                            <p className="text-xs text-gray-500">
                                Define the specific privileges assigned to this role.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => navigate('/dashboard/settings/roles')}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 text-xs bg-primary hover:bg-primary/90"
                            onClick={handleSaveRole}
                            disabled={isSaving || isLoading}
                        >
                            <Save className="h-3.5 w-3.5 mr-1.5" />
                            {isSaving ? 'Saving...' : 'Save Role'}
                        </Button>
                    </div>
                </div>

                <div className="p-3 max-w-6xl mx-auto space-y-3">
                    {isLoading ? (
                        <div className="text-center py-8 text-xs text-gray-500">
                            {isEditMode ? 'Loading role data...' : 'Loading permissions...'}
                        </div>
                    ) : (
                        <>
                            {/* ── Role Details Card ─────────────────────────────────── */}
                            <Card className="shadow-sm border-gray-200">
                                <CardHeader className="pb-2 pt-3 px-3">
                                    <CardTitle className="text-sm font-bold text-gray-900">
                                        Role Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 pb-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-gray-700">
                                                Role Name <span className="text-red-500">*</span>
                                            </label>
                                            {isEditMode ? (
                                                <Input
                                                    id="role-name"
                                                    value={formData.name}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, name: e.target.value })
                                                    }
                                                    className="h-8 text-xs"
                                                    placeholder="Role name"
                                                    disabled={isSaving}
                                                />
                                            ) : (
                                                <Select
                                                    value={formData.name}
                                                    onValueChange={(val) => {
                                                        const matchedRole = rolesList.find(r => r.name === val);
                                                        setFormData({
                                                            ...formData,
                                                            name: val,
                                                            description: matchedRole?.description || '',
                                                            permissions: matchedRole?.permissions ? matchedRole.permissions.map((p: any) => p.id) : []
                                                        });
                                                    }}
                                                    disabled={isSaving}
                                                >
                                                    <SelectTrigger id="role-select" className="h-8 text-xs">
                                                        <SelectValue placeholder="Select existing role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {rolesList.filter(r => r.shop_id !== null).map(r => (
                                                            <SelectItem key={r.id} value={r.name} className="text-xs">{r.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-medium text-gray-700">
                                                Description
                                            </label>
                                            <Textarea
                                                id="role-description"
                                                value={formData.description}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        description: e.target.value,
                                                    })
                                                }
                                                className="min-h-[32px] h-8 text-xs resize-none"
                                                placeholder="Briefly describe what this role does..."
                                                disabled={isSaving}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ── Privileges Assignment Card ────────────────────────── */}
                            <Card className="shadow-sm border-gray-200">
                                <CardHeader className="pb-2 pt-3 px-3 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-bold text-gray-900">
                                        Privileges Assignment
                                    </CardTitle>
                                    <span className="text-[10px] text-gray-500">
                                        {formData.permissions.length} permission
                                        {formData.permissions.length !== 1 ? 's' : ''} selected
                                    </span>
                                </CardHeader>
                                <CardContent className="px-3 pb-3">
                                    {Object.keys(permissionsGrouped).length === 0 ? (
                                        <p className="text-xs text-gray-500 py-4 text-center">
                                            No permissions available.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                            {Object.entries(permissionsGrouped).map(
                                                ([moduleName, modulePerms]) => {
                                                    const modulePermIds = modulePerms.map((p) => p.id);
                                                    const allChecked = modulePermIds.every((pid) =>
                                                        formData.permissions.includes(pid)
                                                    );
                                                    const someChecked =
                                                        !allChecked &&
                                                        modulePermIds.some((pid) =>
                                                            formData.permissions.includes(pid)
                                                        );

                                                    return (
                                                        <div
                                                            key={moduleName}
                                                            className="border rounded-md border-gray-200 bg-white overflow-hidden transition-all hover:border-gray-300"
                                                        >
                                                            {/* Module header with select-all toggle */}
                                                            <div className="bg-gray-50/80 border-b border-gray-100 px-3 py-2 flex items-center justify-between">
                                                                <h4 className="font-bold text-[11px] text-gray-700 uppercase tracking-wide">
                                                                    {moduleName}
                                                                </h4>
                                                                <Checkbox
                                                                    id={`module-${moduleName}`}
                                                                    className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-gray-300 rounded-[3px]"
                                                                    checked={
                                                                        allChecked
                                                                            ? true
                                                                            : someChecked
                                                                            ? 'indeterminate'
                                                                            : false
                                                                    }
                                                                    onCheckedChange={() =>
                                                                        handleModuleToggleAll(
                                                                            modulePermIds,
                                                                            allChecked
                                                                        )
                                                                    }
                                                                    disabled={isSaving}
                                                                    title={`Toggle all ${moduleName} permissions`}
                                                                />
                                                            </div>

                                                            {/* Individual permission checkboxes */}
                                                            <div className="p-2 flex flex-col gap-1.5">
                                                                {modulePerms.map((perm) => (
                                                                    <div
                                                                        key={perm.id}
                                                                        className="flex items-center space-x-2 py-1 px-1 hover:bg-gray-50 rounded-sm"
                                                                    >
                                                                        <Checkbox
                                                                            id={`perm-${perm.id}`}
                                                                            className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-gray-300 rounded-[3px]"
                                                                            checked={formData.permissions.includes(
                                                                                perm.id
                                                                            )}
                                                                            onCheckedChange={() =>
                                                                                handlePermissionToggle(perm.id)
                                                                            }
                                                                            disabled={isSaving}
                                                                        />
                                                                        <label
                                                                            htmlFor={`perm-${perm.id}`}
                                                                            className="text-xs font-medium text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                                                        >
                                                                            {perm.display_name}
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CreateRolePage;
