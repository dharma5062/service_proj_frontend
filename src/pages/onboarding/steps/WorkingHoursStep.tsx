import React from 'react';
import { OnboardingData } from '../ShopOnboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        <div className="space-y-4">
            <div className="mb-1">
                <h2 className="text-base font-bold text-gray-900 tracking-tight">Set Your Availability</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                    Configure custom working hours for each day of the week.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Main Table Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                            <div className="col-span-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Day</div>
                            <div className="col-span-7 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Business Hours</div>
                            <div className="col-span-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Status</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-100">
                            {days.map(day => (
                                <div
                                    key={day}
                                    className={cn(
                                        "grid grid-cols-12 gap-3 px-4 py-2.5 items-center transition-colors",
                                        data.workingHours[day].isOpen ? "bg-white hover:bg-gray-50/50" : "bg-gray-50/40"
                                    )}
                                >
                                    {/* Day Name */}
                                    <div className="col-span-3 flex items-center">
                                        <span className={cn(
                                            "font-semibold text-xs",
                                            data.workingHours[day].isOpen ? "text-gray-900" : "text-gray-400"
                                        )}>
                                            {day}
                                        </span>
                                    </div>

                                    {/* Opening / Closing Times */}
                                    <div className="col-span-7">
                                        {data.workingHours[day].isOpen ? (
                                            <div className="flex items-center gap-2 justify-center">
                                                <div className="relative flex-1 max-w-[120px]">
                                                    <Clock className="absolute left-2.5 top-[8px] h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                                    <Input
                                                        type="time"
                                                        value={data.workingHours[day].open}
                                                        onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                                                        className="pl-8 h-8 text-xs border-gray-200 focus:border-primary/50 focus:ring-primary/20 bg-gray-50/50"
                                                    />
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-semibold">to</span>
                                                <div className="relative flex-1 max-w-[120px]">
                                                    <Clock className="absolute left-2.5 top-[8px] h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                                    <Input
                                                        type="time"
                                                        value={data.workingHours[day].close}
                                                        onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                                                        className="pl-8 h-8 text-xs border-gray-200 focus:border-primary/50 focus:ring-primary/20 bg-gray-50/50"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-1">
                                                <span className="text-xs text-gray-400 font-medium italic">Closed</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Badge Toggle */}
                                    <div className="col-span-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleDayToggle(day)}
                                            className={cn(
                                                "text-[10px] px-2.5 py-0.5 rounded-full border transition-all font-bold flex items-center gap-1 shadow-sm cursor-pointer",
                                                data.workingHours[day].isOpen 
                                                    ? "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100/60" 
                                                    : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
                                            )}
                                        >
                                            <span className={cn("w-1.5 h-1.5 rounded-full", data.workingHours[day].isOpen ? "bg-emerald-500 animate-pulse" : "bg-gray-300")} />
                                            {data.workingHours[day].isOpen ? "Open" : "Closed"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Availability Dashboard</h3>
                            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                                <Clock className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="space-y-2.5 mb-4">
                            {days.map(day => (
                                <div key={day} className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-[10px] font-semibold w-7",
                                        data.workingHours[day].isOpen ? "text-gray-700" : "text-gray-400"
                                    )}>
                                        {day.substring(0, 3)}
                                    </span>
                                    <div className="flex-1 bg-gray-50 h-1.5 rounded-full overflow-hidden border border-gray-100/50">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-300",
                                                data.workingHours[day].isOpen ? "bg-gradient-to-r from-primary to-blue-500" : "bg-gray-200/50"
                                            )}
                                            style={{ width: `${getBarWidth(day)}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-gray-400 w-10 text-right">
                                        {data.workingHours[day].isOpen ? formatTime(data.workingHours[day].open).split(' ')[0] : ''}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Summary Card */}
                        <div className="pt-3.5 border-t border-gray-100">
                            <div className="flex items-start gap-2 p-2.5 bg-primary/5 rounded-lg border border-primary/10">
                                <Info className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-primary mb-0.5 uppercase tracking-wide">Summary</p>
                                    <p className="text-[11px] text-primary/80 leading-relaxed font-medium">
                                        Active for <span className="font-bold text-primary">{calculateHours()} hours</span> per week.
                                        {days.filter(d => !data.workingHours[d].isOpen).length > 0 && (
                                            <span className="block mt-0.5 text-primary/60">
                                                {days.filter(d => !data.workingHours[d].isOpen).length} days marked closed.
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="h-9 text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onBack}
                        className="h-9 text-xs font-semibold border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={onNext}
                        className="h-9 bg-primary hover:bg-primary/95 text-white font-semibold text-xs px-5 shadow-sm shadow-primary/10 transition-all flex items-center gap-1"
                    >
                        Next Step <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default WorkingHoursStep;
