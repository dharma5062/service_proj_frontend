import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/AuthContext';
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
    Brand,
    fetchBrandById,
    CreateBrandPayload,
    useBrandsApi
} from '@/pages/serviceAPI/BrandsAPI';
import { ImageIcon, Search, Plus, Edit2, Trash2, Eye, MoreVertical } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BrandFormData {
    name: string;
    brand_logo: File | null;
    is_active: boolean;
}

const BrandsPage = () => {
    const { shopId, hasPermission } = useAuth();
    const { useGetBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } = useBrandsApi();
    const { data: brands = [], isLoading: loading } = useGetBrands();

    const createMutation = useCreateBrand();
    const updateMutation = useUpdateBrand();
    const deleteMutation = useDeleteBrand();

    const [searchQuery, setSearchQuery] = useState('');

    // Reset state when branch changes
    useEffect(() => {
        setSearchQuery('');
        setFormDialogOpen(false);
        setViewDialogOpen(false);
    }, [shopId]);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<BrandFormData>({
        name: '',
        brand_logo: null,
        is_active: true,
    });
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Filter brands based on search
    const filteredBrands = useMemo(() => {
        return brands.filter(brand => 
            brand.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [brands, searchQuery]);

    /**
     * Compresses an image file to WebP format for optimized storage and performance.
     */
    const compressImageToWebP = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 400; // Optimal size for logos
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Could not get canvas context'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], `${file.name.split('.')[0]}.webp`, {
                                    type: 'image/webp',
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            } else {
                                reject(new Error('Conversion to WebP failed'));
                            }
                        },
                        'image/webp',
                        0.8
                    );
                };
                img.onerror = () => reject(new Error('Failed to load image'));
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
        });
    };

    const handleView = async (record: Brand) => {
        try {
            const brand = await fetchBrandById(record.id);
            setSelectedBrand(brand);
            setViewDialogOpen(true);
        } catch (error) {
            toast.error('Failed to load brand details');
        }
    };

    const handleEdit = (record: Brand) => {
        setIsEditMode(true);
        setSelectedBrandId(record.id);
        setFormData({
            name: record.name,
            brand_logo: null,
            is_active: Boolean(record.is_active),
        });
        setLogoPreview(record.brand_logo || null);
        setFormDialogOpen(true);
    };

    const handleDeleteClick = (record: Brand) => {
        setSelectedBrandId(record.id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedBrandId) {
            try {
                await deleteMutation.mutateAsync(selectedBrandId);
                toast.success('Brand deleted successfully');
            } catch (error) {
                toast.error('Failed to delete brand', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        setDeleteDialogOpen(false);
        setSelectedBrandId(null);
    };

    const handleAddNew = () => {
        setIsEditMode(false);
        setSelectedBrandId(null);
        setFormData({
            name: '',
            brand_logo: null,
            is_active: true,
        });
        setLogoPreview(null);
        setFormErrors({});
        setFormDialogOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Original file size must be less than 10MB');
                return;
            }

            setFormData({ ...formData, brand_logo: file });

            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) {
            errors.name = 'Brand name is required';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            let processedLogo = formData.brand_logo;
            if (processedLogo) {
                try {
                    processedLogo = await compressImageToWebP(processedLogo);
                } catch (err) {
                    console.error('Compression failed, using original file', err);
                }
            }

            const payload: CreateBrandPayload = {
                name: formData.name,
                brand_logo: processedLogo,
                is_active: formData.is_active ? 1 : 0,
            };

            if (isEditMode && selectedBrandId) {
                await updateMutation.mutateAsync({ id: selectedBrandId, payload });
                toast.success('Brand updated successfully');
            } else {
                await createMutation.mutateAsync(payload);
                toast.success('Brand created successfully');
            }

            setFormDialogOpen(false);
        } catch (error) {
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} brand`, {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-0">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Brands List</h1>
                    <p className="text-xs sm:text-sm mt-0.5 text-blue-600 font-medium">
                        Manage all product brands and their visual identity.
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search brands..."
                            className="pl-9 h-10 rounded-xl bg-white border-gray-200 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {hasPermission('brand.create') && (
                        <Button 
                            onClick={handleAddNew}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 h-10 shadow-md shadow-blue-100 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">New Brand</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Grid Content */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-100 rounded-2xl aspect-square border border-gray-200" />
                    ))}
                </div>
            ) : filteredBrands.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {filteredBrands.map((brand) => (
                        <div 
                            key={brand.id}
                            className="group relative bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 flex flex-col items-center"
                        >
                            {/* Action Menu (Top Right) */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-gray-100 text-gray-500">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-32 rounded-xl">
                                        <DropdownMenuItem onClick={() => handleView(brand)} className="text-xs cursor-pointer flex items-center gap-2">
                                            <Eye className="w-3.5 h-3.5" /> View Details
                                        </DropdownMenuItem>
                                        {hasPermission('brand.update') && (
                                            <DropdownMenuItem onClick={() => handleEdit(brand)} className="text-xs cursor-pointer flex items-center gap-2">
                                                <Edit2 className="w-3.5 h-3.5" /> Edit
                                            </DropdownMenuItem>
                                        )}
                                        {hasPermission('brand.delete') && (
                                            <DropdownMenuItem onClick={() => handleDeleteClick(brand)} className="text-xs cursor-pointer text-red-600 focus:text-red-600 flex items-center gap-2">
                                                <Trash2 className="w-3.5 h-3.5" /> Delete
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Brand Logo Container */}
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-4 rounded-full bg-white p-2 flex items-center justify-center ring-1 ring-gray-50 shadow-inner group-hover:ring-blue-50 transition-all duration-300">
                                {brand.brand_logo ? (
                                    <img
                                        src={brand.brand_logo}
                                        alt={brand.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-gray-200" />
                                )}
                            </div>

                            {/* Brand Name */}
                            <h3 className="text-[13px] font-bold text-gray-900 text-center line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {brand.name.charAt(0).toUpperCase() + brand.name.slice(1)}
                            </h3>
                            
                            {/* Compact Status Indicator */}
                            {!brand.is_active && (
                                <span className="mt-2 text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-1.5 rounded-md">
                                    Inactive
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No brands found</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                        {searchQuery ? `No results match "${searchQuery}". Try a different term.` : 'Get started by adding your first product brand.'}
                    </p>
                    {!searchQuery && hasPermission('brand.create') && (
                        <Button 
                            onClick={handleAddNew}
                            className="mt-6 bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 rounded-xl"
                        >
                            Add Your First Brand
                        </Button>
                    )}
                </div>
            )}

            {/* View Brand Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-900">Brand Profile</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Detailed overview of the selected brand.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedBrand && (
                        <div className="flex flex-col items-center py-6">
                            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-blue-50 shadow-xl border border-white bg-white p-4 mb-6">
                                {selectedBrand.brand_logo ? (
                                    <img
                                        src={selectedBrand.brand_logo}
                                        alt={selectedBrand.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <ImageIcon className="w-10 h-10 text-gray-200" />
                                )}
                            </div>
                            
                            <h2 className="text-xl font-bold text-gray-900 mb-1">
                                {selectedBrand.name.charAt(0).toUpperCase() + selectedBrand.name.slice(1)}
                            </h2>
                            
                            <Badge className={selectedBrand.is_active ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200 mb-6' : 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200 mb-6'}>
                                {selectedBrand.is_active ? 'Active Brand' : 'Inactive Brand'}
                            </Badge>

                            <div className="w-full grid grid-cols-2 gap-4 text-center">
                                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Created</p>
                                    <p className="text-xs font-semibold text-gray-700">
                                        {selectedBrand.created_at ? new Date(selectedBrand.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Updated</p>
                                    <p className="text-xs font-semibold text-gray-700">
                                        {selectedBrand.updated_at ? new Date(selectedBrand.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create/Edit Form Dialog */}
            <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
                <DialogContent className="max-w-lg rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-900">
                            {isEditMode ? 'Edit Brand' : 'Create New Brand'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            {isEditMode ? 'Update brand details and visual assets.' : 'Set up a new brand for your product catalog.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-bold text-gray-700">
                                Brand Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g., Apple, Samsung, Sony"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={`rounded-xl h-11 ${formErrors.name ? 'border-red-500 ring-red-50' : 'border-gray-200 focus:ring-blue-500'}`}
                            />
                            {formErrors.name && (
                                <p className="text-[10px] font-bold text-red-500 mt-1">{formErrors.name}</p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-gray-700">Brand Logo</Label>
                            <div className="flex items-center gap-4">
                                <div className="relative group w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden transition-colors hover:border-blue-400">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-gray-300" />
                                    )}
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-gray-900">Upload high-quality logo</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Recommended: 400x400px WebP, PNG, or JPG. Max 5MB.</p>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="mt-2 text-[10px] font-bold rounded-lg border-gray-200 hover:bg-white hover:text-blue-600 hover:border-blue-200 h-7"
                                        onClick={() => document.getElementById('brand_logo_input')?.click()}
                                    >
                                        Choose File
                                    </Button>
                                    <input id="brand_logo_input" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_active" className="text-sm font-bold text-gray-700">
                                    Active Status
                                </Label>
                                <p className="text-[10px] text-gray-500">Enable this brand for selection in products</p>
                            </div>
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                className="data-[state=checked]:bg-blue-600"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button 
                            variant="ghost" 
                            onClick={() => setFormDialogOpen(false)} 
                            disabled={submitting}
                            className="rounded-xl text-xs font-bold"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-6 shadow-md shadow-blue-100"
                        >
                            {submitting ? 'Processing...' : isEditMode ? 'Save Changes' : 'Create Brand'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="rounded-3xl max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold">Delete Brand?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500">
                            This will permanently remove the brand from your catalog. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel className="rounded-xl text-xs font-bold border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-100"
                        >
                            Confirm Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default BrandsPage;
