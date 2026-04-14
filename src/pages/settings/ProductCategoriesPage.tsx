import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
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
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon, Upload, X, Edit, Trash2, Plus } from 'lucide-react';
import {
    ProductCategory,
    CreateCategoryPayload,
    useProductCategoriesApi,
} from '@/pages/serviceAPI/ProductCategoriesAPI';

interface CategoryFormData {
    name: string;
    description: string;
    active: boolean;
    parent_id: number | null;
    image: File | null;
}

const ProductCategoriesPage = () => {
    const { shopId } = useAuth();
    const { useGetProductCategories, useCreateProductCategory, useUpdateProductCategory, useDeleteProductCategory } = useProductCategoriesApi();
    const { data: categories = [], isLoading: loading } = useGetProductCategories();

    const createMutation = useCreateProductCategory();
    const updateMutation = useUpdateProductCategory();
    const deleteMutation = useDeleteProductCategory();

    // Reset UI state when branch changes
    useEffect(() => {
        setFormDialogOpen(false);
        setDeleteDialogOpen(false);
    }, [shopId]);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
        description: '',
        active: true,
        parent_id: null,
        image: null,
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);


    const handleEdit = (category: ProductCategory) => {
        setIsEditMode(true);
        setSelectedCategoryId(category.id);
        setFormData({
            name: category.name,
            description: category.description || '',
            active: Boolean(category.active),
            parent_id: category.parent_id || null,
            image: null,
        });
        if (category.image_url) {
            setImagePreview(category.image_url);
        }
        setFormDialogOpen(true);
    };

    const handleDeleteClick = (category: ProductCategory) => {
        setSelectedCategoryId(category.id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedCategoryId) {
            try {
                await deleteMutation.mutateAsync(selectedCategoryId);
                toast.success('Category deleted successfully');
            } catch (error) {
                toast.error('Failed to delete category', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        setDeleteDialogOpen(false);
        setSelectedCategoryId(null);
    };

    const handleAddNew = () => {
        setIsEditMode(false);
        setSelectedCategoryId(null);
        setFormData({
            name: '',
            description: '',
            active: true,
            parent_id: null,
            image: null,
        });
        setImagePreview(null);
        setFormErrors({});
        setFormDialogOpen(true);
    };

    // Handle adding subcategory with pre-filled parent_id
    const handleAddSubcategory = (parentCategory: ProductCategory) => {
        console.log('➕ Adding subcategory for parent:', parentCategory.name, 'ID:', parentCategory.id);
        setIsEditMode(false);
        setSelectedCategoryId(null);
        setFormData({
            name: '',
            description: '',
            active: true,
            parent_id: parentCategory.id,
            image: null,
        });
        setImagePreview(null);
        setFormErrors({});
        setFormDialogOpen(true);
    };

    // Get parent categories based on the hierarchical level
    // If adding subcategory to a parent (top-level), show only parents
    // If adding subcategory to a subcategory, show only siblings (same parent_id)
    const getParentCategoriesForLevel = (): ProductCategory[] => {
        // If no parent_id is set in form, show all top-level categories
        if (formData.parent_id === null) {
            console.log('🔍 Showing top-level categories (no parent selected)');
            return categories
                .filter(cat => !cat.parent_id)
                .filter(cat => !isEditMode || cat.id !== selectedCategoryId);
        }

        // Find the parent category that was selected
        const findCategory = (cats: ProductCategory[], id: number): ProductCategory | null => {
            for (const cat of cats) {
                if (cat.id === id) return cat;
                if (cat.children) {
                    const found = findCategory(cat.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        const selectedParent = findCategory(categories, formData.parent_id);

        if (!selectedParent) {
            console.log('⚠️ Selected parent not found, showing top-level categories');
            return categories
                .filter(cat => !cat.parent_id)
                .filter(cat => !isEditMode || cat.id !== selectedCategoryId);
        }

        console.log('🔍 Selected parent:', selectedParent.name, 'Parent ID:', selectedParent.parent_id);

        // If the selected parent is a top-level category (no parent_id)
        // Show only top-level categories
        if (!selectedParent.parent_id) {
            console.log('📋 Showing only parent categories (top-level)');
            const parentCats = categories
                .filter(cat => !cat.parent_id)
                .filter(cat => !isEditMode || cat.id !== selectedCategoryId);
            console.log('   Available parents:', parentCats.map(c => c.name).join(', '));
            return parentCats;
        }

        // If the selected parent has a parent (it's a subcategory or deeper)
        // Show only siblings (categories with the same parent_id)
        const getAllCategories = (cats: ProductCategory[]): ProductCategory[] => {
            let allCats: ProductCategory[] = [];
            cats.forEach(cat => {
                allCats.push(cat);
                if (cat.children) {
                    allCats = allCats.concat(getAllCategories(cat.children));
                }
            });
            return allCats;
        };

        const allCategories = getAllCategories(categories);
        const siblings = allCategories
            .filter(cat => cat.parent_id === selectedParent.parent_id)
            .filter(cat => !isEditMode || cat.id !== selectedCategoryId);

        console.log('📋 Showing only siblings of:', selectedParent.name);
        console.log('   Same parent_id:', selectedParent.parent_id);
        console.log('   Available siblings:', siblings.map(c => c.name).join(', '));

        return siblings;
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setFormErrors({ ...formErrors, image: 'Please select a valid image file' });
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setFormErrors({ ...formErrors, image: 'Image size should not exceed 5MB' });
                return;
            }

            setFormData({ ...formData, image: file });
            setFormErrors({ ...formErrors, image: '' });

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setFormData({ ...formData, image: null });
        setImagePreview(null);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = 'Category name is required';
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
            const payload: CreateCategoryPayload = {
                name: formData.name,
                description: formData.description,
                active: formData.active ? 1 : 0,
                parent_id: formData.parent_id,
                image: formData.image,
            };

            console.log('💾 Submitting category:', {
                mode: isEditMode ? 'UPDATE' : 'CREATE',
                payload: {
                    ...payload,
                    image: payload.image ? payload.image.name : 'none'
                }
            });

            if (isEditMode && selectedCategoryId) {
                await updateMutation.mutateAsync({ id: selectedCategoryId, payload });
                toast.success('Category updated successfully');
            } else {
                await createMutation.mutateAsync(payload);
                toast.success('Category created successfully');
            }

            setFormDialogOpen(false);
        } catch (error) {
            console.error('❌ Error submitting category:', error);
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} category`, {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Render subcategory with children (compact for grid)
    const renderSubcategory = (category: ProductCategory, level: number = 0) => {
        const indentClass = level === 0 ? '' : 'ml-3';

        if (!category.children || category.children.length === 0) {
            return (
                <div key={category.id} className={`${indentClass}`}>
                    <div className="flex items-center gap-2 p-2 rounded border bg-white hover:bg-gray-50">
                        <div className="flex-shrink-0 w-8 h-8 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                            {category.image_url ? (
                                <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-medium text-xs truncate">{category.name}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0 rounded-full ${category.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {category.active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleAddSubcategory(category)}
                                title="Add Subcategory"
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleEdit(category)}
                            >
                                <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteClick(category)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div key={category.id} className={indentClass}>
                <Accordion type="single" collapsible className="border rounded">
                    <AccordionItem value={`sub-${category.id}`} className="border-0">
                        <AccordionTrigger className="px-2 py-1.5 hover:no-underline hover:bg-gray-50">
                            <div className="flex items-center gap-2 flex-1">
                                <div className="flex-shrink-0 w-8 h-8 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {category.image_url ? (
                                        <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-medium text-xs">{category.name}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0 rounded-full ${category.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {category.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5 mr-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => handleAddSubcategory(category)}
                                        title="Add Subcategory"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => handleEdit(category)}
                                    >
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDeleteClick(category)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-2 pb-1.5 pt-0.5">
                            <div className="space-y-1.5">
                                {category.children.map(child => renderSubcategory(child, level + 1))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        );
    };

    return (
        <div className="p-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Category Management</h1>
                    <p className="text-xs sm:text-sm mt-0.5 text-blue-600">Manage your product categories hierarchy</p>
                </div>
                <Button size="sm" onClick={handleAddNew} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Add Category
                </Button>
            </div>

            {/* Categories Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-gray-500">Loading categories...</div>
                </div>
            ) : categories.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No categories found. Create your first category to get started.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categories
                        .filter(cat => !cat.parent_id)
                        .map(category => (
                            <Card key={category.id} className="overflow-hidden">
                                <CardContent className="p-3">
                                    {/* Parent Category Header */}
                                    <div className="flex items-start gap-2.5 mb-2">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                            {category.image_url ? (
                                                <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm mb-0.5 truncate">{category.name}</h3>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${category.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {category.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>

                                    {category.description && (
                                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{category.description}</p>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={() => handleAddSubcategory(category)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Sub
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => handleEdit(category)}
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDeleteClick(category)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    {/* Subcategories */}
                                    {category.children && category.children.length > 0 && (
                                        <div className="border-t pt-2">
                                            <p className="text-[11px] font-medium text-gray-500 mb-1.5">
                                                Subcategories ({category.children.length})
                                            </p>
                                            <div className="space-y-1.5">
                                                {category.children.map(child => renderSubcategory(child, 0))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                </div>
            )}

            {/* Create/Edit Form Dialog */}
            <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="pb-2">
                        <DialogTitle className="text-sm font-bold">
                            {isEditMode ? 'Edit Category' : 'Create New Category'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            {isEditMode ? 'Update category information' : 'Add a new product category'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        {/* Name & Parent — side by side */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="name" className="text-xs font-medium">
                                    Category Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Electronics"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`h-9 ${formErrors.name ? 'border-red-500' : ''}`}
                                />
                                {formErrors.name && (
                                    <p className="text-xs text-red-500">{formErrors.name}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="parent_id" className="text-xs font-medium">
                                    Parent Category
                                </Label>
                                <Select
                                    value={formData.parent_id?.toString() || 'none'}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, parent_id: value === 'none' ? null : parseInt(value) })
                                    }
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="None (Main)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Main Category)</SelectItem>
                                        {getParentCategoriesForLevel().map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <Label htmlFor="description" className="text-xs font-medium">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Brief description of the category"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="resize-none"
                            />
                        </div>

                        {/* Image Upload & Active Status — side by side */}
                        <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="image" className="text-xs font-medium">
                                    Category Image
                                </Label>
                                {imagePreview ? (
                                    <div className="relative inline-block">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-20 h-20 object-cover rounded border"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full"
                                            onClick={removeImage}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8"
                                            onClick={() => document.getElementById('image')?.click()}
                                        >
                                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                                            Upload
                                        </Button>
                                        <Input
                                            id="image"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                )}
                                {formErrors.image && (
                                    <p className="text-xs text-red-500">{formErrors.image}</p>
                                )}
                                <p className="text-[11px] text-gray-400">Max 5MB · JPG, PNG, GIF</p>
                            </div>
                            <div className="flex items-center gap-2 pt-5">
                                <Switch
                                    id="active"
                                    checked={formData.active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                />
                                <Label htmlFor="active" className="text-xs font-medium cursor-pointer">
                                    Active
                                </Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button variant="outline" size="sm" onClick={() => setFormDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
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
                            This action cannot be undone. This will permanently delete the category
                            {selectedCategoryId && ` and all its subcategories`}.
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

export default ProductCategoriesPage;
