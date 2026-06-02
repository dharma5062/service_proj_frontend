import React, { useState, useEffect } from 'react';
import { OnboardingData } from '../ShopOnboarding';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useProductCategoriesApi, ProductCategory } from '@/pages/serviceAPI/ProductCategoriesAPI';
import { useBusinessTypesApi, BusinessType } from '@/pages/serviceAPI/BusinessTypesAPI';

interface CategoriesStepProps {
    data: OnboardingData;
    updateData: (data: Partial<OnboardingData>) => void;
    onNext: () => void;
    onBack: () => void;
}

interface BreadcrumbItem {
    id: number | null;
    name: string;
}

const CategoriesStep: React.FC<CategoriesStepProps> = ({ data, updateData, onNext, onBack }) => {
    const [currentCategories, setCurrentCategories] = useState<ProductCategory[]>([]);
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: 'All Categories' }]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(data.selectedCategories);
    const [businessType, setBusinessType] = useState<BusinessType | null>(null);

    const { useGetProductCategories } = useProductCategoriesApi();
    const { useGetBusinessTypes } = useBusinessTypesApi();
    const { data: allCategories = [], isLoading: categoriesLoading } = useGetProductCategories();
    const { data: businessTypes = [], isLoading: businessTypesLoading } = useGetBusinessTypes();
    const loading = categoriesLoading || businessTypesLoading;

    // Derive business type and filtered categories whenever query data or businessTypeId changes
    useEffect(() => {
        if (!data.businessTypeId || businessTypes.length === 0 || allCategories.length === 0) return;

        const selectedBT = businessTypes.find(bt => bt.id === data.businessTypeId);
        if (!selectedBT) {
            toast.error('Business type not found');
            return;
        }
        setBusinessType(selectedBT);

        const filteredCategories = filterCategoriesByBusinessType(allCategories, selectedBT.category_id);
        const rootCategories = filteredCategories.filter(cat => cat.parent_id === null || cat.id === selectedBT.category_id);
        setCurrentCategories(rootCategories);
    }, [data.businessTypeId, businessTypes, allCategories]);

    // Filter categories to only include the business type's category and its children
    const filterCategoriesByBusinessType = (allCats: ProductCategory[], categoryId: number): ProductCategory[] => {
        const targetCategory = findCategoryById(allCats, categoryId);
        if (!targetCategory) return [];
        return [targetCategory];
    };

    const findCategoryById = (categoryList: ProductCategory[], id: number): ProductCategory | null => {
        for (const category of categoryList) {
            if (category.id === id) return category;
            if (category.children && category.children.length > 0) {
                const found = findCategoryById(category.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const handleCategoryClick = (category: ProductCategory) => {
        // Only allow navigation if we're at the root level (breadcrumb length = 1)
        if (breadcrumb.length === 1 && category.children && category.children.length > 0) {
            // Navigate into direct subcategories
            setBreadcrumb([...breadcrumb, { id: category.id, name: category.name }]);
            setCurrentCategories(category.children);
        } else {
            // At subcategory level (level 2) - toggle selection
            toggleCategorySelection(category.id);
        }
    };

    const toggleCategorySelection = (categoryId: number) => {
        const newSelected = selectedCategoryIds.includes(categoryId)
            ? selectedCategoryIds.filter(id => id !== categoryId)
            : [...selectedCategoryIds, categoryId];

        setSelectedCategoryIds(newSelected);
        updateData({ selectedCategories: newSelected });
    };

    const handleBreadcrumbClick = (index: number) => {
        const newBreadcrumb = breadcrumb.slice(0, index + 1);
        const targetId = newBreadcrumb[newBreadcrumb.length - 1].id;

        setBreadcrumb(newBreadcrumb);

        if (targetId === null) {
            // Back to root – re-derive from query data
            if (businessType) {
                const filteredCategories = filterCategoriesByBusinessType(allCategories, businessType.category_id);
                const rootCategories = filteredCategories.filter(cat => cat.parent_id === null || cat.id === businessType.category_id);
                setCurrentCategories(rootCategories);
            }
        } else {
            const targetCategory = findCategoryById(allCategories, targetId);
            if (targetCategory && targetCategory.children) {
                setCurrentCategories(targetCategory.children);
            }
        }
    };

    const handleNext = () => {
        if (selectedCategoryIds.length === 0) {
            toast.error('Please select at least one service category');
            return;
        }
        onNext();
    };

    const isSelectableCategory = () => {
        // At root level (breadcrumb length = 1): NOT selectable, only expandable
        // At subcategory level (breadcrumb length = 2): ALL are selectable
        return breadcrumb.length === 2;
    };

    return (
        <div className="space-y-4">
            <div className="mb-2">
                <h2 className="text-base font-bold text-gray-900 tracking-tight">
                    {businessType ? `Select ${businessType.category?.name || ''} Services` : 'What services do you offer?'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                    {businessType
                        ? `Choose specific ${(businessType.category?.name || '').toLowerCase()} services for your ${businessType.name} business`
                        : 'Select the main categories for your shop'
                    }
                </p>
            </div>

            {/* Breadcrumb Navigation & Selection Count */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-gray-50/50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-xs">
                    {breadcrumb.map((crumb, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                            <button
                                onClick={() => handleBreadcrumbClick(index)}
                                className={cn(
                                    "font-semibold transition-colors hover:text-primary flex items-center gap-1",
                                    index === breadcrumb.length - 1 ? "text-primary" : "text-gray-500"
                                )}
                            >
                                {index === 0 ? <Home className="h-3.5 w-3.5" /> : crumb.name}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                {selectedCategoryIds.length > 0 && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full shadow-sm">
                        {selectedCategoryIds.length} {selectedCategoryIds.length === 1 ? 'service' : 'services'} selected
                    </span>
                )}
            </div>

            {/* Categories Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : currentCategories.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-xs text-gray-400 font-semibold">No categories found</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {currentCategories.map((category) => {
                        const isSelectable = isSelectableCategory();
                        const isSelected = selectedCategoryIds.includes(category.id);
                        const hasChildren = category.children && category.children.length > 0;
                        const canExpand = breadcrumb.length === 1 && hasChildren;

                        return (
                            <div
                                key={category.id}
                                onClick={() => handleCategoryClick(category)}
                                className={cn(
                                    "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer h-[110px] select-none shadow-sm hover:scale-[1.01] active:scale-[0.99]",
                                    isSelected && isSelectable
                                        ? "border-primary bg-primary/[0.03] ring-1 ring-primary/30"
                                        : "border-gray-100 bg-white hover:border-primary/40 hover:bg-gray-50/50"
                                )}
                            >
                                {/* Category Image */}
                                {category.image_url && (
                                    <div className="w-11 h-11 rounded-lg overflow-hidden mb-2 bg-gray-50 border border-gray-100 flex-shrink-0">
                                        <img
                                            src={category.image_url}
                                            alt={category.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Category Name */}
                                <span className={cn(
                                    "font-bold text-xs text-center line-clamp-2 px-1",
                                    isSelected && isSelectable ? "text-primary" : "text-gray-700"
                                )}>
                                    {category.name}
                                </span>

                                {/* Indicator for expandable categories (only at root level) */}
                                {canExpand && (
                                    <ChevronRight className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-gray-400" />
                                )}

                                {/* Selection Checkmark (for subcategories at level 2) */}
                                {isSelected && isSelectable && (
                                    <div className="absolute top-1.5 right-1.5 bg-primary rounded-full p-0.5 shadow-sm">
                                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="text-center pt-2">
                <p className="text-[11px] text-gray-400">
                    Don't see your category? <a href="#" className="text-primary font-bold hover:underline transition-colors">Request New Category</a>
                </p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="h-9 text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
                <Button
                    size="sm"
                    onClick={handleNext}
                    className="h-9 bg-primary hover:bg-primary/95 text-white font-semibold text-xs px-5 shadow-sm shadow-primary/10 transition-all flex items-center gap-1"
                >
                    Next Step <ArrowRight className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
};

export default CategoriesStep;
