import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
    Plus,
    Trash2,
    GripVertical,
    Type,
    ChevronDown,
    ToggleLeft,
    CheckSquare,
    AlignLeft,
    Calendar,
    Camera,
    X,
    Upload,
    Minus,
    ChevronRight,
    Heading,
    FileText,
} from 'lucide-react';
import {
    DefectFormField,
    FieldType,
    deserializeDefectFormData,
    CreateCategoryFormPayload,
    useShopCategoryFormsApi,
} from '@/pages/serviceAPI/ShopCategoryFormsAPI';
import { ProductCategory } from '@/pages/serviceAPI/ProductCategoriesAPI';
import { useShopsApi } from '@/pages/serviceAPI/ShopsAPI';
import {
    DndContext,
    DragEndEvent,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FormMetadata {
    name: string;
    // category_type: string; // Removed
    category_ids: number[]; // Required - must select at least one category
    active: boolean;
}

const CreateShopCategoryFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { shopId: contextShopId } = useAuth();
    const isEditMode = Boolean(id);
    const formId = id ? parseInt(id) : undefined;

    // TanStack Query hooks
    const { useGetCategoryFormById, useCreateCategoryForm, useUpdateCategoryForm } = useShopCategoryFormsApi();
    const { useGetShops } = useShopsApi();

    const { data: shopsData } = useGetShops();
    const { data: existingForm } = useGetCategoryFormById(formId);
    const createCategoryFormMutation = useCreateCategoryForm();
    const updateCategoryFormMutation = useUpdateCategoryForm();

    const [deviceType, setDeviceType] = useState<'smartphone' | 'tablet' | 'laptop' | 'agnostic'>('smartphone');
    const [formFields, setFormFields] = useState<DefectFormField[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<FormMetadata>({
        name: '',
        category_ids: [],
        active: true,
    });
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [shopId, setShopId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [previewPhotos, setPreviewPhotos] = useState<{ id: string; url: string; name: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Derive categories from shops query data
    useEffect(() => {
        if (!shopsData) return;
        const shops = shopsData.data?.data || [];
        if (shops.length > 0) {
            const shop = contextShopId
                ? (shops.find((s: any) => s.id === contextShopId) || shops[0])
                : shops[0];
            setShopId(shop.id);
            const businessCategories = shop.business_type?.category?.children || [];
            setCategories(businessCategories);
            if (businessCategories.length === 0) {
                toast.info('No specific categories found for your shop type.');
            }
        } else {
            toast.warning('No shop found. Please create a shop first.');
        }
    }, [shopsData, contextShopId]);

    // Populate form in edit mode when existing form data arrives
    useEffect(() => {
        if (!existingForm || !isEditMode) return;
        const categoryIds = existingForm.categories && existingForm.categories.length > 0
            ? existingForm.categories.map((cat: any) => cat.id)
            : existingForm.category_id ? [existingForm.category_id] : [];

        setMetadata({
            name: existingForm.name,
            category_ids: categoryIds,
            active: Boolean(existingForm.active),
        });

        if (existingForm.description) {
            const formData = deserializeDefectFormData(existingForm.description);
            if (formData) {
                const normalizedFields = formData.fields.map((f: DefectFormField) => {
                    if (f.type === 'toggle' && f.defaultValue !== undefined) {
                        return { ...f, defaultValue: f.defaultValue === true || f.defaultValue === 'true' };
                    }
                    return f;
                });
                setFormFields(normalizedFields);
                if (formData.deviceType) setDeviceType(formData.deviceType);

                const initialToggleStates: Record<string, boolean> = {};
                normalizedFields.forEach((f: DefectFormField) => {
                    if (f.type === 'toggle') initialToggleStates[f.id] = Boolean(f.defaultValue);
                });
                setTogglePreviewStates(initialToggleStates);
            }
        }
    }, [existingForm, isEditMode]);
    const fieldTypes: { type: FieldType; label: string; icon: any }[] = [
        { type: 'text', label: 'Text Input', icon: Type },
        { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
        { type: 'toggle', label: 'Toggle Switch', icon: ToggleLeft },
        { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
        { type: 'textarea', label: 'Text Area', icon: AlignLeft },
        { type: 'date', label: 'Date Picker', icon: Calendar },
    ];

    const layoutFields: { type: FieldType; label: string; icon: any }[] = [
        { type: 'title', label: 'Title', icon: Heading },
        { type: 'description', label: 'Description', icon: FileText },
        { type: 'separator', label: 'Separator', icon: Minus },
    ];

    const presetFields: { type: FieldType; label: string; icon: any }[] = [
        { type: 'device-photos', label: 'Device Photos', icon: Camera },
    ];

    // Track toggle preview states for live preview
    const [togglePreviewStates, setTogglePreviewStates] = useState<Record<string, boolean>>({});



    const generateFieldId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const addField = (type: FieldType) => {
        const isLayoutOnly = type === 'separator';
        const defaultLabels: Partial<Record<FieldType, string>> = {
            separator: 'Separator',
            title: 'Section Title',
            description: 'Add a description here...',
        };
        const newField: DefectFormField = {
            id: generateFieldId(),
            type,
            label: defaultLabels[type] || `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
            required: false,
            showOnReceipt: false,
            ...(type === 'dropdown' && { options: ['Option 1', 'Option 2'] }),
            ...(type === 'toggle' && { defaultValue: false, conditionalFields: [] }),
        };
        setFormFields([...formFields, newField]);
        setSelectedFieldId(isLayoutOnly ? null : newField.id);
    };

    // Add a conditional (child) field to a toggle field
    const addConditionalField = (toggleFieldId: string, type: FieldType) => {
        const childField: DefectFormField = {
            id: generateFieldId(),
            type,
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
            required: false,
            showOnReceipt: false,
            ...(type === 'dropdown' && { options: ['Option 1', 'Option 2'] }),
        };
        setFormFields(formFields.map(field =>
            field.id === toggleFieldId
                ? { ...field, conditionalFields: [...(field.conditionalFields || []), childField] }
                : field
        ));
    };

    // Update a conditional (child) field inside a toggle
    const updateConditionalField = (toggleFieldId: string, childFieldId: string, updates: Partial<DefectFormField>) => {
        setFormFields(formFields.map(field =>
            field.id === toggleFieldId
                ? {
                    ...field,
                    conditionalFields: (field.conditionalFields || []).map(cf =>
                        cf.id === childFieldId ? { ...cf, ...updates } : cf
                    )
                }
                : field
        ));
    };

    // Remove a conditional (child) field from a toggle
    const removeConditionalField = (toggleFieldId: string, childFieldId: string) => {
        setFormFields(formFields.map(field =>
            field.id === toggleFieldId
                ? { ...field, conditionalFields: (field.conditionalFields || []).filter(cf => cf.id !== childFieldId) }
                : field
        ));
    };

    const updateField = (id: string, updates: Partial<DefectFormField>) => {
        setFormFields(formFields.map(field =>
            field.id === id ? { ...field, ...updates } : field
        ));
    };

    const deleteField = (id: string) => {
        setFormFields(formFields.filter(field => field.id !== id));
        if (selectedFieldId === id) {
            setSelectedFieldId(null);
        }
    };

    const selectedField = formFields.find(f => f.id === selectedFieldId);

    // Device photos handlers
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const maxPhotos = 6;
        const remainingSlots = maxPhotos - previewPhotos.length;
        if (remainingSlots <= 0) {
            toast.warning(`Maximum ${maxPhotos} photos allowed`);
            return;
        }

        const newPhotos = Array.from(files).slice(0, remainingSlots).map(file => ({
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            url: URL.createObjectURL(file),
            name: file.name,
        }));

        setPreviewPhotos(prev => [...prev, ...newPhotos]);

        // Reset file input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removePhoto = (photoId: string) => {
        setPreviewPhotos(prev => {
            const photo = prev.find(p => p.id === photoId);
            if (photo) URL.revokeObjectURL(photo.url);
            return prev.filter(p => p.id !== photoId);
        });
    };

    const handleDragStart = () => {
        // Could be used for drag overlay if needed in future
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        // Check if dragging from toolbox (adding new field)
        if (active.id.toString().startsWith('toolbox-')) {
            const fieldType = active.id.toString().replace('toolbox-', '') as FieldType;
            addField(fieldType);
            return;
        }

        // Reordering existing fields
        if (active.id !== over.id) {
            const oldIndex = formFields.findIndex((f) => f.id === active.id);
            const newIndex = formFields.findIndex((f) => f.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                setFormFields(arrayMove(formFields, oldIndex, newIndex));
            }
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!metadata.name.trim()) {
            errors.name = 'Form name is required';
        }

        // if (!metadata.category_type.trim()) {
        //     errors.category_type = 'Category type is required';
        // }

        if (!metadata.category_ids || metadata.category_ids.length === 0) {
            errors.category_id = 'Please select at least one category';
        }

        if (formFields.length === 0) {
            errors.fields = 'Add at least one form field';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error('Please fix the errors before saving');
            return;
        }

        setSubmitting(true);
        try {
            const resolvedShopId = shopId || contextShopId;
            if (!resolvedShopId) {
                toast.error('Shop not loaded. Please refresh the page and try again.');
                return;
            }

            const payload: CreateCategoryFormPayload = {
                name: metadata.name,
                description: formFields,
                active: metadata.active ? 1 : 0,
                shop_id: resolvedShopId,
                category_ids: metadata.category_ids,
                category_type: ''
            };

            if (isEditMode && formId) {
                await updateCategoryFormMutation.mutateAsync({ id: formId, payload });
                toast.success('Defect form builder updated successfully');
            } else {
                await createCategoryFormMutation.mutateAsync(payload);
                toast.success('Defect form builder created successfully');
            }

            navigate('/dashboard/shop-defect-form');
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error.message || 'Unknown error';

            if (errorMessage.includes('Unauthorized') || errorMessage.includes('own categories')) {
                toast.error('Category Authorization Error', {
                    description: 'The selected category does not belong to your shop. Please select a category you own or create a new category first.',
                });
            } else {
                toast.error(`Failed to ${isEditMode ? 'update' : 'create'} defect form builder`, {
                    description: errorMessage,
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getFieldIcon = (type: FieldType) => {
        const item = [...fieldTypes, ...layoutFields, ...presetFields].find(f => f.type === type);
        return item?.icon || Type;
    };

    // Draggable toolbox item component
    const DraggableToolboxItem = ({ item }: { item: { type: FieldType; label: string; icon: any } }) => {
        const { attributes, listeners, setNodeRef, isDragging } = useSortable({
            id: `toolbox-${item.type}`,
        });

        return (
            <Button
                ref={setNodeRef}
                {...attributes}
                {...listeners}
                variant="outline"
                size="sm"
                className={`w-full justify-start text-xs cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
            >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
            </Button>
        );
    };

    // Sortable canvas field component
    const SortableFieldItem = ({ field }: { field: DefectFormField }) => {
        const FieldIcon = getFieldIcon(field.type);
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: field.id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        };

        const hasConditionalFields = field.type === 'toggle' && (field.conditionalFields || []).length > 0;

        return (
            <div
                ref={setNodeRef}
                style={style}
                className={`border rounded-lg cursor-pointer transition-all ${selectedFieldId === field.id
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                onClick={() => setSelectedFieldId(field.id)}
            >
                <div className="px-2.5 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <FieldIcon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        <p className="text-xs font-medium truncate">{field.label}</p>
                        {field.required && (
                            <span className="text-red-500 text-xs">*</span>
                        )}
                        {hasConditionalFields && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20 ml-1 flex-shrink-0">
                                {field.conditionalFields!.length} conditional
                            </Badge>
                        )}
                    </div>
                    <button
                        className="p-0.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteField(field.id);
                        }}
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>

                {/* Show conditional child fields nested under toggle */}
                {hasConditionalFields && (
                    <div className="mx-2.5 mb-2 ml-6 pl-2.5 border-l-2 border-primary/30 space-y-1">
                        {field.conditionalFields!.map((cf) => {
                            const CfIcon = getFieldIcon(cf.type);
                            return (
                                <div
                                    key={cf.id}
                                    className="flex items-center justify-between px-2 py-1 rounded bg-primary/5 border border-primary/10"
                                >
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                        <ChevronRight className="w-3 h-3 text-primary/40 flex-shrink-0" />
                                        <CfIcon className="w-3 h-3 text-primary/50 flex-shrink-0" />
                                        <p className="text-[11px] text-gray-600 truncate">{cf.label}</p>
                                        {cf.required && (
                                            <span className="text-red-500 text-[10px]">*</span>
                                        )}
                                    </div>
                                    <button
                                        className="p-0.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeConditionalField(field.id, cf.id);
                                        }}
                                    >
                                        <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="min-h-screen bg-gray-50 p-0">
                <div className="max-w-[1800px] mx-auto">
                    {/* Header */}
                    <div className="mb-4">
                        <h1 className="text-xl font-bold text-gray-900">
                            {isEditMode ? 'Edit' : 'Create'} Defect Form Builder
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Build custom intake forms for different device categories
                        </p>
                    </div>

                    {/* Device Type Tabs */}
                    {/* <div className="flex gap-2 mb-6">
                        {(['smartphone', 'tablet', 'laptop'] as const).map((type) => (
                            <Button
                                key={type}
                                variant={deviceType === type ? 'default' : 'outline'}
                                onClick={() => setDeviceType(type)}
                                className="capitalize"
                            >
                                {type}
                            </Button>
                        ))}
                    </div> */}

                    {/* Main Grid Layout */}
                    <div className="grid grid-cols-12 gap-6">
                        {/* Toolbox - Left Column */}
                        <div className="col-span-3">
                            {/* Form Metadata - Top */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold">Form Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs">
                                            Form Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g., Smartphone Intake"
                                            value={metadata.name}
                                            onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                                            className={`text-sm ${formErrors.name ? 'border-red-500' : ''}`}
                                        />
                                        {formErrors.name && (
                                            <p className="text-xs text-red-500">{formErrors.name}</p>
                                        )}
                                    </div>

                                    {/* Category Type field removed */}

                                    <div className="space-y-1.5">
                                        <Label htmlFor="category" className="text-xs">Category <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(select multiple)</span></Label>
                                        {categories.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {categories.map((cat) => {
                                                    const isSelected = metadata.category_ids.includes(cat.id);
                                                    return (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setMetadata(prev => ({
                                                                    ...prev,
                                                                    category_ids: isSelected
                                                                        ? prev.category_ids.filter(id => id !== cat.id)
                                                                        : [...prev.category_ids, cat.id]
                                                                }));
                                                            }}
                                                            className={`px-3 py-1.5 text-xs rounded-full border transition-all flex items-center gap-1 ${isSelected
                                                                ? 'bg-primary text-white border-primary shadow-sm'
                                                                : 'bg-white text-gray-700 border-gray-200 hover:border-primary/30 hover:bg-primary/5'
                                                                }`}
                                                        >
                                                            {isSelected && (
                                                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            )}
                                                            {cat.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                                No categories available. Please create a category first.
                                            </p>
                                        )}
                                        {formErrors.category_id && (
                                            <p className="text-xs text-red-500">{formErrors.category_id}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="active" className="text-xs">Active</Label>
                                        <Switch
                                            id="active"
                                            checked={metadata.active}
                                            onCheckedChange={(checked) => setMetadata({ ...metadata, active: checked })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Toolbox - Bottom */}
                            <Card className="mt-6">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold">Toolbox</CardTitle>
                                    <p className="text-xs text-gray-500">Drag fields to the canvas</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Basic Fields */}
                                    <div>
                                        <p className="text-xs font-medium text-gray-700 mb-2">Basic Fields</p>
                                        <SortableContext items={fieldTypes.map(item => `toolbox-${item.type}`)} strategy={verticalListSortingStrategy}>
                                            <div className="space-y-2">
                                                {fieldTypes.map((item) => (
                                                    <DraggableToolboxItem key={item.type} item={item} />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </div>

                                    <Separator className="my-1" />

                                    {/* Layout Fields */}
                                    <div>
                                        <p className="text-xs font-medium text-gray-700 mb-2">Layout</p>
                                        <SortableContext items={layoutFields.map(item => `toolbox-${item.type}`)} strategy={verticalListSortingStrategy}>
                                            <div className="space-y-2">
                                                {layoutFields.map((item) => (
                                                    <DraggableToolboxItem key={item.type} item={item} />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </div>

                                    <Separator className="my-1" />

                                    {/* Presets */}
                                    <div>
                                        <p className="text-xs font-medium text-gray-700 mb-2">Pre-sets</p>
                                        <SortableContext items={presetFields.map(item => `toolbox-${item.type}`)} strategy={verticalListSortingStrategy}>
                                            <div className="space-y-2">
                                                {presetFields.map((item) => (
                                                    <DraggableToolboxItem key={item.type} item={item} />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Form Canvas - Middle Column */}
                        <div className="col-span-5">
                            <Card className="h-full">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold">
                                        Form Canvas
                                        {deviceType && (
                                            <Badge variant="outline" className="ml-2 capitalize">{deviceType}</Badge>
                                        )}
                                    </CardTitle>
                                    <p className="text-xs text-gray-500">
                                        {formFields.length} field{formFields.length !== 1 ? 's' : ''} added
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {formErrors.fields && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                            {formErrors.fields}
                                        </div>
                                    )}

                                    {formFields.length === 0 ? (
                                        <div className="text-center py-16 text-gray-400">
                                            <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Add fields from the toolbox</p>
                                        </div>
                                    ) : (
                                        <SortableContext items={formFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                            <div className="space-y-2">
                                                {formFields.map((field) => (
                                                    <SortableFieldItem key={field.id} field={field} />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Field Editor & Preview - Right Column */}
                        <div className="col-span-4 space-y-6">
                            {/* Field Editor */}
                            {selectedField ? (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {(() => {
                                                    const FieldIcon = getFieldIcon(selectedField.type);
                                                    return <FieldIcon className="w-4 h-4 text-primary" />;
                                                })()}
                                                <CardTitle className="text-sm font-semibold">Edit Field</CardTitle>
                                                <Badge variant="outline" className="text-xs capitalize bg-primary/10 text-primary border-primary/20">
                                                    {selectedField.type}
                                                </Badge>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedFieldId(null)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2.5 pt-0">
                                        {/* Label */}
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-600">Label</Label>
                                            <Input
                                                value={selectedField.label}
                                                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                                className="text-sm h-8"
                                            />
                                        </div>

                                        {/* Placeholder - text & textarea */}
                                        {(selectedField.type === 'text' || selectedField.type === 'textarea') && (
                                            <div className="space-y-1">
                                                <Label className="text-xs text-gray-600">Placeholder</Label>
                                                <Input
                                                    value={selectedField.placeholder || ''}
                                                    onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                                    className="text-sm h-8"
                                                    placeholder="Enter placeholder text"
                                                />
                                            </div>
                                        )}

                                        {/* Options - dropdown */}
                                        {selectedField.type === 'dropdown' && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs text-gray-600">Options</Label>
                                                    <span className="text-[10px] text-gray-400">{(selectedField.options || []).length} options</span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    {(selectedField.options || []).map((opt, idx) => (
                                                        <div key={idx} className="flex items-center gap-1.5">
                                                            <span className="text-[10px] text-gray-400 w-4 text-center flex-shrink-0">{idx + 1}</span>
                                                            <Input
                                                                value={opt}
                                                                onChange={(e) => {
                                                                    const newOptions = [...(selectedField.options || [])];
                                                                    newOptions[idx] = e.target.value;
                                                                    updateField(selectedField.id, { options: newOptions });
                                                                }}
                                                                className="text-xs h-7 flex-1"
                                                                placeholder={`Option ${idx + 1}`}
                                                            />
                                                            <button
                                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                                                onClick={() => {
                                                                    const newOptions = (selectedField.options || []).filter((_, i) => i !== idx);
                                                                    updateField(selectedField.id, { options: newOptions });
                                                                }}
                                                                disabled={(selectedField.options || []).length <= 1}
                                                                title="Remove option"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full text-xs h-7 gap-1"
                                                    onClick={() => {
                                                        const newOptions = [...(selectedField.options || []), `Option ${(selectedField.options || []).length + 1}`];
                                                        updateField(selectedField.id, { options: newOptions });
                                                    }}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Add Option
                                                </Button>
                                            </div>
                                        )}

                                        {/* Default Value - toggle */}
                                        {selectedField.type === 'toggle' && (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs text-gray-600">Default</Label>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs text-gray-400">{selectedField.defaultValue ? 'On' : 'Off'}</span>
                                                        <Switch
                                                            checked={Boolean(selectedField.defaultValue)}
                                                            onCheckedChange={(checked) => {
                                                                updateField(selectedField.id, { defaultValue: checked });
                                                                // Keep preview in sync with default
                                                                setTogglePreviewStates(prev => ({ ...prev, [selectedField.id]: checked }));
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Conditional Fields Section */}
                                                <Separator className="my-1" />
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs text-gray-600 font-semibold">Conditional Fields</Label>
                                                        <span className="text-[10px] text-gray-400">Shown when enabled</span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 -mt-1">
                                                        These fields appear only when this toggle is turned ON.
                                                    </p>

                                                    {/* Existing conditional fields */}
                                                    {(selectedField.conditionalFields || []).map((cf, idx) => (
                                                        <div key={cf.id} className="border border-dashed border-primary/20 rounded-lg p-2 bg-primary/5 space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-medium text-primary">Field {idx + 1} ({cf.type})</span>
                                                                <button
                                                                    className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                                                                    onClick={() => removeConditionalField(selectedField.id, cf.id)}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            <Input
                                                                value={cf.label}
                                                                onChange={(e) => updateConditionalField(selectedField.id, cf.id, { label: e.target.value })}
                                                                className="text-xs h-7"
                                                                placeholder="Field label"
                                                            />
                                                            {(cf.type === 'text' || cf.type === 'textarea') && (
                                                                <Input
                                                                    value={cf.placeholder || ''}
                                                                    onChange={(e) => updateConditionalField(selectedField.id, cf.id, { placeholder: e.target.value })}
                                                                    className="text-xs h-7"
                                                                    placeholder="Placeholder text"
                                                                />
                                                            )}
                                                            {cf.type === 'dropdown' && (
                                                                <textarea
                                                                    value={(cf.options || []).join('\n')}
                                                                    onChange={(e) => updateConditionalField(selectedField.id, cf.id, {
                                                                        options: e.target.value.split('\n').filter(o => o.trim())
                                                                    })}
                                                                    className="w-full p-1.5 text-xs border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                                                    rows={2}
                                                                    placeholder="Options (one per line)"
                                                                />
                                                            )}
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-[10px] text-gray-500">Required</Label>
                                                                <Switch
                                                                    checked={cf.required}
                                                                    onCheckedChange={(checked) => updateConditionalField(selectedField.id, cf.id, { required: checked })}
                                                                    className="scale-75"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Add conditional field button */}
                                                    <div className="flex flex-wrap gap-1">
                                                        {[
                                                            { type: 'text' as FieldType, label: 'Text', icon: Type },
                                                            { type: 'textarea' as FieldType, label: 'Area', icon: AlignLeft },
                                                            { type: 'dropdown' as FieldType, label: 'Select', icon: ChevronDown },
                                                            { type: 'checkbox' as FieldType, label: 'Check', icon: CheckSquare },
                                                            { type: 'date' as FieldType, label: 'Date', icon: Calendar },
                                                        ].map(item => (
                                                            <Button
                                                                key={item.type}
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-[10px] h-6 px-2 gap-1"
                                                                onClick={() => addConditionalField(selectedField.id, item.type)}
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                                {item.label}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* Settings toggles */}
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs text-gray-600">Required</Label>
                                            <Switch
                                                checked={selectedField.required}
                                                onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs text-gray-600">Show on Receipt</Label>
                                            <Switch
                                                checked={selectedField.showOnReceipt || false}
                                                onCheckedChange={(checked) => updateField(selectedField.id, { showOnReceipt: checked })}
                                            />
                                        </div>

                                        {/* Delete */}
                                        <button
                                            className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded py-1.5 transition-colors flex items-center justify-center gap-1"
                                            onClick={() => deleteField(selectedField.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="py-8 text-center">
                                        <div className="text-gray-400 space-y-2">
                                            <Type className="w-8 h-8 mx-auto opacity-40" />
                                            <p className="text-sm font-medium">No Field Selected</p>
                                            <p className="text-xs">Click a field on the canvas to edit its properties</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Live Preview */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-semibold">Live Preview</CardTitle>
                                        <Badge variant="secondary" className="text-xs">
                                            {formFields.length} field{formFields.length !== 1 ? 's' : ''}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
                                        {/* Header */}
                                        <div className="bg-gradient-to-r from-primary to-primary/90 text-white p-4">
                                            <h3 className="font-semibold text-base">{metadata.name || 'Form Name'}</h3>
                                            <p className="text-xs opacity-80 mt-0.5">
                                                {metadata.category_ids.length > 0
                                                    ? metadata.category_ids.map(cid => categories.find(c => c.id === cid)?.name).filter(Boolean).join(', ')
                                                    : 'Select categories'}
                                            </p>
                                        </div>

                                        {/* Fields */}
                                        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto bg-white">
                                            {formFields.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <Plus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                    <p className="text-xs text-gray-400">No fields added yet</p>
                                                    <p className="text-xs text-gray-300 mt-1">Add fields from the toolbox</p>
                                                </div>
                                            ) : (
                                                formFields.map((field) => (
                                                    <div
                                                        key={field.id}
                                                        className={`space-y-1.5 transition-all ${selectedFieldId === field.id ? 'ring-2 ring-primary/30 rounded-lg p-2 -m-2 bg-primary/5' : ''
                                                            }`}
                                                    >
                                                        {/* Generic label — skip for layout-only fields */}
                                                        {field.type !== 'separator' && field.type !== 'title' && field.type !== 'description' && (
                                                            <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                                                {field.label}
                                                                {field.required && <span className="text-red-500">*</span>}
                                                            </label>
                                                        )}

                                                        {/* Text Input */}
                                                        {field.type === 'text' && (
                                                            <div className="border border-gray-200 rounded-lg p-2.5 text-xs text-gray-400 bg-gray-50">
                                                                {field.placeholder || 'Enter text...'}
                                                            </div>
                                                        )}

                                                        {/* Textarea */}
                                                        {field.type === 'textarea' && (
                                                            <div className="border border-gray-200 rounded-lg p-2.5 text-xs text-gray-400 bg-gray-50 min-h-[60px]">
                                                                {field.placeholder || 'Enter details...'}
                                                            </div>
                                                        )}

                                                        {/* Dropdown */}
                                                        {field.type === 'dropdown' && (
                                                            <div className="border border-gray-200 rounded-lg p-2.5 text-xs flex items-center justify-between bg-gray-50">
                                                                <span className="text-gray-400">Select an option...</span>
                                                                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                                            </div>
                                                        )}

                                                        {/* Title */}
                                                        {field.type === 'title' && (
                                                            <h4 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-1">
                                                                {field.label}
                                                            </h4>
                                                        )}

                                                        {/* Description */}
                                                        {field.type === 'description' && (
                                                            <p className="text-xs text-gray-500 leading-relaxed">
                                                                {field.label}
                                                            </p>
                                                        )}

                                                        {/* Separator */}
                                                        {field.type === 'separator' && (
                                                            <Separator className="my-1" />
                                                        )}

                                                        {/* Toggle */}
                                                        {field.type === 'toggle' && (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                                                                    <Switch
                                                                        checked={togglePreviewStates[field.id] ?? Boolean(field.defaultValue)}
                                                                        onCheckedChange={(checked) => setTogglePreviewStates(prev => ({ ...prev, [field.id]: checked }))}
                                                                        className="scale-90"
                                                                    />
                                                                    <span className="text-xs text-gray-500">
                                                                        {(togglePreviewStates[field.id] ?? Boolean(field.defaultValue)) ? 'Yes' : 'No'}
                                                                    </span>
                                                                </div>

                                                                {/* Conditional child fields – shown when toggle is ON */}
                                                                {(togglePreviewStates[field.id] ?? Boolean(field.defaultValue)) && (field.conditionalFields || []).length > 0 && (
                                                                    <div className="ml-4 pl-3 border-l-2 border-primary/30 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                                        {(field.conditionalFields || []).map(cf => (
                                                                            <div key={cf.id} className="space-y-1.5">
                                                                                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                                                                    <ChevronRight className="w-3 h-3 text-primary/40" />
                                                                                    {cf.label}
                                                                                    {cf.required && <span className="text-red-500">*</span>}
                                                                                </label>

                                                                                {cf.type === 'text' && (
                                                                                    <div className="border border-gray-200 rounded-lg p-2 text-xs text-gray-400 bg-gray-50">
                                                                                        {cf.placeholder || 'Enter text...'}
                                                                                    </div>
                                                                                )}
                                                                                {cf.type === 'textarea' && (
                                                                                    <div className="border border-gray-200 rounded-lg p-2 text-xs text-gray-400 bg-gray-50 min-h-[48px]">
                                                                                        {cf.placeholder || 'Enter details...'}
                                                                                    </div>
                                                                                )}
                                                                                {cf.type === 'dropdown' && (
                                                                                    <div className="border border-gray-200 rounded-lg p-2 text-xs flex items-center justify-between bg-gray-50">
                                                                                        <span className="text-gray-400">Select an option...</span>
                                                                                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                                                                    </div>
                                                                                )}
                                                                                {cf.type === 'checkbox' && (
                                                                                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                                                        <div className="w-3.5 h-3.5 rounded border-2 border-gray-300 bg-white flex-shrink-0" />
                                                                                        <span className="text-xs text-gray-500">Check to confirm</span>
                                                                                    </div>
                                                                                )}
                                                                                {cf.type === 'date' && (
                                                                                    <input
                                                                                        type="date"
                                                                                        className="w-full border border-gray-200 rounded-lg p-2 text-xs text-gray-600 bg-gray-50 focus:outline-none"
                                                                                        disabled
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Checkbox */}
                                                        {field.type === 'checkbox' && (
                                                            <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                                                                <div className="w-4 h-4 rounded border-2 border-gray-300 bg-white flex-shrink-0" />
                                                                <span className="text-xs text-gray-500">Check to confirm</span>
                                                            </div>
                                                        )}

                                                        {/* Date Picker */}
                                                        {field.type === 'date' && (
                                                            <input
                                                                type="date"
                                                                className="w-full border border-gray-200 rounded-lg p-2.5 text-xs text-gray-600 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                                            />
                                                        )}

                                                        {/* Device Photos */}
                                                        {field.type === 'device-photos' && (
                                                            <div className="space-y-3">
                                                                {/* Upload area */}
                                                                <div
                                                                    className="border-2 border-dashed border-primary/20 rounded-lg p-4 text-center bg-primary/5 cursor-pointer hover:border-primary/40 hover:bg-primary/10 transition-colors"
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                >
                                                                    <input
                                                                        ref={fileInputRef}
                                                                        type="file"
                                                                        accept="image/*"
                                                                        multiple
                                                                        className="hidden"
                                                                        onChange={handlePhotoUpload}
                                                                    />
                                                                    <Upload className="w-6 h-6 mx-auto text-primary/40 mb-1.5" />
                                                                    <p className="text-xs font-medium text-primary">Click to upload photos</p>
                                                                    <p className="text-xs text-primary/40 mt-0.5">
                                                                        {previewPhotos.length}/6 photos uploaded
                                                                    </p>
                                                                </div>

                                                                {/* Thumbnails grid */}
                                                                {previewPhotos.length > 0 && (
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        {previewPhotos.map((photo) => (
                                                                            <div key={photo.id} className="relative group">
                                                                                <img
                                                                                    src={photo.url}
                                                                                    alt={photo.name}
                                                                                    className="w-full h-16 object-cover rounded-lg border border-gray-200"
                                                                                />
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        removePhoto(photo.id);
                                                                                    }}
                                                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                                                >
                                                                                    <X className="w-3 h-3" />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/dashboard/shop-defect-form')}
                            disabled={submitting}
                        >
                            Discard
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {submitting ? 'Saving...' : isEditMode ? 'Update Form' : 'Save Form'}
                        </Button>
                    </div>
                </div>
            </div>
        </DndContext>
    );
};

export default CreateShopCategoryFormPage;
