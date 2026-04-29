import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Upload, X, Check, IndianRupee, ArrowLeft } from 'lucide-react';
import {
    CreateProductPayload,
    useProductsApi,
} from '@/pages/serviceAPI/ProductsAPI';
import { ProductCategory, useProductCategoriesApi } from '@/pages/serviceAPI/ProductCategoriesAPI';
import { useBrandsApi } from '@/pages/serviceAPI/BrandsAPI';

interface ProductFormData {
    name: string;
    description: string;
    cost_price: string;
    price: string;
    tax_name: string;
    tax_percentage: string;
    tax_type: 'inclusive' | 'exclusive';
    brand_id: number | null;
    category_id: number | null;
    image: File | null;
    active: boolean;
}

const CreateProductPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const productId = id ? Number(id) : undefined;

    // TanStack Query hooks
    const { useGetProductById, useCreateProduct, useUpdateProduct } = useProductsApi();
    const { useGetProductCategories } = useProductCategoriesApi();
    const { useGetBrands } = useBrandsApi();

    const { data: categories = [], isLoading: categoriesLoading } = useGetProductCategories();
    const { data: brands = [], isLoading: brandsLoading } = useGetBrands();
    const { data: existingProduct, isLoading: productLoading } = useGetProductById(productId);
    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();

    const initialLoading = categoriesLoading || brandsLoading || (isEditMode && productLoading);

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Dynamic category selection - supports unlimited depth
    const [selectedCategoryPath, setSelectedCategoryPath] = useState<number[]>([]);

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        cost_price: '',
        price: '',
        tax_name: '',
        tax_percentage: '',
        tax_type: 'exclusive',
        brand_id: null,
        category_id: null,
        image: null,
        active: true,
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [removeImageFlag, setRemoveImageFlag] = useState(false);

    // When existing product data arrives (edit mode), populate form
    useEffect(() => {
        if (!existingProduct || !isEditMode) return;

        const desc = existingProduct.description;
        let descText = '';
        let costPrice = '';

        // Deeply parse a value that may be multi-level stringified JSON
        const deepParse = (value: any): any => {
            let parsed = value;
            while (typeof parsed === 'string') {
                try {
                    const next = JSON.parse(parsed);
                    if (next === parsed) break;
                    parsed = next;
                } catch {
                    break;
                }
            }
            return parsed;
        };

        let parsedDesc: any = deepParse(desc);

        if (parsedDesc && typeof parsedDesc === 'object') {
            // The text field itself may be a JSON string: '{"text":"actual text","cost_price":8000}'
            if (parsedDesc.text !== undefined) {
                const innerText = deepParse(parsedDesc.text);
                if (typeof innerText === 'object' && innerText !== null) {
                    // Extract actual description text from inner object
                    descText = innerText.text !== undefined ? innerText.text : '';
                    // Extract cost_price from inner object
                    if (innerText.cost_price !== undefined) {
                        costPrice = innerText.cost_price.toString();
                    }
                } else {
                    // text field is a plain string
                    descText = typeof innerText === 'string' ? innerText : (parsedDesc.text || '');
                }
            }
            // Also check cost_price at the top level (fallback)
            if (!costPrice && parsedDesc.cost_price !== undefined) {
                costPrice = parsedDesc.cost_price.toString();
            }
        } else if (typeof desc === 'string') {
            descText = desc;
        }

        let tax_name = existingProduct.tax_name || '';
        let tax_percentage = '';
        let tax_type = (existingProduct.tax_type as 'inclusive' | 'exclusive') || 'exclusive';

        if (existingProduct.tax_percentage !== undefined && existingProduct.tax_percentage !== null) {
            tax_percentage = parseFloat(existingProduct.tax_percentage.toString()).toString();
        }

        if (!tax_percentage && parsedDesc && typeof parsedDesc === 'object') {
            if (parsedDesc.taxes?.length > 0) {
                const firstTax = parsedDesc.taxes[0];
                tax_name = tax_name || firstTax.tax_name || '';
                if (firstTax.tax_percentage !== undefined) tax_percentage = parseFloat(firstTax.tax_percentage.toString()).toString();
                tax_type = (firstTax.tax_type as 'inclusive' | 'exclusive') || tax_type;
            }
        }

        setFormData({
            name: existingProduct.name,
            description: descText,
            cost_price: costPrice,
            price: (existingProduct.price !== undefined && existingProduct.price !== null) ? existingProduct.price.toString() : '',
            tax_name,
            tax_percentage,
            tax_type,
            brand_id: existingProduct.brand_id || null,
            category_id: existingProduct.category_id || null,
            image: null,
            active: Boolean(existingProduct.active),
        });

        if (existingProduct.image_url) setImagePreview(existingProduct.image_url);

        if (existingProduct.category_id && categories.length > 0) {
            const path = findCategoryPath(categories, existingProduct.category_id);
            setSelectedCategoryPath(path || [existingProduct.category_id]);
        } else if (existingProduct.category_id) {
            setSelectedCategoryPath([existingProduct.category_id]);
        }
    }, [existingProduct, categories, isEditMode]);

    const findCategoryPath = (cats: typeof categories, targetId: number, currentPath: number[] = []): number[] | null => {
        for (const cat of cats) {
            const path = [...currentPath, cat.id];
            if (cat.id === targetId) return path;
            if (cat.children && cat.children.length > 0) {
                const result = findCategoryPath(cat.children, targetId, path);
                if (result) return result;
            }
        }
        return null;
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
            setRemoveImageFlag(false); // New image added, don't remove existing

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
        setRemoveImageFlag(true); // Explicitly marked for removal
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = 'Product name is required';
        }

        if (formData.cost_price && parseFloat(formData.cost_price) < 0) {
            errors.cost_price = 'Cost price cannot be negative';
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

    // Format price in Indian numbering system
    const formatIndianPrice = (value: string): string => {
        const num = parseFloat(value);
        if (isNaN(num)) return '';
        return num.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const descriptionObj: any = {
                text: formData.description,
                cost_price: formData.cost_price ? parseFloat(formData.cost_price) : 0,
                tax_name: formData.tax_name || undefined,
                tax_percentage: formData.tax_percentage ? parseFloat(formData.tax_percentage) : undefined,
                tax_type: formData.tax_type,
            };

            const payload: CreateProductPayload = {
                name: formData.name,
                description: JSON.stringify(descriptionObj),
                price: parseFloat(formData.price),
                tax_name: formData.tax_name || undefined,
                tax_percentage: formData.tax_percentage ? parseFloat(formData.tax_percentage) : undefined,
                tax_type: formData.tax_type,
                active: formData.active ? 1 : 0,
                category_id: formData.category_id,
                brand_id: formData.brand_id,
                image: formData.image,
                remove_image: removeImageFlag ? 1 : 0,
            };

            if (isEditMode && productId) {
                await updateProductMutation.mutateAsync({ id: productId, payload });
                toast.success('Product updated successfully');
            } else {
                await createProductMutation.mutateAsync(payload);
                toast.success('Product created successfully');
            }
            navigate('/dashboard/settings/product');
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
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={() => navigate('/dashboard/settings/product')}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                        {isEditMode ? 'Edit Product' : 'Create New Product'}
                    </h1>
                    <p className="text-xs sm:text-sm mt-0.5 text-blue-600 font-medium">
                        {isEditMode ? 'Update existing product information' : 'Add a new product to your inventory'}
                    </p>
                </div>
            </div>
            {/* Loading State */}
            {initialLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <Skeleton className="h-4 w-36" />
                            </CardHeader>
                            <CardContent className="px-3 pb-3 space-y-3">
                                <div className="space-y-1.5">
                                    <Skeleton className="h-3.5 w-24" />
                                    <Skeleton className="h-9 w-full" />
                                </div>
                                <div className="space-y-1.5">
                                    <Skeleton className="h-3.5 w-20" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <Skeleton className="h-4 w-28" />
                            </CardHeader>
                            <CardContent className="px-3 pb-3 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <Skeleton className="h-9 w-full" />
                                    <Skeleton className="h-9 w-full" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Skeleton className="h-9 w-full" />
                                    <Skeleton className="h-9 w-full" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <Skeleton className="h-4 w-32" />
                            </CardHeader>
                            <CardContent className="px-3 pb-3 space-y-3">
                                <Skeleton className="h-9 w-full" />
                                <Skeleton className="h-9 w-full" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <Skeleton className="h-4 w-16" />
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                <Skeleton className="h-9 w-full" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <Skeleton className="h-4 w-28" />
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                <Skeleton className="h-32 w-full rounded-lg" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                /* Main Content Grid */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-4">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <CardTitle className="text-sm font-bold">Basic Information</CardTitle>
                                <p className="text-[11px] text-gray-400 mt-0.5">Enter the core details that identify your product</p>
                            </CardHeader>
                            <CardContent className="px-3 pb-3 space-y-3">
                                {/* Product Name */}
                                <div className="space-y-1">
                                    <Label htmlFor="name" className="text-xs font-medium">
                                        Product Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Ultra HD Smart Display 2024"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`h-9 ${formErrors.name ? 'border-red-500' : ''}`}
                                    />
                                    {formErrors.name && (
                                        <p className="text-xs text-red-500">{formErrors.name}</p>
                                    )}
                                    {!formErrors.name && (
                                        <p className="text-[11px] text-gray-400">Enter a clear, descriptive name customers can easily recognize</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <Label htmlFor="description" className="text-xs font-medium">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe your product features and specifications..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="resize-none"
                                    />
                                    <p className="text-[11px] text-gray-400">Briefly describe the product's key features, specs, or service details</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pricing & Tax Card — Combined */}
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                                    <IndianRupee className="w-3.5 h-3.5 text-green-600" />
                                    Pricing & Tax
                                </CardTitle>
                                <p className="text-[11px] text-gray-400 mt-0.5">Set your purchase cost, selling price, and applicable tax rates</p>
                            </CardHeader>
                            <CardContent className="px-3 pb-3 space-y-3">
                                {/* Cost Price & Price */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="cost_price" className="text-xs font-medium">
                                            Cost Price
                                        </Label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-2.5 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-xs font-medium">
                                                ₹
                                            </span>
                                            <Input
                                                id="cost_price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={formData.cost_price}
                                                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                                                className={`h-9 rounded-l-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${formErrors.cost_price ? 'border-red-500' : ''}`}
                                            />
                                        </div>
                                        {formData.cost_price && parseFloat(formData.cost_price) > 0 && (
                                            <p className="text-xs text-green-600 font-medium">
                                                ₹{formatIndianPrice(formData.cost_price)}
                                            </p>
                                        )}
                                        {formErrors.cost_price && (
                                            <p className="text-xs text-red-500">{formErrors.cost_price}</p>
                                        )}
                                        {!formErrors.cost_price && !formData.cost_price && (
                                            <p className="text-[11px] text-gray-400">Your purchase/manufacturing cost</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="price" className="text-xs font-medium">
                                            Selling Price <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-2.5 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-xs font-medium">
                                                ₹
                                            </span>
                                            <Input
                                                id="price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className={`h-9 rounded-l-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${formErrors.price ? 'border-red-500' : ''}`}
                                            />
                                        </div>
                                        {formData.price && parseFloat(formData.price) > 0 && (
                                            <p className="text-xs text-green-600 font-medium">
                                                ₹{formatIndianPrice(formData.price)}
                                            </p>
                                        )}
                                        {formErrors.price && (
                                            <p className="text-xs text-red-500">{formErrors.price}</p>
                                        )}
                                        {!formErrors.price && !formData.price && (
                                            <p className="text-[11px] text-gray-400">Price charged to the customer (excl. tax)</p>
                                        )}
                                    </div>
                                </div>

                                {/* Tax Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="tax_type" className="text-xs font-medium">
                                            Tax Application
                                        </Label>
                                        <Select
                                            value={formData.tax_type}
                                            onValueChange={(value: 'inclusive' | 'exclusive') => setFormData({ ...formData, tax_type: value })}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent className="text-xs">
                                                <SelectItem value="exclusive">Exclusive (Added)</SelectItem>
                                                <SelectItem value="inclusive">Inclusive (Included)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="tax_percentage" className="text-xs font-medium">
                                            Tax Rate (GST)
                                        </Label>
                                        <Select
                                            value={formData.tax_percentage?.toString() || ''}
                                            onValueChange={(value) => setFormData({ ...formData, tax_percentage: value, tax_name: formData.tax_name || 'GST' })}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Select Rate" />
                                            </SelectTrigger>
                                            <SelectContent className="text-xs">
                                                <SelectItem value="0">0% - Essential goods (milk, fresh vegetables)</SelectItem>
                                                <SelectItem value="5">5% - Packaged food</SelectItem>
                                                <SelectItem value="12">12% - Processed food</SelectItem>
                                                <SelectItem value="18">18% - Electronics, services</SelectItem>
                                                <SelectItem value="28">28% - Luxury items</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="hidden">
                                    <Input
                                        id="tax_name"
                                        value={formData.tax_name}
                                        onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
                                    />
                                </div>
                                
                                {formData.price !== null && parseFloat(formData.price) > 0 && formData.tax_percentage !== '' && (() => {
                                    const price = parseFloat(formData.price);
                                    const rate = parseFloat(formData.tax_percentage);
                                    const cost = formData.cost_price ? parseFloat(formData.cost_price) : 0;
                                    let basePrice = 0;
                                    let taxAmount = 0;
                                    let total = 0;
                                    
                                    if (formData.tax_type === 'inclusive') {
                                        basePrice = price / (1 + (rate / 100));
                                        taxAmount = price - basePrice;
                                        total = price;
                                    } else {
                                        basePrice = price;
                                        taxAmount = price * (rate / 100);
                                        total = price + taxAmount;
                                    }

                                    const profit = basePrice - cost;
                                    const profitMargin = basePrice > 0 ? (profit / basePrice) * 100 : 0;

                                    return (
                                        <div className="bg-gray-50/80 p-2.5 rounded-lg mt-3 border border-gray-100 flex flex-col gap-1 text-[11px] md:text-xs">
                                            {cost > 0 && (
                                                <div className="flex justify-between items-center text-gray-600 pb-1 border-b border-gray-200/60 dashed mb-1">
                                                    <span>Cost Price</span>
                                                    <span>₹{formatIndianPrice(cost.toString())}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center text-gray-600">
                                                <span>Base Price (Excl. Tax)</span>
                                                <span>₹{formatIndianPrice(basePrice.toString())}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-600">
                                                <span>Tax ({rate}%)</span>
                                                <span>+ ₹{formatIndianPrice(taxAmount.toString())}</span>
                                            </div>
                                            <div className="pt-1.5 mt-0.5 border-t border-gray-200 border-dashed flex justify-between items-center font-bold text-gray-900 text-sm">
                                                <span>Final Price</span>
                                                <span>₹{formatIndianPrice(total.toString())}</span>
                                            </div>
                                            {cost > 0 && (
                                                <div className={`flex justify-between items-center font-medium mt-1 pt-1 border-t border-gray-200 ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    <span>Profit Estimation</span>
                                                    <span>₹{formatIndianPrice(profit.toString())} ({profitMargin.toFixed(1)}% margin)</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        {/* Product Category */}
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <CardTitle className="text-sm font-bold">Product Category</CardTitle>
                                <p className="text-[11px] text-gray-400 mt-0.5">Organize your product under the right category for easy discovery</p>
                                {getCategoryDisplayPath() && (
                                    <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        {getCategoryDisplayPath()}
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {Array.from({ length: getMaxDepth() }).map((_, level) => {
                                        const categoriesAtLevel = getCategoriesAtLevel(level);
                                        if (categoriesAtLevel.length === 0) return null;

                                        const isRequired = level === 0;
                                        const currentSelection = selectedCategoryPath[level];

                                        return (
                                            <div key={level} className="space-y-1">
                                                <Label htmlFor={`category-level-${level}`} className="text-xs font-medium">
                                                    {getLevelLabel(level)} {isRequired && <span className="text-red-500">*</span>}
                                                </Label>
                                                <Select
                                                    value={currentSelection?.toString() || ''}
                                                    onValueChange={(value) => handleCategoryChange(level, value)}
                                                >
                                                    <SelectTrigger className={`h-9 ${isRequired && formErrors.category_id ? 'border-red-500' : ''}`}>
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
                                    <p className="text-xs text-red-500 mt-2">{formErrors.category_id}</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Brand Selection */}
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <CardTitle className="text-sm font-bold">Brand</CardTitle>
                                <p className="text-[11px] text-gray-400 mt-0.5">Associate this product with its manufacturer or brand</p>
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                <Select
                                    value={formData.brand_id?.toString() || ''}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, brand_id: parseInt(value) })
                                    }
                                >
                                    <SelectTrigger className={`h-9 ${formErrors.brand_id ? 'border-red-500' : ''}`}>
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
                                    <p className="text-xs text-red-500 mt-1">{formErrors.brand_id}</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Product Image */}
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <CardTitle className="text-sm font-bold">Product Image</CardTitle>
                                <p className="text-[11px] text-gray-400 mt-0.5">Upload a clear photo to help identify this product</p>
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                <input
                                    type="file"
                                    id="image-upload"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                {!imagePreview ? (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center hover:border-blue-400 transition-colors">
                                        <label
                                            htmlFor="image-upload"
                                            className="cursor-pointer flex flex-col items-center"
                                        >
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                                                <Upload className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <p className="text-xs font-medium text-gray-900 mb-0.5">
                                                Click to upload photo
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                JPG, PNG, WEBP (Max 5MB)
                                            </p>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-48 object-contain rounded-lg border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="mt-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs font-medium"
                                                onClick={() => document.getElementById('image-upload')?.click()}
                                            >
                                                Replace Image
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-10 bg-white/90 backdrop-blur-sm border-t border-gray-200 mt-6 pt-3 pb-1 flex justify-end gap-3 -mx-2 px-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard/settings/product')}
                    disabled={submitting}
                >
                    Cancel
                </Button>
                <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {submitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Product' : 'Create Product')}
                </Button>
            </div>
        </div>
    );
};

export default CreateProductPage;
