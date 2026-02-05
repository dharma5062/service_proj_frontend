import React from 'react';
import { cn } from '@/lib/utils';
import { Store, Clock, LayoutGrid, CheckCircle2, Check } from 'lucide-react';

interface OnboardingStepperProps {
    currentStep: number;
}

const steps = [
    {
        id: 1,
        label: 'Shop Details',
        icon: Store
    },
    {
        id: 2,
        label: 'Working Hours',
        icon: Clock
    },
    {
        id: 3,
        label: 'Categories',
        icon: LayoutGrid
    },
    {
        id: 4,
        label: 'Review',
        icon: CheckCircle2
    }
];

const OnboardingStepper: React.FC<OnboardingStepperProps> = ({ currentStep }) => {
    return (
        <div className="w-full py-8">
            <div className="relative flex justify-between">
                {/* Progress Bar Background */}
                <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full -z-10" />

                {/* Active Progress Bar */}
                <div
                    className="absolute top-5 left-0 h-1 bg-blue-500 rounded-full transition-all duration-500 -z-10"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                    isActive ? "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-200" :
                                        isCompleted ? "border-blue-500 bg-white text-blue-500" :
                                            "border-gray-200 bg-white text-gray-300"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <Icon className="w-5 h-5" />
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-xs font-medium transition-colors duration-300",
                                    isActive ? "text-blue-600" :
                                        isCompleted ? "text-gray-900" :
                                            "text-gray-400"
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OnboardingStepper;
