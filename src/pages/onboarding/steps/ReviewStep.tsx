import React, { useState, useEffect } from 'react';
import { OnboardingData } from '../ShopOnboarding';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Check, Store, Clock, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CreateShopPayload, useShopsApi } from '@/pages/serviceAPI/ShopsAPI';
import { useProductCategoriesApi, ProductCategory } from '@/pages/serviceAPI/ProductCategoriesAPI';
import { User, useAuth } from '@/AuthContext';
import { cn } from '@/lib/utils';

interface ReviewStepProps {
    data: OnboardingData;
    onBack: () => void;
    onEditSection: (step: number) => void;
    user: User | null;
}


const ReviewStep: React.FC<ReviewStepProps> = ({ data, onBack, onEditSection, user }) => {
    const navigate = useNavigate();
    const { fetchShop } = useAuth(); // Access fetchShop to refresh context after shop creation
    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);

    const { useGetProductCategories } = useProductCategoriesApi();
    const { useCreateShop } = useShopsApi();
    const { data: allCategories = [] } = useGetProductCategories();
    const createShopMutation = useCreateShop();

    // Derive selected category details from cached categories
    useEffect(() => {
        if (data.selectedCategories.length === 0 || allCategories.length === 0) return;
        const categoryDetails = data.selectedCategories
            .map(id => findCategoryById(allCategories, id))
            .filter((cat): cat is ProductCategory => cat !== null);
        setSelectedCategories(categoryDetails);
    }, [data.selectedCategories, allCategories]);

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

    const handleComplete = async () => {
        if (!agreed) {
            toast.error('Please agree to the Terms of Service');
            return;
        }

        if (!user) {
            toast.error('You must be logged in to create a shop');
            return;
        }

        const userId = (user as any).user?.id || user.id;

        if (!userId) {
            toast.error('User ID is missing. Please log in again.');
            return;
        }

        setIsSubmitting(true);
        try {
            const descriptionData = {
                tagline: data.tagline || '',
                owner_name: data.shopOwnerName,
                phone: data.phoneNumber,
                email: data.email,
                address: data.address,
                gst_number: data.gstNumber || '',
                working_hours: data.workingHours,
                business_type_id: data.businessTypeId,
                category_ids: data.selectedCategories,
            };

            const payload: CreateShopPayload = {
                name: data.shopName,
                description: descriptionData,
                shop_owner_id: userId,
                active: true,
                image: data.shopLogo,
                business_type_id: data.businessTypeId,
                category_ids: data.selectedCategories
            };

            await createShopMutation.mutateAsync(payload);

            // ── Refresh shop context ────────────────────────────────────────────
            // After creating a shop, re-fetch the shop list so the AuthContext
            // picks up the newly created shop as the active shop.
            // Without this, the dashboard would show the previously selected
            // (potentially wrong) shop's data.
            await fetchShop();

            toast.success('Shop setup completed successfully!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to create shop', error);
            toast.error('Failed to create shop. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="mb-2">
                <h2 className="text-base font-bold text-gray-900 tracking-tight">Review & Confirm</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                    Please double-check all your information before completing the setup. You can always edit this later in settings.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Shop Profile Review */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-1.5">
                                <Store className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wide">Shop Profile</h3>
                            </div>
                            <Button variant="ghost" size="sm" className="text-primary h-auto p-0 hover:text-primary/80 font-bold text-xs" onClick={() => onEditSection(1)}>
                                Edit
                            </Button>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1.5 border-b border-gray-50">
                                <span className="text-gray-400 font-medium">Shop Name</span>
                                <span className="font-semibold text-gray-800">{data.shopName}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-gray-50">
                                <span className="text-gray-400 font-medium">Owner</span>
                                <span className="font-semibold text-gray-800">{data.shopOwnerName}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-gray-50">
                                <span className="text-gray-400 font-medium">Email</span>
                                <span className="font-semibold text-gray-800">{data.email}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-gray-50">
                                <span className="text-gray-400 font-medium">Phone</span>
                                <span className="font-semibold text-gray-800">{data.phoneNumber}</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-gray-400 font-medium">Address</span>
                                <span className="font-semibold text-gray-800 text-right max-w-[220px] truncate">{data.address || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories Review */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-1.5">
                                <LayoutGrid className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wide">Selected Services</h3>
                            </div>
                            <Button variant="ghost" size="sm" className="text-primary h-auto p-0 hover:text-primary/80 font-bold text-xs" onClick={() => onEditSection(3)}>
                                Edit
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {selectedCategories.length === 0 ? (
                                <p className="text-xs text-gray-400">Loading categories...</p>
                            ) : (
                                selectedCategories.map((category, index) => (
                                    <div key={index} className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg">
                                        {category.image_url && (
                                            <img
                                                src={category.image_url}
                                                alt={category.name}
                                                className="w-4 h-4 rounded-sm object-cover flex-shrink-0"
                                            />
                                        )}
                                        <span className="text-[10px] font-bold text-gray-700">{category.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Business Hours Review */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm lg:col-span-2">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-primary" />
                            <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wide">Business Hours</h3>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary h-auto p-0 hover:text-primary/80 font-bold text-xs" onClick={() => onEditSection(2)}>
                            Edit
                        </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100 text-xs">
                        <div className="flex flex-col gap-0.5 border-r border-gray-100 pr-2">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Weekdays (Mon-Fri)</span>
                            <span className="font-bold text-gray-800">
                                {data.workingHours['Monday'].isOpen
                                    ? `${data.workingHours['Monday'].open} - ${data.workingHours['Monday'].close}`
                                    : 'Closed'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-r border-gray-100 px-2">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Saturday</span>
                            <span className="font-bold text-gray-800">
                                {data.workingHours['Saturday'].isOpen
                                    ? `${data.workingHours['Saturday'].open} - ${data.workingHours['Saturday'].close}`
                                    : 'Closed'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5 pl-2">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Sunday</span>
                            <span className={cn("font-bold", data.workingHours['Sunday'].isOpen ? "text-gray-800" : "text-red-500")}>
                                {data.workingHours['Sunday'].isOpen
                                    ? `${data.workingHours['Sunday'].open} - ${data.workingHours['Sunday'].close}`
                                    : 'Closed'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border-t border-gray-100 pt-4 mt-6">
                <div className="flex items-start gap-2.5 mb-4">
                    <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} className="mt-0.5" />
                    <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer font-medium select-none">
                        I agree to wFixma's <a href="#" className="text-primary hover:underline font-semibold">Terms of Service</a> and <a href="#" className="text-primary hover:underline font-semibold">Privacy Policy</a>.
                        I confirm that the information provided is accurate.
                    </label>
                </div>

                <div className="flex justify-between items-center">
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
                        onClick={handleComplete}
                        disabled={isSubmitting || !agreed}
                        className="h-9 bg-primary hover:bg-primary/95 text-white font-semibold text-xs px-6 shadow-sm shadow-primary/10 transition-all flex items-center gap-1"
                    >
                        {isSubmitting ? 'Setting up...' : 'Complete Setup'}
                        {!isSubmitting && <Check className="h-3.5 w-3.5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ReviewStep;
