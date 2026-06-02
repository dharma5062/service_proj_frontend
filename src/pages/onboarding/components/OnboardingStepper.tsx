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
        <div className="w-full py-4 select-none">
            <div className="relative flex justify-between max-w-2xl mx-auto">
                {/* Progress Bar Background */}
                <div className="absolute top-4 left-0 w-full h-[3px] bg-gray-100 rounded-full -z-10" />

                {/* Active Progress Bar */}
                <div
                    className="absolute top-4 left-0 h-[3px] bg-gradient-to-r from-primary to-blue-600 rounded-full transition-all duration-500 -z-10"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-1.5 bg-gray-50/50 px-2 rounded-lg">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                    isActive ? "border-primary bg-gradient-to-tr from-primary to-blue-600 text-white shadow-md shadow-primary/25 scale-105" :
                                        isCompleted ? "border-primary bg-white text-primary" :
                                            "border-gray-200 bg-white text-gray-400"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-4 h-4 stroke-[3px]" />
                                ) : (
                                    <Icon className="w-4 h-4" />
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] sm:text-xs font-semibold tracking-wide transition-colors duration-300",
                                    isActive ? "text-primary font-bold" :
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
