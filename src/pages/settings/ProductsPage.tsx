import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Product,
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    CreateProductPayload,
} from '@/pages/serviceAPI/ProductsAPI';
import { fetchProductCategories, ProductCategory } from '@/pages/serviceAPI/ProductCategoriesAPI';
import { fetchBrands, Brand } from '@/pages/serviceAPI/BrandsAPI';

interface ProductFormData {
    name: string;
    description: string;
    price: number | null;
    active: boolean;
    category_id: number | null;
    brand_id: number | null;
    image: File | null;
}

const ProductsPage = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        price: null,
        active: true,
        category_id: null,
        brand_id: null,
        image: null,
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    /**
     * Build category hierarchy path (parent → child → subchild)
     * @param category - ProductCategory object with parent relationships
     * @returns String representation of the category hierarchy
     */
    const buildCategoryHierarchy = (category: ProductCategory): string => {
        const parts: string[] = [];

        // Recursively build hierarchy from root to current
        const buildPath = (cat: ProductCategory): void => {
            if (cat.parent) {
                buildPath(cat.parent);
            }
            parts.push(cat.name);
        };

        buildPath(category);
        return parts.join(' → ');
    };

    /**
     * Flatten category tree to include all categories (parent, child, subchild)
     * @param categories - Array of ProductCategory objects
     * @returns Flattened array of all categories
     */
    const flattenCategories = (categories: ProductCategory[]): ProductCategory[] => {
        const result: ProductCategory[] = [];

        const flatten = (cat: ProductCategory) => {
            result.push(cat);
            if (cat.children && cat.children.length > 0) {
                cat.children.forEach(child => flatten(child));
            }
        };

        categories.forEach(cat => flatten(cat));
        return result;
    };

    // Fetch products, categories, and brands on mount
    useEffect(() => {
        loadProducts();
        loadProductCategories();
        loadBrands();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await fetchProducts();
            setProducts(data);
        } catch (error) {
            toast.error('Failed to load products', {
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

    const loadBrands = async () => {
        try {
            const data = await fetchBrands();
            setBrands(data);
        } catch (error) {
            toast.error('Failed to load brands', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const columns: Column<Product>[] = [
        {
            key: 'image',
            title: 'Image',
            dataIndex: 'image_url',
            render: (value) => (
                value ? (
                    <img
                        src={value}
                        alt="Product"
                        className="w-12 h-12 object-cover rounded-md border border-gray-200"
                    />
                ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200">
                        <span className="text-xs text-gray-400">No image</span>
                    </div>
                )
            ),
        },
        {
            key: 'name',
            title: 'Name',
            dataIndex: 'name',
            sortable: true,
            filterable: true,
            render: (value) => <span className="font-medium text-gray-900">{value}</span>,
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
            key: 'price',
            title: 'Price',
            dataIndex: 'price',
            sortable: true,
            filterable: true,
            render: (value) => (
                <span className="text-sm font-medium text-gray-900">
                    {value ? `$${Number(value).toFixed(2)}` : '-'}
                </span>
            ),
        },
        {
            key: 'category',
            title: 'Category',
            dataIndex: 'category',
            sortable: true,
            filterable: true,
            render: (value) => {
                if (!value) return <span className="text-sm text-gray-600">-</span>;

                // Build hierarchy path if parent exists
                const hierarchy: string[] = [];
                if (value.parent) {
                    // Check if there's a grandparent
                    if (value.parent.parent) {
                        hierarchy.push(value.parent.parent.name);
                    }
                    hierarchy.push(value.parent.name);
                }
                hierarchy.push(value.name);

                return (
                    <span className="text-sm text-gray-600">
                        {hierarchy.join(' → ')}
                    </span>
                );
            },
        },
        {
            key: 'brand',
            title: 'Brand',
            dataIndex: 'brand',
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

    const handleView = async (record: Product) => {
        try {
            const product = await fetchProductById(record.id);
            setSelectedProduct(product);
            setViewDialogOpen(true);
        } catch (error) {
            toast.error('Failed to load product details');
        }
    };

    const handleEdit = (record: Product) => {
        setIsEditMode(true);
        setSelectedProductId(record.id);
        setFormData({
            name: record.name,
            description: record.description || '',
            price: record.price || null,
            active: Boolean(record.active),
            category_id: record.category_id || null,
            brand_id: record.brand_id || null,
            image: null,
        });
        // Set image preview if exists
        if (record.image_url) {
            setImagePreview(record.image_url);
        }
        setFormDialogOpen(true);
    };

    const handleDeleteClick = (record: Product) => {
        setSelectedProductId(record.id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedProductId) {
            try {
                await deleteProduct(selectedProductId);
                toast.success('Product deleted successfully');
                loadProducts();
            } catch (error) {
                toast.error('Failed to delete product', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        setDeleteDialogOpen(false);
        setSelectedProductId(null);
    };

    const handleAddNew = () => {
        navigate('/dashboard/settings/product/create');
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should not exceed 5MB');
                return;
            }

            setFormData({ ...formData, image: file });

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }

        if (!formData.category_id) {
            errors.category_id = 'Category is required';
        }

        if (!formData.brand_id) {
            errors.brand_id = 'Brand is required';
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
            const payload: CreateProductPayload = {
                name: formData.name,
                description: formData.description,
                price: formData.price || undefined,
                active: formData.active ? 1 : 0,
                category_id: formData.category_id,
                brand_id: formData.brand_id,
                image: formData.image,
            };

            if (isEditMode && selectedProductId) {
                await updateProduct(selectedProductId, payload);
                toast.success('Product updated successfully');
            } else {
                await createProduct(payload);
                toast.success('Product created successfully');
            }

            setFormDialogOpen(false);
            loadProducts();
        } catch (error) {
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} product`, {
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
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Products</h1>
                    <p className="text-xs sm:text-sm mt-0.5 text-blue-600">Manage your product catalog.</p>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={products}
                title="Product List"
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
                    total: products.length,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
                hoverable
                bordered
                loading={loading}
            />

            {/* View Product Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Product Details</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            View product information
                        </DialogDescription>
                    </DialogHeader>

                    {selectedProduct && (
                        <div className="space-y-3">
                            {/* Product Image */}
                            {selectedProduct.image_url && (
                                <Card>
                                    <CardHeader className="pb-2 pt-3 px-3">
                                        <CardTitle className="text-xs font-bold">Product Image</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-3 pb-3">
                                        <img
                                            src={selectedProduct.image_url}
                                            alt={selectedProduct.name}
                                            className="w-full max-h-64 object-contain rounded-md border border-gray-200"
                                        />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Basic Info */}
                            <Card>
                                <CardHeader className="pb-2 pt-3 px-3">
                                    <CardTitle className="text-xs font-bold">Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 pb-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Name</p>
                                            <p className="text-sm font-medium">{selectedProduct.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Status</p>
                                            <Badge className={selectedProduct.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                                {selectedProduct.active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        {selectedProduct.price && (
                                            <div>
                                                <p className="text-xs text-gray-500">Price</p>
                                                <p className="text-sm font-medium">${Number(selectedProduct.price).toFixed(2)}</p>
                                            </div>
                                        )}
                                        {selectedProduct.category && (() => {
                                            const hierarchy: string[] = [];
                                            if (selectedProduct.category.parent) {
                                                if (selectedProduct.category.parent.parent) {
                                                    hierarchy.push(selectedProduct.category.parent.parent.name);
                                                }
                                                hierarchy.push(selectedProduct.category.parent.name);
                                            }
                                            hierarchy.push(selectedProduct.category.name);

                                            return (
                                                <div>
                                                    <p className="text-xs text-gray-500">Category</p>
                                                    <p className="text-sm font-medium">{hierarchy.join(' → ')}</p>
                                                </div>
                                            );
                                        })()}
                                        {selectedProduct.brand && (
                                            <div>
                                                <p className="text-xs text-gray-500">Brand</p>
                                                <p className="text-sm font-medium">{selectedProduct.brand.name}</p>
                                            </div>
                                        )}
                                        {selectedProduct.description && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-500">Description</p>
                                                <p className="text-sm text-gray-700">{selectedProduct.description}</p>
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
                            {isEditMode ? 'Edit Product' : 'Create New Product'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            {isEditMode ? 'Update product information' : 'Add a new product'}
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
                                placeholder="e.g., iPhone 15 Pro, Samsung Galaxy S24"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={formErrors.name ? 'border-red-500' : ''}
                            />
                            {formErrors.name && (
                                <p className="text-xs text-red-500">{formErrors.name}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Brief description of the product"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        {/* Price */}
                        <div className="space-y-2">
                            <Label htmlFor="price" className="text-sm font-medium">
                                Price
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="e.g., 999.99"
                                value={formData.price || ''}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : null })}
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category_id" className="text-sm font-medium">
                                Category <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.category_id?.toString() || ''}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, category_id: parseInt(value) })
                                }
                            >
                                <SelectTrigger className={formErrors.category_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {flattenCategories(productCategories).map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {buildCategoryHierarchy(cat)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formErrors.category_id && (
                                <p className="text-xs text-red-500">{formErrors.category_id}</p>
                            )}
                        </div>

                        {/* Brand */}
                        <div className="space-y-2">
                            <Label htmlFor="brand_id" className="text-sm font-medium">
                                Brand <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.brand_id?.toString() || ''}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, brand_id: parseInt(value) })
                                }
                            >
                                <SelectTrigger className={formErrors.brand_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select brand" />
                                </SelectTrigger>
                                <SelectContent>
                                    {brands.map((brand) => (
                                        <SelectItem key={brand.id} value={brand.id.toString()}>
                                            {brand.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formErrors.brand_id && (
                                <p className="text-xs text-red-500">{formErrors.brand_id}</p>
                            )}
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="image" className="text-sm font-medium">
                                Product Image
                            </Label>
                            <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                            <p className="text-xs text-gray-500">Max size: 5MB. Supported formats: JPG, PNG, GIF</p>

                            {/* Image Preview */}
                            {imagePreview && (
                                <div className="mt-2">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-32 h-32 object-cover rounded-md border border-gray-200"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="active" className="text-sm font-medium">
                                    Active Status
                                </Label>
                                <p className="text-xs text-gray-500">Enable this product for sale</p>
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
                            {submitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
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
                            This action cannot be undone. This will permanently delete the product.
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

export default ProductsPage;
