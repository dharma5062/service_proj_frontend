import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Search,
    Plus,
    Trash2,
    CloudUpload,
    Mail,
    CheckCircle,
    Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useServiceRequest } from '@/contexts/ServiceRequestContext';
import { fetchBrands, Brand } from '@/pages/serviceAPI/BrandsAPI';
import { fetchCategoryForms, CategoryForm } from '@/pages/serviceAPI/CategoryFormsAPI';
import { fetchProductCategories, ProductCategory as APIProductCategory } from '@/pages/serviceAPI/ProductCategoriesAPI';
import { fetchProducts, Product } from '@/pages/serviceAPI/ProductsAPI';
import { searchCustomersByPhone, createCustomer, sendInvite, Customer } from '@/pages/serviceAPI/CustomersAPI';




interface PartItem {
    id: string;
    name: string;
    sku: string;
    status: string;
    quantity: number;
    price: number;
}


const CreateServiceRequest = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { addServiceRequest, updateServiceRequest, getServiceRequestById } = useServiceRequest();
    const isEditMode = Boolean(id);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [productCategory, setProductCategory] = useState<string>('');
    const [productType, setProductType] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [problemPreset, setProblemPreset] = useState('');
    const [problemDescription, setProblemDescription] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [tags, setTags] = useState('');
    const [discount, setDiscount] = useState(0);

    // Hierarchical category selection state
    const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<number | null>(null);
    const [categoryHierarchy, setCategoryHierarchy] = useState<number[]>([]); // Array of selected category IDs at each level

    // Brands state
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoadingBrands, setIsLoadingBrands] = useState(false);

    const [uploadedImages, setUploadedImages] = useState<string[]>([]);

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
    const [availableParts, setAvailableParts] = useState<PartItem[]>([]);
    const [partSearchQuery, setPartSearchQuery] = useState('');

    // API Product Categories
    const [apiProductCategories, setApiProductCategories] = useState<APIProductCategory[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);

    // Category Forms (Problem Presets)
    const [categoryForms, setCategoryForms] = useState<CategoryForm[]>([]);
    const [isLoadingForms, setIsLoadingForms] = useState(false);

    // Products (Models and Parts)
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

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

        return filtered.map(p => ({
            id: p.id.toString(),
            name: p.name,
            sku: `SKU-${p.id}`, // Generate mock SKU if not available
            status: 'In Stock', // Default status
            quantity: 1, // Default quantity for adding
            price: p.price || 0
        }));
    };

    // Update available parts when category, type or brand changes
    useEffect(() => {
        const parts = getAvailableParts(productCategory, productType, brand);
        setAvailableParts(parts);
    }, [productCategory, productType, brand, availableProducts]);

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

    // Load existing service request data in edit mode
    useEffect(() => {
        if (isEditMode && id) {
            const existingRequest = getServiceRequestById(id);
            if (existingRequest) {
                // Populate form with existing data
                // Populate form with existing data
                // Adapt context customer (string ID) to API customer type (number ID)
                // We cast ID to unknown then number to satisfy TS, runtime will follow
                setSelectedCustomer({
                    ...existingRequest.customer,
                    id: existingRequest.customer.id as unknown as number
                });
                // setProductCategory(existingRequest.productCategory); // Type mismatch might occur if not casted
                setProductCategory(existingRequest.productCategory as string);
                setProductType(existingRequest.productType);
                setBrand(existingRequest.brand);
                setModel(existingRequest.model);
                setProblemPreset(existingRequest.problemPreset);
                setProblemDescription(existingRequest.problemDescription);
                setInternalNotes(existingRequest.internalNotes);
                setTags(existingRequest.tags);
                setDiscount(existingRequest.discount);
                setParts(existingRequest.parts);
                setUploadedImages(existingRequest.images);
            } else {
                toast.error('Service request not found');
                navigate('/dashboard/services');
            }
        }
    }, [isEditMode, id, getServiceRequestById, navigate]);

    // Load images from localStorage on component mount
    useEffect(() => {
        const storageKey = id ? `service_images_${id}` : 'service_images_draft';
        const storedImages = localStorage.getItem(storageKey);

        if (storedImages) {
            try {
                const parsedImages = JSON.parse(storedImages);
                if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                    setUploadedImages(parsedImages);
                }
            } catch (error) {
                console.error('Failed to parse stored images:', error);
                // Clear corrupted data
                localStorage.removeItem(storageKey);
            }
        }
    }, [id]);

    // Fetch product categories from API on component mount
    useEffect(() => {
        const loadProductCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const categories = await fetchProductCategories();
                setApiProductCategories(categories);
                console.log('Product categories loaded:', categories);
            } catch (error) {
                console.error('Failed to load product categories:', error);
                toast.error('Failed to load product categories');
            } finally {
                setIsLoadingCategories(false);
            }
        };

        loadProductCategories();

    }, []);

    // Fetch brands on mount
    useEffect(() => {
        const loadBrands = async () => {
            setIsLoadingBrands(true);
            try {
                const fetchedBrands = await fetchBrands();
                setBrands(fetchedBrands);
                console.log('Brands loaded:', fetchedBrands);
            } catch (error) {
                console.error('Failed to load brands:', error);
                toast.error('Failed to load brands');
            } finally {
                setIsLoadingBrands(false);
            }
        };

        const loadCategoryForms = async () => {
            setIsLoadingForms(true);
            try {
                const forms = await fetchCategoryForms();
                setCategoryForms(forms);
                console.log('Category forms loaded:', forms);
            } catch (error) {
                console.error('Failed to load category forms:', error);
                toast.error('Failed to load problem presets');
            } finally {
                setIsLoadingForms(false);
            }
        };

        const loadProducts = async () => {
            setIsLoadingProducts(true);
            try {
                const products = await fetchProducts();
                setAvailableProducts(products);
                console.log('Products loaded:', products);
            } catch (error) {
                console.error('Failed to load products:', error);
                toast.error('Failed to load products');
            } finally {
                setIsLoadingProducts(false);
            }
        };

        loadBrands();
        loadCategoryForms();
        loadProducts();
    }, []);

    // Helper to get filtered problem presets
    const getFilteredProblemPresets = () => {
        if (!selectedParentCategoryId) return [];
        return categoryForms.filter(form => form.category_id === selectedParentCategoryId && form.active);
    };

    const subtotal = parts.reduce((sum, part) => sum + part.price * part.quantity, 0);
    const tax = subtotal * 0.08;
    const grandTotal = subtotal + tax - discount;

    // Handle image file uploads with localStorage
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            // Convert each file to base64
            const imagePromises = Array.from(files).map((file) => {
                return new Promise<string>((resolve, reject) => {
                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                        reject(new Error(`${file.name} is not an image file`));
                        return;
                    }

                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        reject(new Error(`${file.name} exceeds 5MB limit`));
                        return;
                    }

                    const reader = new FileReader();

                    reader.onload = (event) => {
                        if (event.target?.result) {
                            resolve(event.target.result as string);
                        } else {
                            reject(new Error('Failed to read file'));
                        }
                    };

                    reader.onerror = () => {
                        reject(new Error(`Failed to read ${file.name}`));
                    };

                    // Read file as base64 data URL
                    reader.readAsDataURL(file);
                });
            });

            const base64Images = await Promise.all(imagePromises);

            // Update state with new images
            const updatedImages = [...uploadedImages, ...base64Images];
            setUploadedImages(updatedImages);

            // Store in localStorage with service request ID as key
            const storageKey = id ? `service_images_${id}` : 'service_images_draft';
            localStorage.setItem(storageKey, JSON.stringify(updatedImages));

            toast.success(`${files.length} image(s) uploaded and saved successfully`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to upload images';
            toast.error(errorMessage);
        }
    };

    // Remove image and update localStorage
    const handleRemoveImage = (index: number) => {
        const updatedImages = uploadedImages.filter((_, i) => i !== index);
        setUploadedImages(updatedImages);

        // Update localStorage
        const storageKey = id ? `service_images_${id}` : 'service_images_draft';
        localStorage.setItem(storageKey, JSON.stringify(updatedImages));

        toast.success('Image removed successfully');
    };

    // Search customers by phone number - show all customers regardless of approval status
    useEffect(() => {
        const searchCustomers = async () => {
            if (!phoneSearchQuery.trim()) {
                setSearchedCustomers([]);
                return;
            }

            setIsSearchingCustomer(true);
            try {
                // Search all customers (approved and non-approved)
                const results = await searchCustomersByPhone(phoneSearchQuery, false);
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

    const handleSubmit = () => {
        // Validation
        if (!selectedCustomer) {
            toast.error('Please select a customer');
            return;
        }
        if (!productType || !brand || !model) {
            toast.error('Please fill in all product details');
            return;
        }
        if (!problemPreset || !problemDescription) {
            toast.error('Please provide problem details');
            return;
        }

        // Get the service type label from problem preset
        const serviceTypeLabel = problemPreset === 'others' ? 'Others' : problemPreset;

        // Create service request object with type adaptation for customer ID
        // Context expects string ID, API returns number ID
        const serviceRequestPayload = {
            serviceType: serviceTypeLabel,
            customer: {
                ...selectedCustomer,
                id: selectedCustomer.id.toString(),
                address: selectedCustomer.address || '' // Ensure address is present if needed
            },
            device: `${brand} ${model}`,
            productCategory,
            productType,
            brand,
            model,
            problemPreset,
            problemDescription,
            internalNotes,
            tags,
            parts,
            subtotal,
            discount,
            tax,
            grandTotal,
            images: uploadedImages,
        };

        // Save to context (create or update)
        if (isEditMode && id) {
            updateServiceRequest(id, serviceRequestPayload);
            toast.success('Service request updated successfully');
        } else {
            addServiceRequest(serviceRequestPayload);
            toast.success('Service request created successfully');
        }

        navigate('/dashboard/services');
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
            };

            // Call API to create customer
            const response = await createCustomer(newCustomerPayload);

            if (response.success && response.data) {
                // Select the newly added customer
                setSelectedCustomer(response.data);
                toast.success(`Customer "${response.data.name}" created and email link sent.`);

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
    const handleSendInvite = async (phone: string) => {
        setIsSendingInvite(true);
        try {
            const response = await sendInvite(phone);

            if (response.success) {
                toast.success('Invite sent successfully! Customer will receive an email to approve.');

                // Update the customer in the search results
                setSearchedCustomers(prevCustomers =>
                    prevCustomers.map(c =>
                        c.phone === phone ? { ...c, ...response.data } : c
                    )
                );
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
                                                    {selectedCustomer.customer_approved && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Approved
                                                        </span>
                                                    )}
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
                                                                {customer.customer_approved ? (
                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded shrink-0">
                                                                        <CheckCircle className="h-3 w-3" />
                                                                        Approved
                                                                    </span>
                                                                ) : customer.invite_token ? (
                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded shrink-0">
                                                                        <Clock className="h-3 w-3" />
                                                                        Pending
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded shrink-0">
                                                                        <Clock className="h-3 w-3" />
                                                                        New
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 truncate">{customer.phone}</p>
                                                        </div>
                                                    </div>

                                                    {/* Action buttons based on approval status */}
                                                    <div className="flex gap-2 mt-2">
                                                        {customer.customer_approved ? (
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
                                                                onClick={() => handleSendInvite(customer.phone)}
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

                            {/* Quick Add Buttons */}
                            {productType && availableParts.length > 0 && (
                                <div className="flex gap-2">
                                    {availableParts.slice(0, 3).map((part) => (
                                        <Button
                                            key={part.id}
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 gap-1 text-xs h-7"
                                            onClick={() => addPartToList(part)}
                                        >
                                            <Plus className="h-3 w-3" />
                                            {part.name.split(' ')[0]}
                                        </Button>
                                    ))}
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
                                            const renderCategoryLevel = (parentId: number | null, level: number): React.ReactElement | null => {
                                                const subcategories = getSubcategories(parentId);

                                                if (subcategories.length === 0) {
                                                    return null;
                                                }

                                                const selectedId = categoryHierarchy[level];
                                                const selectedCategory = subcategories.find(cat => cat.id === selectedId);

                                                return (
                                                    <>
                                                        <div className="mt-3">
                                                            <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                                                {level === 0 ? 'Product Subcategory' : `Sub-level ${level + 1}`}
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
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-9 text-sm">
                                                                    <SelectValue placeholder={`Select ${level === 0 ? 'subcategory' : 'option'}`} />
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
                                                            renderCategoryLevel(selectedCategory.id, level + 1)
                                                        }
                                                    </>
                                                );
                                            };

                                            return renderCategoryLevel(selectedParentCategoryId, 0);
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
                                                    {isLoadingBrands ? (
                                                        <div className="p-2 text-xs text-gray-500 text-center">Loading brands...</div>
                                                    ) : brands.length > 0 ? (
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
                                {/* Grid Layout for Problem Presets and Tags */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                                                ) : getFilteredProblemPresets().length > 0 ? (
                                                    getFilteredProblemPresets().map((preset) => (
                                                        <SelectItem key={preset.id} value={preset.name}>
                                                            {preset.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="others">Others (Specify in description)</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-700">Tags</label>
                                        <Input
                                            placeholder="urgent, vip, warranty"
                                            className="h-8 text-sm"
                                            value={tags}
                                            onChange={(e) => setTags(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Grid Layout for Problem Description and Internal Notes */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-700">
                                            Problem Description
                                        </label>
                                        <Textarea
                                            placeholder="Describe the issue in detail..."
                                            className="min-h-20 text-sm"
                                            value={problemDescription}
                                            onChange={(e) => setProblemDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-700">
                                            Internal Notes
                                        </label>
                                        <Textarea
                                            placeholder="Add any internal notes here..."
                                            className="min-h-20 bg-gray-50 text-sm"
                                            value={internalNotes}
                                            onChange={(e) => setInternalNotes(e.target.value)}
                                        />
                                    </div>
                                </div>
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
                                                            <span className="text-xs font-medium text-gray-800">${part.price.toFixed(2)}</span>
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
                                                    <p className="text-xs text-gray-500">SKU: {part.sku}</p>
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
                                                    ${(part.price * part.quantity).toFixed(2)}
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
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-gray-600">Subtotal</p>
                                        <p className="text-xs font-medium text-gray-800">${subtotal.toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between items-center gap-3">
                                        <p className="text-xs text-gray-600">Discount</p>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="w-16 h-6 text-right text-xs"
                                            value={discount}
                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-gray-600">Tax</p>
                                        <p className="text-xs font-medium text-gray-800">${tax.toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-1.5 mt-1.5">
                                        <p className="text-xs font-bold text-gray-900">Grand Total</p>
                                        <p className="text-xs font-bold text-gray-900">
                                            ${grandTotal.toFixed(2)}
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
                                <div className="grid grid-cols-4 gap-2">
                                    {uploadedImages.map((img, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={img}
                                                alt={`Inspection ${index + 1}`}
                                                className="w-full aspect-square object-cover rounded-md"
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
                    </div>
                </div>
            </main>

            {/* Sticky Footer */}
            <footer className="sticky bottom-0 z-10 bg-white/80 backdrop-blur-sm border-t border-gray-200 px-3 py-2.5">
                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dashboard/services')}
                        className="text-sm h-8"
                    >
                        Cancel
                    </Button>
                    <Button variant="outline" size="sm" className="text-sm h-8">
                        Save Draft
                    </Button>
                    <Button onClick={handleSubmit} size="sm" className="bg-primary hover:bg-primary/90 text-sm h-8">
                        {isEditMode ? 'Update Request' : 'Create Request'}
                    </Button>
                </div>
            </footer>
        </div>
    );
};

export default CreateServiceRequest;
