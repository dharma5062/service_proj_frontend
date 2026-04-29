import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/AuthContext';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    CloudUpload,
    Mail,
    IndianRupee,
    Search,
    Plus,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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

import { toast } from 'sonner';

import { useBrandsApi } from '@/pages/serviceAPI/BrandsAPI';
import { useShopCategoryFormsApi, DefectFormField } from '@/pages/serviceAPI/ShopCategoryFormsAPI';
import { useProductCategoriesApi, ProductCategory as APIProductCategory } from '@/pages/serviceAPI/ProductCategoriesAPI';
import { useProductsApi, Product } from '@/pages/serviceAPI/ProductsAPI';
import { searchCustomersByPhone, createCustomer, sendInvite, Customer, useCustomersApi } from '@/pages/serviceAPI/CustomersAPI';
import {
    useServiceRequestsApi,
} from '@/pages/serviceAPI/ServiceRequestsAPI';
import { useServiceChargesApi, ServiceCharge } from '@/pages/serviceAPI/ServiceChargesAPI';

interface PartItem {
    id: string;
    name: string;
    sku: string;
    status: string;
    quantity: number;
    price: number;
    tax_percentage?: number;
    tax_type?: 'inclusive' | 'exclusive';
}



// Helper: Compress and convert image to WEBP File
const compressImageToWebP = (file: File, maxWidth: number = 1000, quality: number = 0.7): Promise<{ preview: string; file: File }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/webp', quality);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Canvas to Blob failed'));
                        return;
                    }
                    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                    const webpFile = new File([blob], newFileName, { type: 'image/webp' });
                    resolve({ preview: dataUrl, file: webpFile });
                }, 'image/webp', quality);
            };
            img.onerror = (err) => reject(err);
            img.src = event.target?.result as string;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
};

