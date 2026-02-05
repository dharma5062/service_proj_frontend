import React from 'react';
import { OnboardingData } from '../ShopOnboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkingHoursStepProps {
    data: OnboardingData;
    updateData: (data: Partial<OnboardingData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WorkingHoursStep: React.FC<WorkingHoursStepProps> = ({ data, updateData, onNext, onBack }) => {

    const handleDayToggle = (day: string) => {
        const newHours = { ...data.workingHours };
        newHours[day].isOpen = !newHours[day].isOpen;
        updateData({ workingHours: newHours });
    };

    const handleTimeChange = (day: string, type: 'open' | 'close', value: string) => {
        const newHours = { ...data.workingHours };
        if (type === 'open') newHours[day].open = value;
        else newHours[day].close = value;
        updateData({ workingHours: newHours });
    };

    const formatTime = (time: string) => {
        if (!time) return '--:--';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes.padStart(2, '0')} ${ampm}`;
    };

    const calculateHours = () => {
        let totalHours = 0;
        days.forEach(day => {
            if (data.workingHours[day].isOpen) {
                const [openH, openM] = data.workingHours[day].open.split(':').map(Number);
                const [closeH, closeM] = data.workingHours[day].close.split(':').map(Number);
                const hours = (closeH * 60 + closeM - openH * 60 - openM) / 60;
                totalHours += hours;
            }
        });
        return Math.round(totalHours);
    };

    const getBarWidth = (day: string) => {
        if (!data.workingHours[day].isOpen) return 0;
        const [openH, openM] = data.workingHours[day].open.split(':').map(Number);
        const [closeH, closeM] = data.workingHours[day].close.split(':').map(Number);
        const totalMinutes = (closeH * 60 + closeM - openH * 60 - openM);
        return Math.min((totalMinutes / 600) * 100, 100); // Max 10 hours = 100%
    };

    return (
        <div className="space-y-3">
            <div className="mb-3">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Set Your Availability</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Configure custom working hours for each day of the week.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Main Table Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
                            <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Day</div>
                            <div className="col-span-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Opening Time</div>
                            <div className="col-span-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Closing Time</div>
                            <div className="col-span-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-100">
                            {days.map(day => (
                                <div
                                    key={day}
                                    className={cn(
                                        "grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors",
                                        data.workingHours[day].isOpen ? "bg-white hover:bg-gray-50" : "bg-gray-50/50"
                                    )}
                                >
                                    {/* Day Name */}
                                    <div className="col-span-3">
                                        <span className={cn(
                                            "font-medium text-sm",
                                            data.workingHours[day].isOpen ? "text-gray-900" : "text-gray-400"
                                        )}>
                                            {day}
                                        </span>
                                    </div>

                                    {/* Opening Time */}
                                    <div className="col-span-4">
                                        {data.workingHours[day].isOpen ? (
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                <Input
                                                    type="time"
                                                    value={data.workingHours[day].open}
                                                    onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                                                    className="pl-9 h-9 text-sm border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">Closed</span>
                                        )}
                                    </div>

                                    {/* Closing Time */}
                                    <div className="col-span-4">
                                        {data.workingHours[day].isOpen ? (
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                <Input
                                                    type="time"
                                                    value={data.workingHours[day].close}
                                                    onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                                                    className="pl-9 h-9 text-sm border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">Closed</span>
                                        )}
                                    </div>

                                    {/* Status Checkbox */}
                                    <div className="col-span-1 flex justify-center">
                                        <Checkbox
                                            checked={data.workingHours[day].isOpen}
                                            onCheckedChange={() => handleDayToggle(day)}
                                            className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Preview</h3>
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-600">
                                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                                    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" strokeWidth="2" />
                                </svg>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="space-y-3 mb-6">
                            {days.map(day => (
                                <div key={day} className="flex items-center gap-3">
                                    <span className={cn(
                                        "text-xs font-medium w-8",
                                        data.workingHours[day].isOpen ? "text-gray-700" : "text-gray-400"
                                    )}>
                                        {day.substring(0, 3)}
                                    </span>
                                    <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-300",
                                                data.workingHours[day].isOpen ? "bg-blue-400" : "bg-gray-200"
                                            )}
                                            style={{ width: `${getBarWidth(day)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500 w-12 text-right">
                                        {data.workingHours[day].isOpen ? formatTime(data.workingHours[day].open).split(' ')[0] : ''}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-blue-900 mb-1">Summary</p>
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        Your shop will be visible as <span className="font-semibold">Open</span> for <span className="font-semibold">{calculateHours()} hours</span> per week.
                                        {days.filter(d => !data.workingHours[d].isOpen).length > 0 && (
                                            <span> {days.filter(d => !data.workingHours[d].isOpen)[0]} is marked as holiday.</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onBack}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onNext}
                        className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                    >
                        Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default WorkingHoursStep;
