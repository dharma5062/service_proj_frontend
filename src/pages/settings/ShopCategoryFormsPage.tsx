import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    CategoryForm,
    fetchCategoryFormById,
    deserializeDefectFormData,
    isJsonFormData,
    useShopCategoryFormsApi,
} from '@/pages/serviceAPI/ShopCategoryFormsAPI';
import { Type, ChevronDown, ToggleLeft, CheckSquare, AlignLeft, Calendar, Camera, Lock } from 'lucide-react';
const ShopCategoryFormsPage = () => {
    const navigate = useNavigate();
    const { shopId } = useAuth();
    const { useGetCategoryForms, useDeleteCategoryForm } = useShopCategoryFormsApi();
    const { data: categoryForms = [], isLoading: loading } = useGetCategoryForms();
    const deleteCategoryFormMutation = useDeleteCategoryForm();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Reset pagination when branch changes
    useEffect(() => {
        setCurrentPage(1);
    }, [shopId]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedForm, setSelectedForm] = useState<CategoryForm | null>(null);



    const columns: Column<CategoryForm>[] = [
        {
            key: 'name',
            title: 'Name',
            dataIndex: 'name',
            sortable: true,
            filterable: true,
            render: (value) => <span className="font-medium text-gray-900">{value}</span>,
        },
        // Category Type column removed as per request
        {
            key: 'description',
            title: 'Description',
            dataIndex: 'description',
            render: (value) => {
                if (!value) return <span className="text-sm text-gray-600">-</span>;

                // Check if it's JSON form data
                if (isJsonFormData(value)) {
                    const formData = deserializeDefectFormData(value);
                    if (formData) {
                        return (
                            <span className="text-sm text-gray-600">
                                Defect Form ({formData.fields.length} fields)
                            </span>
                        );
                    }
                }

                // Render as plain text
                return (
                    <span className="text-sm text-gray-600 line-clamp-2">
                        {typeof value === 'string' ? value : '-'}
                    </span>
                );
            },
        },
        {
            key: 'categories',
            title: 'Category',
            dataIndex: 'categories',
            sortable: true,
            filterable: true,
            render: (value: any, record: CategoryForm) => {
                // Try the categories array first (many-to-many)
                if (Array.isArray(value) && value.length > 0) {
                    // Filter: Only show "leaf" categories (those that are not parents of any other selected category)
                    const leafCategories = value.filter(cat => 
                        !value.some(otherCat => otherCat.parent_id === cat.id)
                    );

                    // If for some reason all were parents (unlikely but safe fallback), show all
                    const displayCategories = leafCategories.length > 0 ? leafCategories : value;

                    return (
                        <div className="flex flex-wrap gap-1">
                            {displayCategories.map((cat: any) => (
                                <Badge key={cat.id} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    {cat.name}
                                </Badge>
                            ))}
                        </div>
                    );
                }
                // Fallback to legacy single category object
                if (record.category?.name) {
                    return (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {record.category.name}
                        </Badge>
                    );
                }
                return <span className="text-sm text-gray-600">-</span>;
            },
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
            toast.error('Failed to load defect form builder details');
        }
    };

    const handleEdit = (record: CategoryForm) => {
        navigate(`/dashboard/settings/category-form/edit/${record.id}`);
    };

    const handleDeleteClick = (record: CategoryForm) => {
        setSelectedFormId(record.id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedFormId) {
            try {
                await deleteCategoryFormMutation.mutateAsync(selectedFormId);
                toast.success('Defect form builder deleted successfully');
            } catch (error) {
                toast.error('Failed to delete defect form builder', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        setDeleteDialogOpen(false);
        setSelectedFormId(null);
    };

    const handleAddNew = () => {
        navigate('/dashboard/settings/category-form/create');
    };

    const getFieldIcon = (type: string) => {
        const icons: Record<string, any> = {
            text: Type,
            dropdown: ChevronDown,
            toggle: ToggleLeft,
            checkbox: CheckSquare,
            textarea: AlignLeft,
            date: Calendar,
            'device-photos': Camera,
            'pattern-lock': Lock,
        };
        return icons[type] || Type;
    };

    return (
        <div className="p-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Defect Form Builder</h1>
                    <p className="text-xs sm:text-sm mt-0.5 text-blue-600">Manage defect form builders and their configurations.</p>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={categoryForms}
                title="Defect Form Builders List"
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
                        <DialogTitle className="text-base font-bold">Defect Form Builder Details</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            View defect form builder information
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
                                        {/* Category Type removed */}
                                        <div>
                                            <p className="text-xs text-gray-500">Status</p>
                                            <Badge className={selectedForm.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                                {selectedForm.active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        {/* Show categories from many-to-many relationship */}
                                        {selectedForm.categories && selectedForm.categories.length > 0 ? (
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-500">Categories</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {(() => {
                                                        const leafCats = selectedForm.categories.filter(cat => 
                                                            !selectedForm.categories!.some(otherCat => otherCat.parent_id === cat.id)
                                                        );
                                                        const displayCats = leafCats.length > 0 ? leafCats : selectedForm.categories;
                                                        
                                                        return displayCats.map((cat) => (
                                                            <Badge key={cat.id} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                                {cat.name}
                                                            </Badge>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                        ) : selectedForm.category ? (
                                            <div>
                                                <p className="text-xs text-gray-500">Category</p>
                                                <p className="text-sm font-medium">{selectedForm.category.name}</p>
                                            </div>
                                        ) : null}
                                        {selectedForm.description && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-500">Description</p>
                                                {isJsonFormData(selectedForm.description) ? (
                                                    <div className="mt-2">
                                                        {(() => {
                                                            const formData = deserializeDefectFormData(selectedForm.description);
                                                            if (!formData) return <p className="text-sm text-gray-500">No form data available</p>;

                                                            return (
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant="outline" className="capitalize">
                                                                            {formData.deviceType}
                                                                        </Badge>
                                                                        <span className="text-xs text-gray-500">
                                                                            {formData.fields.length} field{formData.fields.length !== 1 ? 's' : ''}
                                                                        </span>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {formData.fields.map((field, idx) => {
                                                                            const FieldIcon = getFieldIcon(field.type);
                                                                            return (
                                                                                <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                                                                    <FieldIcon className="w-4 h-4 text-gray-600 mt-0.5" />
                                                                                    <div className="flex-1">
                                                                                        <p className="text-xs font-medium">{field.label}</p>
                                                                                        <div className="flex gap-2 mt-1">
                                                                                            <span className="text-xs text-gray-500 capitalize">{field.type}</span>
                                                                                            {field.required && (
                                                                                                <Badge variant="secondary" className="text-xs px-1 py-0">Required</Badge>
                                                                                            )}
                                                                                            {field.showOnReceipt && (
                                                                                                <Badge variant="outline" className="text-xs px-1 py-0">Receipt</Badge>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-700">
                                                        {typeof selectedForm.description === 'string'
                                                            ? selectedForm.description
                                                            : 'Form data available'}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
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
                            This action cannot be undone. This will permanently delete the defect form builder.
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

export default ShopCategoryFormsPage;
