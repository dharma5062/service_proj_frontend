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
            <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Review & Confirm</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Please double-check all your information before completing the setup. You can always edit this later in settings.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Shop Profile Review */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <Store className="h-5 w-5 text-primary" />
                            <h3 className="font-bold text-gray-900">Shop Profile</h3>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary h-auto p-0 hover:text-primary/80 font-medium" onClick={() => onEditSection(1)}>
                            Edit
                        </Button>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-500">Shop Name</span>
                            <span className="font-medium text-gray-900">{data.shopName}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-500">Owner</span>
                            <span className="font-medium text-gray-900">{data.shopOwnerName}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium text-gray-900">{data.email}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-500">Phone</span>
                            <span className="font-medium text-gray-900">{data.phoneNumber}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-500">Address</span>
                            <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">{data.address || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Categories Review */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="h-5 w-5 text-primary" />
                            <h3 className="font-bold text-gray-900">Selected Services</h3>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary h-auto p-0 hover:text-primary/80 font-medium" onClick={() => onEditSection(3)}>
                            Edit
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {selectedCategories.length === 0 ? (
                            <p className="text-sm text-gray-500 col-span-2">Loading categories...</p>
                        ) : (
                            selectedCategories.map((category, index) => (
                                <div key={index} className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200 text-center">
                                    {category.image_url && (
                                        <div className="w-12 h-12 rounded-lg overflow-hidden mb-2 bg-gray-100">
                                            <img
                                                src={category.image_url}
                                                alt={category.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <span className="text-xs font-medium text-gray-900">{category.name}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Business Hours Review */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <h3 className="font-bold text-gray-900">Business Hours</h3>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary h-auto p-0 hover:text-primary/80 font-medium" onClick={() => onEditSection(2)}>
                            Edit
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Weekdays (Mon-Fri)</span>
                            <span className="font-medium text-gray-900">
                                {data.workingHours['Monday'].isOpen
                                    ? `${data.workingHours['Monday'].open} - ${data.workingHours['Monday'].close}`
                                    : 'Closed'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Saturday</span>
                            <span className="font-medium text-gray-900">
                                {data.workingHours['Saturday'].isOpen
                                    ? `${data.workingHours['Saturday'].open} - ${data.workingHours['Saturday'].close}`
                                    : 'Closed'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Sunday</span>
                            <span className="font-medium text-red-500">
                                {data.workingHours['Sunday'].isOpen
                                    ? `${data.workingHours['Sunday'].open} - ${data.workingHours['Sunday'].close}`
                                    : 'Closed'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border-t border-gray-100 pt-6">
                <div className="flex items-start gap-3 mb-6">
                    <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} className="mt-1" />
                    <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                        I agree to wService's <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                        I confirm that the information provided is accurate.
                    </label>
                </div>

                <div className="flex justify-between">
                    <Button variant="ghost" onClick={onBack} className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button
                        onClick={handleComplete}
                        disabled={isSubmitting || !agreed}
                        className="bg-primary hover:bg-primary/90 text-white min-w-[160px]"
                    >
                        {isSubmitting ? 'Setting up...' : 'Complete Setup'}
                        {!isSubmitting && <Check className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ReviewStep;