const CreateServiceRequest = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const customerIdFromUrl = searchParams.get('customerId');

    // ── Auth context — provides shopId and shop metadata globally ─────────────
    const { shopId: contextShopId, shop } = useAuth();

    const isEditMode = Boolean(id);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ── TanStack Query hooks ──────────────────────────────────────────────────
    const { useGetBrands } = useBrandsApi();
    const { useGetCategoryForms } = useShopCategoryFormsApi();
    const { useGetProductCategories } = useProductCategoriesApi();
    const { useGetProducts } = useProductsApi();
    const { useGetServiceRequestById, useCreateServiceRequest, useUpdateServiceRequest } = useServiceRequestsApi();

    const { data: brands = [] } = useGetBrands();
    const { useGetCustomerById } = useCustomersApi();
    const { data: customerFromUrlData } = useGetCustomerById(customerIdFromUrl ? Number(customerIdFromUrl) : undefined);
    const { data: categoryForms = [] } = useGetCategoryForms();
    const { data: apiProductCategories = [], isLoading: isLoadingCategories } = useGetProductCategories();
    const { data: availableProducts = [], isLoading: isLoadingProducts } = useGetProducts();

    const serviceRequestId = isEditMode && id ? Number(id) : undefined;
    const { data: existingServiceRequest } = useGetServiceRequestById(serviceRequestId);

    const createServiceRequestMutation = useCreateServiceRequest();
    const updateServiceRequestMutation = useUpdateServiceRequest();

    // Form state
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [productCategory, setProductCategory] = useState<string>('');
    const [productType, setProductType] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [problemPreset, setProblemPreset] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Service Charges & Taxes state
    const [selectedServiceCharges, setSelectedServiceCharges] = useState<ServiceCharge[]>([]);
    const [serviceDiscount, setServiceDiscount] = useState(0);
    const [gstType, setGstType] = useState<'none' | 'cgst_sgst' | 'igst'>('none');
    const [gstPercentage, setGstPercentage] = useState(18);
    const [serviceSearchQuery, setServiceSearchQuery] = useState('');

    // Derive shopId and businessTypeId from context (no separate API call needed)
    const shopId = useMemo(() => contextShopId, [contextShopId]);
    const businessTypeId = useMemo(() => shop?.business_type_id ?? null, [shop?.business_type_id]);

    // Hierarchical category selection state
    const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<number | null>(null);
    const [categoryHierarchy, setCategoryHierarchy] = useState<number[]>([]); // Array of selected category IDs at each level

    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);

    // Customer search and management state
    const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
    const [searchedCustomers, setSearchedCustomers] = useState<Customer[]>([]);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [isSendingInvite, setIsSendingInvite] = useState(false);

    // Customer form state
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerEmail, setNewCustomerEmail] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [newCustomerAddress, setNewCustomerAddress] = useState('');

    // Parts management
    const [parts, setParts] = useState<PartItem[]>([]);
    const [partSearchQuery, setPartSearchQuery] = useState('');

    // Service Charges API
    const { useGetServiceCharges } = useServiceChargesApi();
    const { data: allServiceChargesResponse = { data: [] } } = useGetServiceCharges();
    const allServiceCharges = useMemo(() => {
        if (allServiceChargesResponse && 'data' in allServiceChargesResponse && Array.isArray(allServiceChargesResponse.data)) {
            return allServiceChargesResponse.data;
        }
        return Array.isArray(allServiceChargesResponse) ? allServiceChargesResponse : [];
    }, [allServiceChargesResponse]);

    // Category Forms (Problem Presets)
    const [isLoadingForms] = useState(false); // kept for JSX compatibility

    // Defect form fields (rendered when a problem preset is selected)
    const [defectFormValues, setDefectFormValues] = useState<Record<string, any>>({});

    // --- Draft Logic (branch-scoped) ---
    // Memo-ize so the string is stable across renders (no new reference each time)
    const DRAFT_KEY = useMemo(
        () => contextShopId ? `CreateServiceRequest_Draft_shop_${contextShopId}` : null,
        [contextShopId]
    );
    const IMAGE_DRAFT_KEY = useMemo(
        () => id
            ? `service_images_${id}`
            : contextShopId
                ? `service_images_draft_shop_${contextShopId}`
                : null,
        [id, contextShopId]
    );

    // Ref to prevent double-toast in Strict Mode or re-renders
    const hasShownDraftToast = useRef(false);

    // Load draft — only runs once shopId is known, skipped in edit mode
    useEffect(() => {
        if (isEditMode || !DRAFT_KEY || hasShownDraftToast.current) return;
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed.selectedCustomer) setSelectedCustomer(parsed.selectedCustomer);
                if (parsed.productCategory) setProductCategory(parsed.productCategory);
                if (parsed.productType) setProductType(parsed.productType);
                if (parsed.brand) setBrand(parsed.brand);
                if (parsed.model) setModel(parsed.model);
                if (parsed.problemPreset) setProblemPreset(parsed.problemPreset);
                if (parsed.internalNotes) setInternalNotes(parsed.internalNotes);
                if (parsed.tags) setTags(parsed.tags);
                if (parsed.selectedParentCategoryId) setSelectedParentCategoryId(parsed.selectedParentCategoryId);
                if (parsed.categoryHierarchy) setCategoryHierarchy(parsed.categoryHierarchy);
                if (parsed.parts) setParts(parsed.parts);
                if (parsed.defectFormValues) setDefectFormValues(parsed.defectFormValues);
                if (parsed.selectedServiceCharges) setSelectedServiceCharges(parsed.selectedServiceCharges);
                if (parsed.serviceDiscount) setServiceDiscount(parsed.serviceDiscount);
                if (parsed.gstType) setGstType(parsed.gstType);
                if (parsed.gstPercentage) setGstPercentage(parsed.gstPercentage);

                toast.success('Draft loaded for this branch');
                hasShownDraftToast.current = true;
            } catch (error) {
                console.error('Failed to load draft:', error);
            }
        }
    }, [isEditMode, DRAFT_KEY]); // re-runs if shopId changes (branch switch)

    // Auto-select customer from URL if customerId is present
    useEffect(() => {
        if (!isEditMode && customerFromUrlData && !selectedCustomer) {
            setSelectedCustomer(customerFromUrlData);
            toast.success(`Customer ${customerFromUrlData.name} pre-selected`);
        }
    }, [isEditMode, customerFromUrlData, selectedCustomer]);

    // Save Draft Function
    const saveDraft = () => {
        if (isEditMode || !DRAFT_KEY) return;
        const draftData = {
            selectedCustomer,
            productCategory,
            productType,
            brand,
            model,
            problemPreset,
            internalNotes,
            tags,
            selectedParentCategoryId,
            categoryHierarchy,
            parts,
            defectFormValues,
            selectedServiceCharges,
            serviceDiscount,
            gstType,
            gstPercentage,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        toast.success('Draft saved successfully');
    };

    // Auto-save on sudden exit (e.g. refresh/close tab)
    useEffect(() => {
        if (isEditMode || !DRAFT_KEY) return;
        const handleBeforeUnload = () => {
            const draftData = {
                selectedCustomer,
                productCategory,
                productType,
                brand,
                model,
                problemPreset,
                internalNotes,
                tags,
                selectedParentCategoryId,
                categoryHierarchy,
                parts,
                defectFormValues,
                selectedServiceCharges,
                serviceDiscount,
                gstType,
                gstPercentage,
            };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [
        isEditMode, DRAFT_KEY,
        selectedCustomer, productCategory, productType, brand, model,
        problemPreset, internalNotes, tags,
        selectedParentCategoryId, categoryHierarchy, parts, defectFormValues,
        selectedServiceCharges, serviceDiscount, gstType, gstPercentage
    ]);

    // Get available subcategories for a given parent category
    const getSubcategories = (parentCategoryId: number | null): APIProductCategory[] => {
        if (parentCategoryId === null) {
            // Return top-level categories (no parent)
            return apiProductCategories;
        }

        // Find the parent category and return its children
        const findCategoryById = (categories: APIProductCategory[], id: number): APIProductCategory | null => {
            for (const category of categories) {
                if (category.id === id) {
                    return category;
                }
                if (category.children && category.children.length > 0) {
                    const found = findCategoryById(category.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        const parentCategory = findCategoryById(apiProductCategories, parentCategoryId);
        return parentCategory?.children || [];
    };

    /**
     * Extract tax info from the description field.
     * Returns { tax_name, tax_percentage } or null if no tax data exists.
     */
    const getTaxInfo = (product: Product): { tax_name: string; tax_percentage: number; tax_type?: 'inclusive' | 'exclusive' } | null => {
        // First check top-level tax fields
        if (product.tax_name || product.tax_percentage) {
            return {
                tax_name: product.tax_name || '',
                tax_percentage: product.tax_percentage || 0,
            };
        }
        // Fallback: check if tax is embedded in description JSON
        const desc = product.description;
        let parsed = desc;
        if (typeof parsed === 'string') {
            try {
                parsed = JSON.parse(parsed);
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
            } catch {
                // Not JSON
            }
        }

        if (typeof parsed === 'object' && parsed !== null) {
            const descObj = parsed as any;
            if (descObj.taxes && Array.isArray(descObj.taxes) && descObj.taxes.length > 0) {
                return {
                    tax_name: descObj.taxes[0].tax_name || '',
                    tax_percentage: descObj.taxes[0].tax_percentage || 0,
                    tax_type: descObj.taxes[0].tax_type || 'exclusive',
                };
            }
        }
        return null;
    };

    // Get available parts based on category and product type
    const getAvailableParts = (category: string, type: string, brandName: string): PartItem[] => {
        // Filter products relative to the selection
        // Logic: Product must match Brand AND (Category OR Parent Category) 
        // Note: productType from UI corresponds to subcategory name, productCategory corresponds to parent category name.

        if (!brandName) return [];

        const filtered = availableProducts.filter(p => {
            const matchesBrand = p.brand?.name === brandName;

            // Check category match (either subcategory name or parent category name)
            // The API response product.category.name maps to productType (subcategory)
            // Or product.category.parent.name maps to productCategory (parent category)
            const matchesCategory =
                (type && p.category?.name === type) ||
                (category && p.category?.parent?.name === category) ||
                (category && p.category?.name === category);

            return matchesBrand && matchesCategory;
        });

        return filtered.map(p => {
            const taxInfo = getTaxInfo(p);
            return {
                id: p.id.toString(),
                name: p.name,
                sku: `SKU-${p.id}`, // Generate mock SKU if not available
                status: 'In Stock', // Default status
                quantity: 1, // Default quantity for adding
                price: Number(p.price) || 0,
                tax_percentage: taxInfo?.tax_percentage || p.tax_percentage || 0,
                tax_type: (taxInfo?.tax_type || p.tax_type || 'exclusive') as 'inclusive' | 'exclusive'
            };
        });
    };

    // Derive available parts whenever category, type, brand, or products change (useMemo avoids setState loop)
    const availableParts = useMemo(
        () => getAvailableParts(productCategory, productType, brand),
        [productCategory, productType, brand, availableProducts]
    );

    // Add part to the list
    const addPartToList = (part: PartItem) => {
        // Check if part already exists
        const existingPart = parts.find(p => p.id === part.id);
        if (existingPart) {
            // Increase quantity
            setParts(parts.map(p =>
                p.id === part.id
                    ? { ...p, quantity: p.quantity + 1 }
                    : p
            ));
            toast.success(`Increased ${part.name} quantity`);
        } else {
            // Add new part
            setParts([...parts, { ...part }]);
            toast.success(`Added ${part.name} to the list`);
        }
    };

    // Remove part from the list
    const removePartFromList = (partId: string) => {
        setParts(parts.filter(p => p.id !== partId));
        toast.success('Part removed from the list');
    };

    // --- Service Charges Management ---
    const addServiceCharge = (charge: ServiceCharge) => {
        const exists = selectedServiceCharges.find(c => c.id === charge.id);
        if (exists) {
            toast.info('Service charge already added');
            return;
        }
        setSelectedServiceCharges([...selectedServiceCharges, charge]);
        toast.success(`Service charge "${charge.name}" added`);
    };

    const removeServiceCharge = (id: number) => {
        setSelectedServiceCharges(selectedServiceCharges.filter(c => c.id !== id));
        toast.success('Service charge removed');
    };

    const filteredServiceCharges = allServiceCharges.filter(charge =>
        charge.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())
    );

    // Update quantity for a part
    const updatePartQuantity = (partId: string, newQuantity: number) => {
        if (newQuantity < 1) {
            removePartFromList(partId);
            return;
        }
        setParts(parts.map(p =>
            p.id === partId
                ? { ...p, quantity: newQuantity }
                : p
        ));
    };

    // Filter available parts by search query
    const filteredParts = availableParts.filter(part =>
        part.name.toLowerCase().includes(partSearchQuery.toLowerCase()) ||
        part.sku.toLowerCase().includes(partSearchQuery.toLowerCase())
    );

    // Load images from localStorage on component mount (branch-scoped key)
    useEffect(() => {
        if (!IMAGE_DRAFT_KEY) return;
        const storedImages = localStorage.getItem(IMAGE_DRAFT_KEY);
        if (storedImages) {
            try {
                const parsedImages = JSON.parse(storedImages);
                if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                    setUploadedImages(parsedImages);
                }
            } catch (error) {
                console.error('Failed to parse stored images:', error);
                localStorage.removeItem(IMAGE_DRAFT_KEY);
            }
        }
    }, [IMAGE_DRAFT_KEY]);

    // ── shopId comes from AuthContext (fetched once globally after login) ─────
    // No separate fetchShops() call is needed here.

    // ── Edit mode: load existing service request data ────────────────────────
    useEffect(() => {
        if (!isEditMode || !existingServiceRequest) return;

        const sr = existingServiceRequest;
        console.log('Edit mode - loaded service request:', sr);

        if (!shopId && sr.shop_id) {
            console.warn('AuthContext shopId not yet available; using service record shop_id as fallback:', sr.shop_id);
        }

        if (sr.customer) setSelectedCustomer(sr.customer as unknown as Customer);
        if (sr.brand) setBrand(sr.brand.name || '');
        if (sr.product) setModel(sr.product.name || '');
        if (sr.form && typeof sr.form === 'object' && sr.form.name) setProblemPreset(sr.form.name);

        if (sr.admin_note) {
            try {
                const parsed = JSON.parse(sr.admin_note);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const noteData = parsed[0];
                    if (noteData.internalNotes !== undefined) setInternalNotes(noteData.internalNotes);
                } else {
                    setInternalNotes(sr.admin_note);
                }
            } catch {
                setInternalNotes(sr.admin_note);
            }
        }

        if (sr.data) {
            const data = typeof sr.data === 'string' ? JSON.parse(sr.data) : sr.data;
            if (data.defectFormValues) setDefectFormValues(data.defectFormValues);
            if (data.tags) setTags(data.tags || '');
            if (data.parts && Array.isArray(data.parts)) setParts(data.parts);
            if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                setUploadedImages(data.images);
            }

            // Load service charges and GST info
            if (data.selectedServiceCharges && Array.isArray(data.selectedServiceCharges)) {
                setSelectedServiceCharges(data.selectedServiceCharges);
            }
            if (data.serviceDiscount !== undefined) setServiceDiscount(Number(data.serviceDiscount));
            if (data.gstType) setGstType(data.gstType);
            if (data.gstPercentage !== undefined) setGstPercentage(Number(data.gstPercentage));
        }

        if (sr.service_details) {
            const details = typeof sr.service_details === 'string'
                ? JSON.parse(sr.service_details)
                : sr.service_details;
            if (details.productCategory) setProductCategory(details.productCategory);
            if (details.productType) setProductType(details.productType);
            if (details.brand && !sr.brand) setBrand(details.brand);
            if (details.model && !sr.product) setModel(details.model);
            if (details.serviceType && (!sr.form || typeof sr.form !== 'object')) {
                setProblemPreset(details.serviceType);
            }
        }
    }, [isEditMode, existingServiceRequest]);

    // ── Edit mode: reconstruct category hierarchy from names ────────────────
    useEffect(() => {
        if (!isEditMode || apiProductCategories.length === 0 || !productCategory) return;

        // Helper to find the path of category IDs from a root list to a target name
        const findCategoryPath = (categories: APIProductCategory[], targetName: string, path: number[] = []): number[] | null => {
            for (const cat of categories) {
                if (cat.name === targetName) {
                    return [...path, cat.id];
                }
                if (cat.children && cat.children.length > 0) {
                    const result = findCategoryPath(cat.children, targetName, [...path, cat.id]);
                    if (result) return result;
                }
            }
            return null;
        };

        // 1. Find the parent category by name
        const parentCat = apiProductCategories.find(c => c.name === productCategory);
        if (parentCat) {
            // Set the parent ID for the grid selection
            if (selectedParentCategoryId !== parentCat.id) {
                setSelectedParentCategoryId(parentCat.id);
            }

            // 2. Resolve the path for subcategories (productType)
            if (productType) {
                // If it's just the parent itself, the hierarchy is just the parent (as per UI logic at line 1081)
                if (productType === productCategory) {
                    setCategoryHierarchy([parentCat.id]);
                } else {
                    // Search in children to find the type
                    const path = findCategoryPath(parentCat.children || [], productType, []);
                    if (path) {
                        setCategoryHierarchy(path);
                    }
                }
            } else {
                // Initial state when only parent is selected
                setCategoryHierarchy([parentCat.id]);
            }
        }
    }, [isEditMode, apiProductCategories, productCategory, productType]);

    // Fetch brands, forms, products — replaced by TanStack Query above
    // apiProductCategories, brands, categoryForms, availableProducts now come from hooks directly

    // Helper to get filtered problem presets based on selected category hierarchy
    const getFilteredProblemPresets = () => {
        if (categoryHierarchy.length === 0) return [];
        // All selected category IDs in the hierarchy (parent + sub-levels)
        const selectedCategoryIds = categoryHierarchy;
        return categoryForms.filter(form => {
            if (!form.active) return false;
            // Check if any of the form's categories match any selected category in the hierarchy
            if (form.categories && form.categories.length > 0) {
                return form.categories.some(cat =>
                    selectedCategoryIds.includes(cat.id)
                );
            }
            // Fallback: check legacy category_id field
            if (form.category_id) {
                return selectedCategoryIds.includes(form.category_id);
            }
            return false;
        });
    };

    // Derive defect form fields from selected problem preset (pure derivation — no setState loop)
    const selectedDefectFields = useMemo(() => {
        if (!problemPreset || problemPreset === 'others') return [];
        const selectedForm = categoryForms.find(f => f.name === problemPreset);
        if (selectedForm && Array.isArray(selectedForm.description)) {
            return selectedForm.description as DefectFormField[];
        }
        return [];
    }, [problemPreset, categoryForms]);

    // Initialize defectFormValues once per problemPreset change (tracked with a ref to fire only once)
    const lastInitializedPreset = useRef<string>('');
    useEffect(() => {
        // Only initialize defaults when the preset actually changes
        if (lastInitializedPreset.current === problemPreset) return;
        lastInitializedPreset.current = problemPreset;

        if (!problemPreset || problemPreset === 'others') {
            if (!isEditMode) setDefectFormValues({});
            return;
        }
        if (selectedDefectFields.length === 0) return;

        const defaults: Record<string, any> = {};
        selectedDefectFields.forEach(field => {
            if (field.type === 'toggle' || field.type === 'checkbox') {
                defaults[field.id] = field.defaultValue ?? false;
            } else if (field.type === 'device-photos') {
                defaults[field.id] = [];
            } else {
                defaults[field.id] = field.defaultValue ?? '';
            }
        });
        setDefectFormValues(prev => {
            if (isEditMode && Object.keys(prev).length > 0) {
                return { ...defaults, ...prev };
            }
            return defaults;
        });
    }, [problemPreset, selectedDefectFields, isEditMode]);

    // Helper to update a single defect form field value
    const updateDefectFieldValue = (fieldId: string, value: any) => {
        setDefectFormValues(prev => ({ ...prev, [fieldId]: value }));
    };

    // Handle device-photos field upload
    const handleDefectPhotoUpload = async (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const loadingToastId = toast.loading('Compressing photos...');

        try {
            const promises = Array.from(files).map(file => {
                // Compress and resize defect photos specifically
                return compressImageToWebP(file, 800, 0.7).then(res => res.preview);
            });

            const compressedImages = await Promise.all(promises);

            setDefectFormValues(prev => ({
                ...prev,
                [fieldId]: [...(prev[fieldId] || []), ...compressedImages]
            }));

            toast.success('Photos compressed and added successfully', { id: loadingToastId });
        } catch (error) {
            console.error('Error compressing defect photos:', error);
            toast.error('Failed to process photos', { id: loadingToastId });
        }
    };

    const subtotal = parts.reduce((sum, part) => sum + Number(part.price) * part.quantity, 0);
    const tax = parts.reduce((sum, part) => {
        const itemTaxPct = part.tax_percentage || 0;
        const price = Number(part.price);
        const qty = part.quantity;
        if (part.tax_type === 'inclusive') {
            const basePrice = price / (1 + (itemTaxPct / 100));
            return sum + (price - basePrice) * qty;
        }
        return sum + (price * itemTaxPct / 100) * qty;
    }, 0);

    const exclusiveTax = parts.reduce((sum, part) => {
        if (part.tax_type !== 'inclusive') {
            return sum + (Number(part.price) * part.quantity * (part.tax_percentage || 0) / 100);
        }
        return sum;
    }, 0);

    const partsGrandTotal = subtotal + exclusiveTax;

    const serviceSubtotal = selectedServiceCharges.reduce((sum, charge) => sum + Number(charge.amount), 0);
    const serviceTax = gstType === 'none' ? 0 : serviceSubtotal * (gstPercentage / 100);
    const serviceSectionTotal = serviceSubtotal + serviceTax - serviceDiscount;

    const finalGrandTotal = partsGrandTotal + serviceSectionTotal;

    // Handle image file uploads with localStorage
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            const loadingToastId = toast.loading('Compressing and uploading images...');

            // Convert and compress each file to WebP
            const imagePromises = Array.from(files).map(async (file) => {
                if (!file.type.startsWith('image/')) {
                    throw new Error(`${file.name} is not an image file`);
                }

                // Compress it to WebP!
                return await compressImageToWebP(file, 1000, 0.7);
            });

            // Await all compressions
            const compressedResults = await Promise.all(imagePromises);

            const base64Images = compressedResults.map(r => r.preview);
            const webpFiles = compressedResults.map(r => r.file);

            const updatedImages = [...uploadedImages, ...base64Images];
            setUploadedImages(updatedImages);
            setImageFiles(prev => [...prev, ...webpFiles]);
            if (IMAGE_DRAFT_KEY) localStorage.setItem(IMAGE_DRAFT_KEY, JSON.stringify(updatedImages));

            toast.success(`${files.length} image(s) processed to WebP correctly`, { id: loadingToastId });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to upload images';
            toast.error(errorMessage);
        }
    };

    // Remove image and update localStorage
    const handleRemoveImage = (index: number) => {
        const updatedImages = uploadedImages.filter((_, i) => i !== index);
        setUploadedImages(updatedImages);
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        if (IMAGE_DRAFT_KEY) localStorage.setItem(IMAGE_DRAFT_KEY, JSON.stringify(updatedImages));
        toast.success('Image removed successfully');
    };

    // Search customers by phone number - show all customers regardless of approval status
    useEffect(() => {
        const searchCustomers = async () => {
            if (!phoneSearchQuery.trim()) {
                setSearchedCustomers([]);
                return;
            }

            if (!shopId) {
                return;
            }

            setIsSearchingCustomer(true);
            try {
                // Search all customers (approved and non-approved)
                const results = await searchCustomersByPhone(phoneSearchQuery, shopId, false);
                setSearchedCustomers(results);
            } catch (error) {
                console.error('Failed to search customers:', error);
            } finally {
                setIsSearchingCustomer(false);
            }
        };

        const timeoutId = setTimeout(() => {
            searchCustomers();
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [phoneSearchQuery]);

    const handleCancel = () => {
        // Discard drafts on cancel when creating a new request
        if (!isEditMode) {
            if (DRAFT_KEY) localStorage.removeItem(DRAFT_KEY);
            if (IMAGE_DRAFT_KEY) localStorage.removeItem(IMAGE_DRAFT_KEY);
        }
        navigate('/dashboard/services');
    };

    const handleSubmit = async () => {
        // Validation
        if (!selectedCustomer) { toast.error('Please select a customer'); return; }
        if (!productType || !brand || !model) { toast.error('Please fill in all product details'); return; }
        if (!problemPreset) { toast.error('Please provide problem details'); return; }
        if (!shopId) {
            toast.error('Shop information not loaded. Please refresh the page and try again.');
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedBrandObj = brands.find(b => b.name === brand);
            const brandId = selectedBrandObj?.id;
            const selectedProductObj = availableProducts.find(p => p.name === model);
            const productId = selectedProductObj?.id;
            const selectedFormObj = categoryForms.find(f => f.name === problemPreset);
            const formId = selectedFormObj?.id;

            const serviceDetails = { serviceType: problemPreset, productCategory, productType, brand, model, device: `${brand} ${model}` };
            const dataPayload = {
                defectFormValues,
                parts,
                subtotal,
                tax,
                partsGrandTotal,
                selectedServiceCharges,
                serviceDiscount,
                gstType,
                gstPercentage,
                serviceSubtotal,
                serviceTax,
                serviceSectionTotal,
                grandTotal: finalGrandTotal, // final total for the whole request
                tags
            };
            const adminNotePayload = JSON.stringify([{ internalNotes: internalNotes || '' }]);

            const payload = {
                shop_id: shopId ?? undefined,
                customer_id: selectedCustomer.id,
                brand_id: brandId,
                product_id: productId,
                form_id: formId,
                form: formId ? true : false,
                service_details: JSON.stringify(serviceDetails),
                data: JSON.stringify(dataPayload),
                admin_note: adminNotePayload,
                service_status: 'pending',
                images: imageFiles.length > 0 ? imageFiles : undefined,
            };

            if (isEditMode && id) {
                await updateServiceRequestMutation.mutateAsync({ id, payload });
                toast.success('Service request updated successfully');
                navigate(`/dashboard/services/assign-technician/${id}`);
            } else {
                const response = await createServiceRequestMutation.mutateAsync(payload);
                toast.success('Service request created successfully');

                // Redirect to Technician Assignment page with the new ID
                if (response.data?.id) {
                    navigate(`/dashboard/services/assign-technician/${response.data.id}`);
                } else {
                    navigate('/dashboard/services');
                }
            }

            // Clean up localStorage images on successful submit
            if (IMAGE_DRAFT_KEY) localStorage.removeItem(IMAGE_DRAFT_KEY);
            // Clear branch-scoped draft
            if (!isEditMode && DRAFT_KEY) localStorage.removeItem(DRAFT_KEY);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save service request';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCustomer = async () => {
        // Validation
        if (!newCustomerName.trim()) {
            toast.error('Please enter customer name');
            return;
        }
        if (!newCustomerEmail.trim() || !newCustomerEmail.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        if (!newCustomerPhone.trim()) {
            toast.error('Please enter customer phone number');
            return;
        }

        setIsCreatingCustomer(true);
        try {
            // Create customer object payload
            const newCustomerPayload = {
                name: newCustomerName.trim(),
                email: newCustomerEmail.trim(),
                phone: newCustomerPhone.trim(),
                ...(newCustomerAddress.trim() && { address: newCustomerAddress.trim() }),
                shop_id: shopId,
                business_type_id: businessTypeId,
            };

            // Call API to create customer
            const response = await createCustomer(newCustomerPayload);

            if (response.success && response.data) {
                // Select the newly added customer
                setSelectedCustomer(response.data);
                toast.success(response.message || `Customer "${response.data.name}" created and email link sent.`);

                // Clear form and close modal
                setNewCustomerName('');
                setNewCustomerEmail('');
                setNewCustomerPhone('');
                setNewCustomerAddress('');
                setIsModalOpen(false);
            } else {
                toast.error(response.message || 'Failed to create customer');
            }
        } catch (error) {
            console.error('Error creating customer:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
            toast.error(errorMessage);
        } finally {
            setIsCreatingCustomer(false);
        }
    };

    // Handle sending invite to an existing customer
    const handleSendInvite = async (customer: Customer) => {
        if (!shopId) {
            toast.error('Shop information not loaded. Please try again.');
            return;
        }

        setIsSendingInvite(true);
        try {
            const response = await sendInvite(customer.phone, shopId, businessTypeId);

            if (response.success) {
                toast.success(response.message || 'Invite sent successfully! Customer will receive an email to approve.');

                // Automatically select the customer
                setSelectedCustomer({ ...customer, ...(response.data || {}) });
                setPhoneSearchQuery('');
                setSearchedCustomers([]);
            } else {
                toast.error(response.message || 'Failed to send invite');
            }
        } catch (error) {
            console.error('Error sending invite:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to send invite';
            toast.error(errorMessage);
        } finally {
            setIsSendingInvite(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50  flex-col">
            {/* Add Customer Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                        <DialogDescription>
                            Enter the customer's details below.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-sm font-medium mb-2 block">Full Name *</label>
                                <Input
                                    placeholder="e.g., Jane Doe"
                                    value={newCustomerName}
                                    onChange={(e) => setNewCustomerName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Email Address *</label>
                                <Input
                                    type="email"
                                    placeholder="e.g., jane.doe@example.com"
                                    value={newCustomerEmail}
                                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Phone Number *</label>
                                <Input
                                    type="tel"
                                    placeholder="e.g., +1 234 567 8900"
                                    value={newCustomerPhone}
                                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Address</label>
                            <Input
                                placeholder="e.g., 123 Main St, Anytown, CA 12345"
                                value={newCustomerAddress}
                                onChange={(e) => setNewCustomerAddress(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddCustomer} disabled={isCreatingCustomer}>
                            {isCreatingCustomer ? 'Saving...' : 'Save Customer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Main Content */}
            <main className="p-0">
                {/* Header */}
                <div className="mb-2">
                    <h1 className="text-lg font-bold text-gray-900">
                        {isEditMode ? 'Edit Service Request' : 'Create New Service Request'}
                    </h1>
                </div>

                {/* Top Section: Customer & Parts in Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                    {/* Customer Selection - Compact Card */}
                    <Card>
                        <CardHeader className="pb-2 pt-3 px-3">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-bold text-gray-900">Customer</CardTitle>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex items-center gap-1 px-2 py-1 bg-primary text-white rounded text-xs font-medium hover:bg-primary/90 transition-colors"
                                >
                                    <Plus className="h-3 w-3" />
                                    <span>Add</span>
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                            {/* Customer Card Display */}
                            {selectedCustomer ? (
                                <div className="border border-gray-200 rounded p-2 bg-white hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                {selectedCustomer.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900 text-xs">
                                                        {selectedCustomer.name}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {selectedCustomer.phone}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedCustomer(null)}
                                            className="text-xs h-6 px-2"
                                        >
                                            Change
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                        <Input
                                            className="h-9 text-xs pl-8 border border-gray-300 hover:border-primary transition-colors"
                                            placeholder="Enter phone number to search..."
                                            value={phoneSearchQuery}
                                            onChange={(e) => setPhoneSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    {/* Search Results */}
                                    {isSearchingCustomer ? (
                                        <div className="text-center py-2 text-xs text-gray-500">
                                            Searching...
                                        </div>
                                    ) : searchedCustomers.length > 0 ? (
                                        <div className="space-y-2">
                                            {searchedCustomers.map((customer) => (
                                                <div
                                                    key={customer.id}
                                                    className="border border-gray-200 rounded-md p-2 bg-white hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                            {customer.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-xs truncate">{customer.name}</p>
                                                            </div>
                                                            <p className="text-xs text-gray-500 truncate">{customer.phone}</p>
                                                        </div>
                                                    </div>

                                                    {/* Action buttons based on new approval and shop status */}
                                                    <div className="flex gap-2 mt-2">
                                                        {customer.in_same_shop || customer.in_current_branch || (customer.customer_approved && customer.in_same_shop === undefined) ? (
                                                            <Button
                                                                size="sm"
                                                                className="w-full text-xs h-7"
                                                                onClick={() => {
                                                                    setSelectedCustomer(customer);
                                                                    setPhoneSearchQuery('');
                                                                    setSearchedCustomers([]);
                                                                }}
                                                            >
                                                                Select Customer
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="w-full text-xs h-7 gap-1"
                                                                onClick={() => handleSendInvite(customer)}
                                                                disabled={isSendingInvite || !!customer.invite_token}
                                                            >
                                                                <Mail className="h-3 w-3" />
                                                                {customer.invite_token ? 'Invite Sent' : 'Send Invite'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : phoneSearchQuery.length > 3 ? (
                                        <div className="text-center py-2 text-xs text-gray-500">
                                            No customers found
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Parts & Estimates - Compact Card */}
                    <Card>
                        <CardHeader className="pb-2 pt-3 px-3">
                            <CardTitle className="text-sm font-bold text-gray-900">
                                Parts & Estimates
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                            {/* Search */}
                            <div className="relative mb-2">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                <Input
                                    placeholder="Search parts catalog..."
                                    className="pl-8 h-8 text-sm"
                                    value={partSearchQuery}
                                    onChange={(e) => setPartSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Message when no product type selected */}
                            {!productType && (
                                <div className="text-center py-2 text-xs text-gray-500">
                                    Select a product type first
                                </div>
                            )}

                            {/* Search Results - only show when user types in search */}
                            {productType && partSearchQuery && (
                                <div className="border rounded-lg overflow-hidden">
                                    {filteredParts.length > 0 ? (
                                        <div className="max-h-48 overflow-y-auto">
                                            {filteredParts.map((part) => (
                                                <button
                                                    key={part.id}
                                                    type="button"
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                                    onClick={() => {
                                                        addPartToList(part);
                                                        setPartSearchQuery('');
                                                    }}
                                                >
                                                    <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                                                    <span className="text-xs font-medium text-gray-800 truncate">{part.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-3 text-xs text-gray-500">
                                            No parts found matching "{partSearchQuery}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Two Column Layout for Product and Problem Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                    {/* Left Column */}
                    <div className="space-y-3">
                        {/* Product Type Selection */}
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <CardTitle className="text-sm font-bold text-gray-900">
                                    Select Product Type
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                {isLoadingCategories ? (
                                    <div className="text-center py-4 text-sm text-gray-500">
                                        Loading categories...
                                    </div>
                                ) : apiProductCategories.length > 0 ? (
                                    <>
                                        {/* Parent Categories Display */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {apiProductCategories.map((category) => (
                                                <button
                                                    key={category.id}
                                                    onClick={() => {
                                                        setSelectedParentCategoryId(category.id);
                                                        setCategoryHierarchy([category.id]);
                                                        setProductCategory(category.name); // Set category string for form submission
                                                        setProductType(''); // Reset product type when parent changes
                                                        setProblemPreset(''); // Reset problem preset when category changes
                                                    }}
                                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${selectedParentCategoryId === category.id
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {/* Display category image if available */}
                                                    {category.image_url ? (
                                                        <img
                                                            src={category.image_url || ''}
                                                            alt={category.name || 'Category'}
                                                            className="w-10 h-10 object-contain"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <svg
                                                            className={`w-10 h-10 ${selectedParentCategoryId === category.id ? 'text-primary' : 'text-gray-600'
                                                                }`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={1.5}
                                                                d="M4 6h16M4 12h16M4 18h16"
                                                            />
                                                        </svg>
                                                    )}
                                                    <span
                                                        className={`text-xs font-medium ${selectedParentCategoryId === category.id ? 'text-primary' : 'text-gray-700'
                                                            } capitalize`}
                                                    >
                                                        {category.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Cascading Subcategory Dropdowns */}
                                        {selectedParentCategoryId && (() => {
                                            // Find parent category name for displaying as label
                                            const parentCategoryName = apiProductCategories.find(c => c.id === selectedParentCategoryId)?.name || '';

                                            const renderCategoryLevel = (parentId: number | null, level: number, parentName: string): React.ReactElement | null => {
                                                const subcategories = getSubcategories(parentId);

                                                if (subcategories.length === 0) {
                                                    return null;
                                                }

                                                const selectedId = categoryHierarchy[level];
                                                const selectedCategory = subcategories.find(cat => cat.id === selectedId);

                                                // Label: level 0 = parent name (e.g. "Electronics"), deeper levels = selected parent name
                                                const labelText = level === 0
                                                    ? `${parentName} — Subcategory`
                                                    : parentName;

                                                return (
                                                    <>
                                                        <div className="mt-2">
                                                            <label className="text-xs font-medium text-gray-700 mb-1 block">
                                                                {labelText}
                                                            </label>
                                                            <Select
                                                                value={selectedId?.toString() || ''}
                                                                onValueChange={(value) => {
                                                                    const newId = parseInt(value);
                                                                    const newHierarchy = [...categoryHierarchy.slice(0, level), newId];
                                                                    setCategoryHierarchy(newHierarchy);

                                                                    // Find the selected category and set productType
                                                                    const selected = subcategories.find(cat => cat.id === newId);
                                                                    if (selected) {
                                                                        setProductType(selected.name);
                                                                    }
                                                                    setProblemPreset(''); // Reset problem preset when subcategory changes
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-9 text-sm">
                                                                    <SelectValue placeholder={`Select ${level === 0 ? 'subcategory' : parentName.toLowerCase() + ' type'}`} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {subcategories.map((subcat) => (
                                                                        <SelectItem key={subcat.id} value={subcat.id.toString()}>
                                                                            {subcat.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Recursively render next level if a category is selected */}
                                                        {selectedCategory && selectedCategory.children && selectedCategory.children.length > 0 &&
                                                            renderCategoryLevel(selectedCategory.id, level + 1, selectedCategory.name)
                                                        }
                                                    </>
                                                );
                                            };

                                            return renderCategoryLevel(selectedParentCategoryId, 0, parentCategoryName);
                                        })()}
                                    </>
                                ) : (
                                    <div className="text-center py-4 text-sm text-gray-500">
                                        No categories available
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Brand and Model */}
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <CardTitle className="text-sm font-bold text-gray-900">
                                    Product Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 px-3 pb-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-700">Brand</label>
                                        <div className="relative">
                                            {/* Display brand logo if available */}
                                            {brand && (
                                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center p-0.5 bg-gray-50 rounded border pointer-events-none z-10">
                                                    {brands.find(b => b.name === brand)?.brand_logo ? (
                                                        <img
                                                            src={brands.find(b => b.name === brand)?.brand_logo || ''}
                                                            alt={brand}
                                                            className="w-full h-full object-contain mix-blend-multiply"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-[8px] uppercase">
                                                            {brand.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <Select value={brand} onValueChange={(value) => {
                                                setBrand(value);
                                                setModel(''); // Reset model when brand changes
                                            }}>
                                                <SelectTrigger className={`h-9 text-sm ${brand ? 'pl-10' : ''}`}>
                                                    <SelectValue placeholder="Select Brand" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {brands.length > 0 ? (
                                                        brands.map((b) => (
                                                            <SelectItem key={b.id} value={b.name}>
                                                                {b.name}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <div className="p-2 text-xs text-gray-500 text-center">No brands available</div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-700">Model</label>
                                        <Select
                                            value={model}
                                            onValueChange={setModel}
                                            disabled={!brand}
                                        >
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder={brand ? "Select Model" : "Select Brand First"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {isLoadingProducts ? (
                                                    <div className="p-2 text-xs text-gray-500 text-center">Loading models...</div>
                                                ) : availableProducts.filter(p => p.brand?.name === brand).length > 0 ? (
                                                    availableProducts
                                                        .filter(p => p.brand?.name === brand)
                                                        .map((p) => (
                                                            <SelectItem key={p.id} value={p.name}>
                                                                {p.name}
                                                            </SelectItem>
                                                        ))
                                                ) : (
                                                    <div className="p-2">
                                                        {brand ? (
                                                            <p className="text-xs text-gray-500 text-center mb-2">No models found for {brand}</p>
                                                        ) : null}
                                                        <SelectItem value="custom">Other (Specify in notes)</SelectItem>
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Problem Details */}
                        <Card>
                            <CardHeader className="pb-1.5 pt-3 px-3">
                                <CardTitle className="text-sm font-bold text-gray-900">
                                    Problem Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 px-3 pb-3">
                                {/* Problem Presets */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-gray-700">
                                        Problem Presets
                                    </label>
                                    <Select value={problemPreset} onValueChange={setProblemPreset}>
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue placeholder="Select a problem" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {isLoadingForms ? (
                                                <div className="p-2 text-xs text-gray-500 text-center">Loading presets...</div>
                                            ) : (() => {
                                                const filtered = getFilteredProblemPresets();
                                                // In edit mode, ensure the selected preset is always in the list
                                                const hasSelected = filtered.some(f => f.name === problemPreset);
                                                if (filtered.length > 0) {
                                                    const allPresets = hasSelected || !problemPreset
                                                        ? filtered
                                                        : [...filtered, ...categoryForms.filter(f => f.name === problemPreset && f.active)];
                                                    return allPresets.map((preset) => (
                                                        <SelectItem key={preset.id} value={preset.name}>
                                                            {preset.name}
                                                        </SelectItem>
                                                    ));
                                                } else if (isEditMode && problemPreset && problemPreset !== 'others') {
                                                    // Hierarchy not resolved yet, but we have a selected preset — show it
                                                    const existingForm = categoryForms.find(f => f.name === problemPreset);
                                                    if (existingForm) {
                                                        return (
                                                            <SelectItem key={existingForm.id} value={existingForm.name}>
                                                                {existingForm.name}
                                                            </SelectItem>
                                                        );
                                                    }
                                                    return (
                                                        <SelectItem value={problemPreset}>{problemPreset}</SelectItem>
                                                    );
                                                } else {
                                                    return (
                                                        <SelectItem value="others">Others (Specify in description)</SelectItem>
                                                    );
                                                }
                                            })()}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Dynamic Defect Form Fields */}
                                {selectedDefectFields.length > 0 && (
                                    <div className="border-t pt-2 mt-1">
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Defect Details</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {selectedDefectFields.map((field) => {
                                                const value = defectFormValues[field.id];
                                                const isFullWidth = ['textarea', 'device-photos', 'pattern-lock', 'title', 'description', 'separator'].includes(field.type);
                                                return (
                                                    <div key={field.id} className={`flex flex-col gap-1 ${isFullWidth ? 'md:col-span-2' : ''}`}>
                                                        {/* Field Label */}
                                                        {!['checkbox', 'toggle', 'title', 'description', 'separator'].includes(field.type) && (
                                                            <label className="text-xs font-medium text-gray-700">
                                                                {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
                                                            </label>
                                                        )}

                                                        {/* Title */}
                                                        {field.type === 'title' && (
                                                            <div className="py-1">
                                                                <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-1">{field.label}</h4>
                                                                {field.placeholder && <p className="text-xs text-gray-500 mt-0.5">{field.placeholder}</p>}
                                                            </div>
                                                        )}

                                                        {/* Description */}
                                                        {field.type === 'description' && (
                                                            <p className="text-xs text-gray-600 my-0.5">{field.label}</p>
                                                        )}

                                                        {/* Separator */}
                                                        {field.type === 'separator' && (
                                                            <div className="py-2 flex items-center">
                                                                <div className="flex-grow border-t border-gray-200"></div>
                                                                {field.label && field.label.toLowerCase() !== 'separator' && field.label.toLowerCase() !== 'seperator' && (
                                                                    <span className="shrink-0 px-2 text-[10px] uppercase font-semibold tracking-wider text-gray-400">{field.label}</span>
                                                                )}
                                                                <div className="flex-grow border-t border-gray-200"></div>
                                                            </div>
                                                        )}

                                                        {/* Text */}
                                                        {field.type === 'text' && (
                                                            <Input
                                                                placeholder={field.placeholder || field.label}
                                                                className="h-8 text-sm"
                                                                value={value || ''}
                                                                onChange={(e) => updateDefectFieldValue(field.id, e.target.value)}
                                                            />
                                                        )}

                                                        {/* Dropdown */}
                                                        {field.type === 'dropdown' && (
                                                            <Select value={value || ''} onValueChange={(v) => updateDefectFieldValue(field.id, v)}>
                                                                <SelectTrigger className="h-8 text-sm">
                                                                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {(field.options || []).map((opt) => (
                                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}

                                                        {/* Toggle */}
                                                        {field.type === 'toggle' && (
                                                            <div className="flex items-center justify-between py-1">
                                                                <Label className="text-xs font-medium text-gray-700 cursor-pointer">
                                                                    {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
                                                                </Label>
                                                                <Switch
                                                                    checked={!!value}
                                                                    onCheckedChange={(checked) => updateDefectFieldValue(field.id, checked)}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Checkbox */}
                                                        {field.type === 'checkbox' && (
                                                            <div className="flex items-center gap-2 py-1">
                                                                <Checkbox
                                                                    id={field.id}
                                                                    checked={!!value}
                                                                    onCheckedChange={(checked) => updateDefectFieldValue(field.id, checked)}
                                                                />
                                                                <Label htmlFor={field.id} className="text-xs font-medium text-gray-700 cursor-pointer">
                                                                    {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
                                                                </Label>
                                                            </div>
                                                        )}

                                                        {/* Textarea */}
                                                        {field.type === 'textarea' && (
                                                            <Textarea
                                                                placeholder={field.placeholder || field.label}
                                                                className="min-h-16 text-sm"
                                                                value={value || ''}
                                                                onChange={(e) => updateDefectFieldValue(field.id, e.target.value)}
                                                            />
                                                        )}

                                                        {/* Date */}
                                                        {field.type === 'date' && (
                                                            <Input
                                                                type="date"
                                                                className="h-8 text-sm"
                                                                value={value || ''}
                                                                onChange={(e) => updateDefectFieldValue(field.id, e.target.value)}
                                                            />
                                                        )}

                                                        {/* Device Photos */}
                                                        {field.type === 'device-photos' && (
                                                            <div className="space-y-1.5">
                                                                <label className="flex items-center justify-center w-full h-14 border border-dashed border-gray-300 rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                                                    <div className="flex items-center gap-2">
                                                                        <CloudUpload className="h-4 w-4 text-gray-400" />
                                                                        <span className="text-xs text-gray-500">Upload photos</span>
                                                                    </div>
                                                                    <input
                                                                        type="file"
                                                                        className="hidden"
                                                                        multiple
                                                                        accept="image/*"
                                                                        onChange={(e) => handleDefectPhotoUpload(field.id, e)}
                                                                    />
                                                                </label>
                                                                {value && value.length > 0 && (
                                                                    <div className="flex gap-1.5 flex-wrap">
                                                                        {value.map((img: string, idx: number) => (
                                                                            <div key={idx} className="relative group w-10 h-10">
                                                                                <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-contain bg-gray-50 rounded border" />
                                                                                <button
                                                                                    type="button"
                                                                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                    onClick={() => {
                                                                                        const updated = [...value];
                                                                                        updated.splice(idx, 1);
                                                                                        updateDefectFieldValue(field.id, updated);
                                                                                    }}
                                                                                >
                                                                                    ×
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                        {/* Selected Parts & Search Results */}
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <CardTitle className="text-sm font-bold text-gray-900">
                                    Selected Parts & Pricing
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 px-3 pb-3">
                                {/* Available Parts List with Search */}
                                {productType && partSearchQuery && (
                                    <div className="border rounded-lg p-2 max-h-40 overflow-y-auto bg-gray-50 mb-3">
                                        <p className="text-xs font-medium text-gray-700 mb-2">Available Parts:</p>
                                        {filteredParts.length > 0 ? (
                                            <div className="space-y-1">
                                                {filteredParts.map((part) => (
                                                    <div
                                                        key={part.id}
                                                        className="flex justify-between items-center p-1.5 rounded hover:bg-white cursor-pointer"
                                                        onClick={() => addPartToList(part)}
                                                    >
                                                        <div className="flex-1">
                                                            <p className="text-xs font-medium text-gray-800">{part.name}</p>
                                                            <p className="text-xs text-gray-500">SKU: {part.sku}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-right">
                                                                <span className="text-xs font-medium text-gray-800">₹{Number(part.price).toFixed(2)}</span>
                                                                <p className="text-[9px] text-gray-500 uppercase leading-[10px]">{part.tax_type === 'inclusive' ? 'Inc. Tax' : 'Exc. Tax'}</p>
                                                            </div>
                                                            <Plus className="h-3.5 w-3.5 text-primary" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500">No parts found</p>
                                        )}
                                    </div>
                                )}

                                {/* Selected Parts List */}
                                <div className="flex flex-col gap-1.5">
                                    <p className="text-xs font-medium text-gray-700 mb-1">Selected Parts:</p>
                                    {parts.length === 0 ? (
                                        <p className="text-xs text-gray-500 text-center py-2">No parts added yet</p>
                                    ) : (
                                        parts.map((part) => (
                                            <div
                                                key={part.id}
                                                className="grid grid-cols-[1fr,auto,auto,auto,auto] gap-2 items-center p-1.5 rounded-lg hover:bg-gray-50"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-800 text-xs">{part.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        SKU: {part.sku} &middot; <span className="text-[10px] font-medium">{part.tax_type === 'inclusive' ? 'Inc. Tax' : 'Exc. Tax'}</span>
                                                    </p>
                                                </div>
                                                <span className="text-xs font-medium text-green-600">
                                                    {part.status}
                                                </span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={part.quantity}
                                                    onChange={(e) => updatePartQuantity(part.id, parseInt(e.target.value) || 1)}
                                                    className="w-12 h-6 text-xs text-center border rounded"
                                                />
                                                <span className="font-medium text-gray-800 text-xs">
                                                    ₹{((Number(part.price) * part.quantity) + (part.tax_type !== 'inclusive' ? (Number(part.price) * part.quantity * (part.tax_percentage || 0) / 100) : 0)).toFixed(2)}
                                                </span>
                                                <button
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => removePartFromList(part.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Totals */}
                                <div className="border-t pt-2 space-y-1.5">
                                    <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded border border-blue-100">
                                        <p className="text-xs font-bold text-blue-900">Parts Total</p>
                                        <p className="text-xs font-bold text-blue-900">
                                            ₹{partsGrandTotal.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Inspection Images */}
                        <Card>
                            <CardHeader className="pb-1.5 pt-3 px-3">
                                <CardTitle className="text-sm font-bold text-gray-900">
                                    Inspection Images
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 px-3 pb-3">
                                {/* Upload Area */}
                                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                    <div className="flex flex-col items-center justify-center">
                                        <CloudUpload className="h-6 w-6 text-gray-500 mb-0.5" />
                                        <p className="text-xs text-gray-500">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </label>

                                {/* Image Gallery */}
                                <div className="flex flex-wrap gap-2">
                                    {uploadedImages.map((img, index) => (
                                        <div key={index} className="relative group w-20 h-20 flex-shrink-0">
                                            <img
                                                src={img}
                                                alt={`Inspection ${index + 1}`}
                                                className="w-full h-full object-contain bg-gray-50 rounded-md border"
                                            />
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="text-white hover:text-red-400"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Service Charges & Taxes Section */}
                        <Card>
                            <CardHeader className="pb-1.5 pt-3 px-3">
                                <CardTitle className="text-sm font-bold text-gray-900 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        Service Charges & Taxes
                                        <IndianRupee className="h-3.5 w-3.5 text-primary" />
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 px-3 pb-3">
                                {/* Search Service Charges */}
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                        <Input
                                            className="h-9 text-xs pl-8 border border-gray-300 focus-visible:ring-primary/20"
                                            placeholder="Search service charges..."
                                            value={serviceSearchQuery}
                                            onChange={(e) => setServiceSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    {/* Service Search Dropdown */}
                                    {serviceSearchQuery && (
                                        <div className="border rounded-lg overflow-hidden bg-white shadow-sm border-gray-200">
                                            {filteredServiceCharges.length > 0 ? (
                                                <div className="max-h-40 overflow-y-auto">
                                                    {filteredServiceCharges.map((charge) => (
                                                        <button
                                                            key={charge.id}
                                                            type="button"
                                                            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                                            onClick={() => {
                                                                addServiceCharge(charge);
                                                                setServiceSearchQuery('');
                                                            }}
                                                        >
                                                            <div className="flex-1">
                                                                <p className="text-xs font-medium text-gray-800">{charge.name}</p>
                                                                {charge.description && <p className="text-[10px] text-gray-500 truncate">{charge.description}</p>}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-primary">₹{Number(charge.amount).toFixed(2)}</span>
                                                                <Plus className="h-3.5 w-3.5 text-primary" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-2 text-center text-xs text-gray-500">No service charges found</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Service Charges List */}
                                <div className="space-y-2">
                                    {selectedServiceCharges.length > 0 ? (
                                        <div className="border rounded-md divide-y divide-gray-100 overflow-hidden">
                                            {selectedServiceCharges.map((charge) => (
                                                <div key={charge.id} className="flex items-center justify-between p-2 bg-white">
                                                    <div className="flex-1">
                                                        <span className="text-xs font-medium text-gray-800">{charge.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs font-bold text-gray-900">₹{Number(charge.amount).toFixed(2)}</span>
                                                        <button
                                                            className="text-red-500 hover:text-red-700"
                                                            onClick={() => removeServiceCharge(charge.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 text-center py-2 bg-gray-50 rounded italic">Search and add service charges</p>
                                    )}
                                </div>

                                {/* GST and Discount logic - Minimalist Row */}
                                <div className="flex items-end gap-2 pt-2 border-t border-gray-100">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Discount (₹)</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            className="h-7 text-[11px] px-2 focus-visible:ring-primary/20 bg-white"
                                            value={serviceDiscount === 0 ? '' : serviceDiscount}
                                            placeholder="0"
                                            onChange={(e) => setServiceDiscount(e.target.value === '' ? 0 : Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Tax Type (GST)</label>
                                        <Select value={gstType} onValueChange={(v: any) => setGstType(v)}>
                                            <SelectTrigger className="h-7 text-[10px] bg-gray-50/50 border-gray-200 py-0 px-2 min-h-0">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent className="min-w-[120px]">
                                                <SelectItem value="none" className="text-[10px] py-1.5 cursor-pointer">No Tax (0%)</SelectItem>
                                                <SelectItem value="cgst_sgst" className="text-[10px] py-1.5 cursor-pointer">CGST + SGST (18%)</SelectItem>
                                                <SelectItem value="igst" className="text-[10px] py-1.5 cursor-pointer">IGST (18%)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Service Section Summary */}
                                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-gray-500 uppercase font-medium">Service Subtotal</span>
                                        <span className="text-xs font-medium text-gray-800">₹{serviceSubtotal.toFixed(2)}</span>
                                    </div>
                                    {gstType !== 'none' && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-500 uppercase font-medium">{gstType === 'igst' ? 'IGST (18%)' : 'CGST+SGST (18%)'}</span>
                                            <span className="text-xs font-medium text-gray-800">₹{serviceTax.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {serviceDiscount > 0 && (
                                        <div className="flex justify-between items-center text-red-600">
                                            <span className="text-[10px] uppercase font-medium">Discount</span>
                                            <span className="text-xs font-medium">-₹{serviceDiscount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-1 border-t border-gray-200 mt-1">
                                        <span className="text-xs font-bold text-gray-900">Service Area Total</span>
                                        <span className="text-xs font-bold text-gray-900">₹{serviceSectionTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tags & Internal Notes */}
                        <Card>
                            <CardHeader className="pb-1.5 pt-3 px-3">
                                <CardTitle className="text-sm font-bold text-gray-900">
                                    Tags & Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 px-3 pb-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-700">Tags</label>
                                        <Input
                                            placeholder="urgent, vip, warranty"
                                            className="h-8 text-sm"
                                            value={tags}
                                            onChange={(e) => setTags(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-700">
                                            Internal Notes
                                        </label>
                                        <Textarea
                                            placeholder="Add any internal notes here..."
                                            className="min-h-[80px] bg-gray-50 text-sm resize-none border-gray-200 focus-visible:ring-primary/20"
                                            value={internalNotes}
                                            onChange={(e) => setInternalNotes(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Sticky Footer */}
            <footer className="sticky bottom-0 z-10 bg-white/80 backdrop-blur-sm border-t border-gray-200 px-3 py-2.5">
                <div className="flex justify-end gap-3">
                    {!isEditMode && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={saveDraft}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm h-8"
                        >
                            Save Draft
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        className="text-sm h-8"
                    >
                        Cancel
                    </Button>
                    <div className="flex flex-col items-end mr-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Net Total:</span>
                            <span className="text-lg font-bold text-primary">₹{finalGrandTotal.toFixed(2)}</span>
                        </div>
                        {selectedServiceCharges.length > 0 && (
                            <span className="text-[10px] text-gray-400 -mt-1">Inc. {selectedServiceCharges.length} Service {selectedServiceCharges.length === 1 ? 'Charge' : 'Charges'}</span>
                        )}
                    </div>
                    <Button onClick={handleSubmit} disabled={isSubmitting} size="sm" className="bg-primary hover:bg-primary/90 text-sm h-8 px-6">
                        {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Request' : 'Create Request')}
                    </Button>
                </div>
            </footer>
        </div>
    );
};

export default CreateServiceRequest;