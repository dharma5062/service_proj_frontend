import { useState } from 'react';
import { useAuth } from '@/AuthContext';
import OnboardingHeader from './components/OnboardingHeader';
import OnboardingStepper from './components/OnboardingStepper';
import ShopDetailsStep from './steps/ShopDetailsStep';
import CategoriesStep from './steps/CategoriesStep';
import ReviewStep from './steps/ReviewStep';
import WorkingHoursStep from './steps/WorkingHoursStep';



export interface OnboardingData {
    // Shop Details
    shopName: string;
    tagline?: string; // Optional tagline/short description
    shopOwnerName: string;
    phoneNumber: string;
    email: string;
    address: string;
    gstNumber?: string;
    shopLogo?: File | null;
    shopLogoPreview?: string;

    // Working Hours
    workingHours: Record<string, { open: string; close: string; isOpen: boolean }>;

    // Business Type
    businessTypeId?: number;

    // Categories
    selectedCategories: number[]; // Array of category IDs (numbers)
}

const initialData: OnboardingData = {
    shopName: '',
    tagline: '',
    shopOwnerName: '',
    phoneNumber: '',
    email: '',
    address: '',
    gstNumber: '',
    shopLogo: null,
    shopLogoPreview: undefined,
    workingHours: {
        Monday: { open: '09:00', close: '18:00', isOpen: true },
        Tuesday: { open: '09:00', close: '18:00', isOpen: true },
        Wednesday: { open: '09:00', close: '18:00', isOpen: true },
        Thursday: { open: '09:00', close: '18:00', isOpen: true },
        Friday: { open: '09:00', close: '18:00', isOpen: true },
        Saturday: { open: '10:00', close: '16:00', isOpen: true },
        Sunday: { open: '10:00', close: '16:00', isOpen: false },
    },
    businessTypeId: undefined,
    selectedCategories: []
};

const ShopOnboarding = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<OnboardingData>(initialData);
    const { user } = useAuth(); // Get authenticated user

    const updateFormData = (data: Partial<OnboardingData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleStepClick = (step: number) => {
        if (step < currentStep) {
            setCurrentStep(step);
            window.scrollTo(0, 0);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <ShopDetailsStep
                        data={formData}
                        updateData={updateFormData}
                        onNext={handleNext}
                    />
                );
            case 2:
                return (
                    <WorkingHoursStep
                        data={formData}
                        updateData={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 3:
                return (
                    <CategoriesStep
                        data={formData}
                        updateData={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 4:
                return (
                    <ReviewStep
                        data={formData}
                        onBack={handleBack}
                        onEditSection={handleStepClick}
                        user={user}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            <OnboardingHeader />

            <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-2 py-0">
                <div className="max-w-5xl mx-auto">
                    <OnboardingStepper currentStep={currentStep} />

                    <div className="mt-0">
                        {renderStep()}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ShopOnboarding;
