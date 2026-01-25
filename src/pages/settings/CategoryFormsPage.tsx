import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { DataTable, Column } from '@/components/ui/table/tableComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    CategoryForm,
    fetchCategoryForms,
    fetchCategoryFormById,
    createCategoryForm,
    updateCategoryForm,
    deleteCategoryForm,
    CreateCategoryFormPayload,
} from '@/pages/serviceAPI/CategoryFormsAPI';
import { fetchProductCategories, ProductCategory } from '@/pages/serviceAPI/ProductCategoriesAPI';

interface CategoryFormData {
    name: string;
    category_type: string;
    description: string;
    active: boolean;
    category_id: number | null;
}

const CategoryFormsPage = () => {
    const [categoryForms, setCategoryForms] = useState<CategoryForm[]>([]);
    const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedForm, setSelectedForm] = useState<CategoryForm | null>(null);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
        category_type: '',
        description: '',
        active: true,
        category_id: null,
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Fetch category forms and product categories on mount
    useEffect(() => {
        loadCategoryForms();
        loadProductCategories();
    }, []);

    const loadCategoryForms = async () => {
        try {
            setLoading(true);
            const data = await fetchCategoryForms();
            setCategoryForms(data);
        } catch (error) {
            toast.error('Failed to load category forms', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setLoading(false);
        }
    };

    const loadProductCategories = async () => {
        try {
            const data = await fetchProductCategories();
            setProductCategories(data);
        } catch (error) {
            toast.error('Failed to load categories', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const columns: Column<CategoryForm>[] = [
        {
            key: 'name',
            title: 'Name',
            dataIndex: 'name',
            sortable: true,
            filterable: true,
            render: (value) => <span className="font-medium text-gray-900">{value}</span>,
        },
        {
            key: 'category_type',
            title: 'Category Type',
            dataIndex: 'category_type',
            sortable: true,
            filterable: true,
            render: (value) => (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {value}
                </Badge>
            ),
        },
        {
            key: 'description',
            title: 'Description',
            dataIndex: 'description',
            render: (value) => (
                <span className="text-sm text-gray-600 line-clamp-2">
                    {value || '-'}
                </span>
            ),
        },
        {
            key: 'category',
            title: 'Category',
            dataIndex: 'category',
            sortable: true,
            filterable: true,
            render: (value) => (
                <span className="text-sm text-gray-600">
                    {value?.name || '-'}
                </span>
            ),
        },
        {
            key: 'active',
            title: 'Status',
            dataIndex: 'active',
            sortable: true,
            filterable: true,
            filterOptions: [
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' },
            ],
            render: (value) => (
                <Badge className={value ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                    {value ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
    ];

    const handleView = async (record: CategoryForm) => {
        try {
            const form = await fetchCategoryFormById(record.id);
            setSelectedForm(form);
            setViewDialogOpen(true);
        } catch (error) {
            toast.error('Failed to load category form details');
        }
    };

    const handleEdit = (record: CategoryForm) => {
        setIsEditMode(true);
        setSelectedFormId(record.id);
        setFormData({
            name: record.name,
            category_type: record.category_type,
            description: record.description || '',
            active: Boolean(record.active),
            category_id: record.category_id || null,
        });
        setFormDialogOpen(true);
    };

    const handleDeleteClick = (record: CategoryForm) => {
        setSelectedFormId(record.id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedFormId) {
            try {
                await deleteCategoryForm(selectedFormId);
                toast.success('Category form deleted successfully');
                loadCategoryForms();
            } catch (error) {
                toast.error('Failed to delete category form', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        setDeleteDialogOpen(false);
        setSelectedFormId(null);
    };

    const handleAddNew = () => {
        setIsEditMode(false);
        setSelectedFormId(null);
        setFormData({
            name: '',
            category_type: '',
            description: '',
            active: true,
            category_id: null,
        });
        setFormErrors({});
        setFormDialogOpen(true);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }

        if (!formData.category_type.trim()) {
            errors.category_type = 'Category type is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            const payload: CreateCategoryFormPayload = {
                name: formData.name,
                category_type: formData.category_type,
                description: formData.description,
                active: formData.active ? 1 : 0,
                category_id: formData.category_id,
            };

            if (isEditMode && selectedFormId) {
                await updateCategoryForm(selectedFormId, payload);
                toast.success('Category form updated successfully');
            } else {
                await createCategoryForm(payload);
                toast.success('Category form created successfully');
            }

            setFormDialogOpen(false);
            loadCategoryForms();
        } catch (error) {
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} category form`, {
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
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Category Forms</h1>
                    <p className="text-xs sm:text-sm mt-0.5 text-blue-600">Manage category forms and their configurations.</p>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={categoryForms}
                title="Category Forms List"
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
                    total: categoryForms.length,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
                hoverable
                bordered
                loading={loading}
            />

            {/* View Category Form Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Category Form Details</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            View category form information
                        </DialogDescription>
                    </DialogHeader>

                    {selectedForm && (
                        <div className="space-y-3">
                            {/* Basic Info */}
                            <Card>
                                <CardHeader className="pb-2 pt-3 px-3">
                                    <CardTitle className="text-xs font-bold">Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 pb-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Name</p>
                                            <p className="text-sm font-medium">{selectedForm.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Category Type</p>
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {selectedForm.category_type}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Status</p>
                                            <Badge className={selectedForm.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                                {selectedForm.active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        {selectedForm.category && (
                                            <div>
                                                <p className="text-xs text-gray-500">Category</p>
                                                <p className="text-sm font-medium">{selectedForm.category.name}</p>
                                            </div>
                                        )}
                                        {selectedForm.description && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-500">Description</p>
                                                <p className="text-sm text-gray-700">{selectedForm.description}</p>
                                            </div>
                                        )}
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
                            {isEditMode ? 'Edit Category Form' : 'Create New Category Form'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            {isEditMode ? 'Update category form information' : 'Add a new category form'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                                Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g., Electronics Form, Appliance Form"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={formErrors.name ? 'border-red-500' : ''}
                            />
                            {formErrors.name && (
                                <p className="text-xs text-red-500">{formErrors.name}</p>
                            )}
                        </div>

                        {/* Category Type */}
                        <div className="space-y-2">
                            <Label htmlFor="category_type" className="text-sm font-medium">
                                Category Type <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="category_type"
                                placeholder="e.g., Electronics, Appliances, Furniture"
                                value={formData.category_type}
                                onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
                                className={formErrors.category_type ? 'border-red-500' : ''}
                            />
                            {formErrors.category_type && (
                                <p className="text-xs text-red-500">{formErrors.category_type}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Brief description of the category form"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category_id" className="text-sm font-medium">
                                Category
                            </Label>
                            <Select
                                value={formData.category_id?.toString() || 'none'}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, category_id: value === 'none' ? null : parseInt(value) })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {productCategories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">Associate this form with a product category</p>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="active" className="text-sm font-medium">
                                    Active Status
                                </Label>
                                <p className="text-xs text-gray-500">Enable this category form for use</p>
                            </div>
                            <Switch
                                id="active"
                                checked={formData.active}
                                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Saving...' : isEditMode ? 'Update Form' : 'Create Form'}
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
                            This action cannot be undone. This will permanently delete the category form.
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

export default CategoryFormsPage;
