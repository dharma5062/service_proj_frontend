import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Upload, X, Check } from 'lucide-react';
import {
    createProduct,
    CreateProductPayload,
} from '@/pages/serviceAPI/ProductsAPI';
import { fetchProductCategories, ProductCategory } from '@/pages/serviceAPI/ProductCategoriesAPI';
import { fetchBrands, Brand } from '@/pages/serviceAPI/BrandsAPI';

interface ProductFormData {
    name: string;
    description: string;
    price: string;
    brand_id: number | null;
    category_id: number | null;
    image: File | null;
    active: boolean;
}

const CreateProductPage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Dynamic category selection - supports unlimited depth
    // Array where each index represents a level: [parentId, childId, subChildId, ...]
    const [selectedCategoryPath, setSelectedCategoryPath] = useState<number[]>([]);

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        price: '',
        brand_id: null,
        category_id: null,
        image: null,
        active: true,
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setInitialLoading(true);
        try {
            await Promise.all([
                loadCategories(),
                loadBrands()
            ]);
        } catch (error) {
            toast.error('Failed to load initial data');
        } finally {
            setInitialLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const data = await fetchProductCategories();
            setCategories(data);
        } catch (error) {
            toast.error('Failed to load categories');
        }
    };

    const loadBrands = async () => {
        try {
            const data = await fetchBrands();
            setBrands(data);
        } catch (error) {
            toast.error('Failed to load brands');
        }
    };

    // Get categories at a specific level
    const getCategoriesAtLevel = (level: number): ProductCategory[] => {
        if (level === 0) {
            // Root level - categories with no parent
            return categories.filter(cat => !cat.parent_id);
        }

        // Navigate to the parent at the previous level
        let current: ProductCategory[] = categories.filter(cat => !cat.parent_id);

        for (let i = 0; i < level; i++) {
            const selectedId = selectedCategoryPath[i];
            if (!selectedId) return [];

            const selected = current.find(cat => cat.id === selectedId);
            if (!selected || !selected.children) return [];

            current = selected.children;
        }

        return current;
    };

    // Handle category selection at any level
    const handleCategoryChange = (level: number, value: string) => {
        const categoryId = parseInt(value);

        // Update the path: keep selections up to this level, discard deeper selections
        const newPath = selectedCategoryPath.slice(0, level);
        newPath[level] = categoryId;

        setSelectedCategoryPath(newPath);

        // Update form data with the selected category ID (always use the deepest selection)
        setFormData({ ...formData, category_id: categoryId });
    };

    // Get the display path (e.g., "Electronics → Mobile → Display")
    const getCategoryDisplayPath = (): string => {
        const parts: string[] = [];
        let current: ProductCategory[] = categories.filter(cat => !cat.parent_id);

        for (let i = 0; i < selectedCategoryPath.length; i++) {
            const selectedId = selectedCategoryPath[i];
            const selected = current.find(cat => cat.id === selectedId);

            if (selected) {
                parts.push(selected.name);
                current = selected.children || [];
            }
        }

        return parts.join(' → ');
    };

    // Get the maximum depth needed (how many dropdowns to render)
    const getMaxDepth = (): number => {
        // Always show at least one more level if the current selection has children
        let depth = selectedCategoryPath.length + 1;

        // Check if the last selected category has children
        if (selectedCategoryPath.length > 0) {
            const categoriesAtLastLevel = getCategoriesAtLevel(selectedCategoryPath.length);
            if (categoriesAtLastLevel.length === 0) {
                depth = selectedCategoryPath.length;
            }
        }

        return depth;
    };

    // Get label for each level
    const getLevelLabel = (level: number): string => {
        const labels = [
            'Parent Category',
            'Category',
            'Sub-Category',
            'sub-child 4',
            'child 5',
            'child 6',
            'child 7',
            'child 8',
        ];
        return labels[level] || `Level ${level + 1}`;
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should not exceed 5MB');
                return;
            }

            setFormData({ ...formData, image: file });

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
            errors.name = 'Product name is required';
        }

        if (!formData.price || parseFloat(formData.price) <= 0) {
            errors.price = 'Valid price is required';
        }

        if (!formData.category_id) {
            errors.category_id = 'Please select a category';
        }

        if (!formData.brand_id) {
            errors.brand_id = 'Please select a brand';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const payload: CreateProductPayload = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                active: 1,
                category_id: formData.category_id,
                brand_id: formData.brand_id,
                image: formData.image,
            };

            await createProduct(payload);
            toast.success('Product created successfully');
            navigate('/dashboard/settings/product');
        } catch (error) {
            toast.error('Failed to create product', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
                    <p className="text-sm text-gray-500 mt-1">Add a new item to your e-commerce catalog</p>
                </div>

                {/* Loading State */}
                {initialLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column Skeleton */}
                        <div className="space-y-6">
                            {/* Basic Information Skeleton */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <Skeleton className="h-5 w-40" />
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Product Name Skeleton */}
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    {/* Price Skeleton */}
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    {/* Description Skeleton */}
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-32 w-full" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column Skeleton */}
                        <div className="space-y-6">
                            {/* Category Skeleton */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <Skeleton className="h-5 w-36" />
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Brand Skeleton */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <Skeleton className="h-5 w-16" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                            </Card>

                            {/* Image Skeleton */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <Skeleton className="h-5 w-32" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-48 w-full rounded-lg" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <Card>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base font-semibold">Basic Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Product Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium">
                                                Product Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                placeholder="e.g., Ultra HD Smart Display 2024"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className={formErrors.name ? 'border-red-500' : ''}
                                            />
                                            {formErrors.name && (
                                                <p className="text-xs text-red-500">{formErrors.name}</p>
                                            )}
                                        </div>

                                        {/* Price */}
                                        <div className="space-y-2">
                                            <Label htmlFor="price" className="text-sm font-medium">
                                                Price <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                    className={`pl-7 ${formErrors.price ? 'border-red-500' : ''}`}
                                                />
                                            </div>
                                            {formErrors.price && (
                                                <p className="text-xs text-red-500">{formErrors.price}</p>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="text-sm font-medium">
                                                Description
                                            </Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Describe your product features and specifications..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={5}
                                                className="resize-none"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                {/* Product Category */}
                                <Card>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base font-semibold">Product Category</CardTitle>
                                        {getCategoryDisplayPath() && (
                                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                                <Check className="w-3 h-3" />
                                                Selected: {getCategoryDisplayPath()}
                                            </p>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        {/* Dynamic Category Dropdowns in Grid - renders as many levels as needed */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Array.from({ length: getMaxDepth() }).map((_, level) => {
                                                const categoriesAtLevel = getCategoriesAtLevel(level);

                                                // Don't render if there are no categories at this level
                                                if (categoriesAtLevel.length === 0) return null;

                                                const isRequired = level === 0; // Only first level is required
                                                const currentSelection = selectedCategoryPath[level];

                                                return (
                                                    <div key={level} className="space-y-2">
                                                        <Label htmlFor={`category-level-${level}`} className="text-sm font-medium">
                                                            {getLevelLabel(level)} {isRequired && <span className="text-red-500">*</span>}
                                                        </Label>
                                                        <Select
                                                            value={currentSelection?.toString() || ''}
                                                            onValueChange={(value) => handleCategoryChange(level, value)}
                                                        >
                                                            <SelectTrigger className={isRequired && formErrors.category_id ? 'border-red-500' : ''}>
                                                                <SelectValue placeholder={`Select ${getLevelLabel(level).toLowerCase()}`} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {categoriesAtLevel.map((cat: ProductCategory) => (
                                                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                                                        {cat.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {formErrors.category_id && (
                                            <p className="text-xs text-red-500 mt-3">{formErrors.category_id}</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Brand Selection */}
                                <Card>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base font-semibold">Brand</CardTitle>
                                    </CardHeader>
                                    <CardContent>
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
                                            <p className="text-xs text-red-500 mt-2">{formErrors.brand_id}</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Product Image */}
                                <Card>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base font-semibold">Product Image</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {!imagePreview ? (
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                                                <input
                                                    type="file"
                                                    id="image-upload"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor="image-upload"
                                                    className="cursor-pointer flex flex-col items-center"
                                                >
                                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                                        <Upload className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900 mb-1">
                                                        Click to upload photo
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Support JPG, PNG, WEBP (Max 5MB)
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Recommended size: 1000×1000px
                                                    </p>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="relative group">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Product preview"
                                                        className="w-full h-64 object-cover rounded-lg border border-gray-200"
                                                    />
                                                    <button
                                                        onClick={removeImage}
                                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="file"
                                                        id="image-replace"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                        className="hidden"
                                                    />
                                                    <label
                                                        htmlFor="image-replace"
                                                        className="flex-1 cursor-pointer"
                                                    >
                                                        <Button variant="outline" className="w-full" type="button">
                                                            Replace Image
                                                        </Button>
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Action Buttons - Bottom */}
                        <div className="flex justify-end gap-3 mt-6 pb-6">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/dashboard/settings/product')}
                                disabled={submitting}
                                className="min-w-[120px]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                            >
                                {submitting ? 'Creating...' : 'Create Product'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CreateProductPage;
