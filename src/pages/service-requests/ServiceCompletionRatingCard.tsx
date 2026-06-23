import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, Edit3, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosInstance';
import { useAuth } from '@/AuthContext';
import { useStaffPerformanceApi } from '@/pages/serviceAPI/StaffPerformanceAPI';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceCompletionRatingCardProps {
    serviceId: number;
    employeeId: number | undefined | null;
    employeeName?: string;
    totalAmount?: number;
    currency?: string;
    closedOn?: string | null;
    onRated?: () => void;
    onSkip?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STAR_LABELS: Record<number, { emoji: string; label: string; color: string }> = {
    1: { emoji: '😞', label: 'Terrible',   color: 'text-red-500' },
    2: { emoji: '😟', label: 'Poor',       color: 'text-orange-500' },
    3: { emoji: '😐', label: 'Okay',       color: 'text-amber-500' },
    4: { emoji: '😊', label: 'Good',       color: 'text-lime-500' },
    5: { emoji: '🤩', label: 'Excellent!', color: 'text-emerald-500' },
};

const formatCurrency = (amount: number, currency = 'INR') => {
    const symbol = currency === 'INR' ? '₹' : `${currency} `;
    return `${symbol}${new Intl.NumberFormat('en-IN').format(amount)}`;
};

const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
};

// ─── Star Row ─────────────────────────────────────────────────────────────────

const StarRow: React.FC<{
    value: number;
    hovered: number;
    onHover: (s: number) => void;
    onLeave: () => void;
    onClick: (s: number) => void;
    readOnly?: boolean;
}> = ({ value, hovered, onHover, onLeave, onClick, readOnly }) => {
    const active = hovered > 0 ? hovered : value;
    return (
        <div className="flex items-center justify-center gap-2" onMouseLeave={onLeave}>
            {[1, 2, 3, 4, 5].map((s) => (
                <button
                    key={s}
                    type="button"
                    disabled={readOnly}
                    onMouseEnter={() => !readOnly && onHover(s)}
                    onClick={() => !readOnly && onClick(s)}
                    className={`transition-all duration-150 focus:outline-none
                        ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'}
                    `}
                >
                    <Star
                        className={`w-9 h-9 transition-colors duration-150 ${
                            s <= active
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-200 fill-gray-200'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const ServiceCompletionRatingCard: React.FC<ServiceCompletionRatingCardProps> = ({
    serviceId,
    employeeId,
    employeeName,
    totalAmount,
    currency = 'INR',
    closedOn,
    onRated,
    onSkip,
}) => {
    const { isCustomer } = useAuth();
    const { useGetMyRating } = useStaffPerformanceApi();

    // State
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [review, setReview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [existingRating, setExistingRating] = useState<null | { rating: number; review: string | null }>(null);
    const [dismissed, setDismissed] = useState(false);

    // Fetch existing rating using TanStack Query
    const { data: existingData, isLoading: checkingExisting } = useGetMyRating(serviceId, employeeId, isCustomer);

    useEffect(() => {
        if (existingData) {
            setExistingRating({ rating: existingData.rating, review: existingData.review || '' });
            setRating(existingData.rating);
            setReview(existingData.review || '');
        }
    }, [existingData]);

    // Don't render for non-customers
    if (!isCustomer) return null;
    // Dismissed
    if (dismissed) return null;
    // Loading check
    if (checkingExisting) return null;

    const activeLabel = STAR_LABELS[hovered > 0 ? hovered : rating];

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a star rating before submitting.');
            return;
        }
        if (!employeeId) {
            toast.error('Unable to submit rating: technician information not found.');
            return;
        }
        setIsSubmitting(true);
        try {
            await axiosInstance.post('/customer-ratings-store', {
                service_id: serviceId,
                employee_id: employeeId,
                rating,
                review: review.trim() || undefined,
            });
            setExistingRating({ rating, review });
            setSubmitted(true);
            setEditMode(false);
            toast.success('Thank you for your feedback! 🌟');
            onRated?.();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to submit rating. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = () => {
        setDismissed(true);
        onSkip?.();
    };

    // ── Already Submitted Success State ───────────────────────────────────────
    if (submitted && !editMode) {
        return (
            <Dialog open={!dismissed} onOpenChange={(open) => { if (!open) handleSkip(); }}>
                <DialogContent className="p-0 border-0 overflow-hidden bg-transparent shadow-none max-w-md mx-auto [&>button]:hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Thank You for Your Feedback</DialogTitle>
                    </DialogHeader>
                    <div className="w-full">
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 text-center shadow-sm relative">
                            <button onClick={handleSkip} className="absolute top-3 right-3 text-emerald-400 hover:text-emerald-600 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                            </div>
                            <h3 className="text-base font-bold text-emerald-800 mb-1">Thank You for Your Feedback!</h3>
                            <p className="text-xs text-emerald-600 mb-3">Your review helps us improve our service quality.</p>
                            <div className="flex items-center justify-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className={`w-5 h-5 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                                ))}
                                <span className="text-xs font-bold text-gray-600 ml-1">{STAR_LABELS[rating]?.emoji} {STAR_LABELS[rating]?.label}</span>
                            </div>
                            {review && (
                                <p className="text-xs text-gray-500 italic bg-white/60 rounded-lg px-3 py-2 mt-2">" {review} "</p>
                            )}
                            <button
                                onClick={() => { setEditMode(true); setSubmitted(false); }}
                                className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors mx-auto"
                            >
                                <Edit3 className="w-3 h-3" /> Edit Review
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // ── Read-Only Existing Rating (not editing) ────────────────────────────────
    if (existingRating && !editMode) {
        return (
            <Dialog open={!dismissed} onOpenChange={(open) => { if (!open) handleSkip(); }}>
                <DialogContent className="p-0 border-0 overflow-hidden bg-transparent shadow-none max-w-md mx-auto [&>button]:hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Your Rating</DialogTitle>
                    </DialogHeader>
                    <div className="w-full">
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 shadow-sm relative">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    <span className="text-sm font-bold text-gray-800">Your Rating</span>
                                </div>
                                <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className={`w-6 h-6 ${s <= existingRating.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                                ))}
                                <span className="text-xs font-bold text-gray-600 ml-2">
                                    {STAR_LABELS[existingRating.rating]?.emoji} {STAR_LABELS[existingRating.rating]?.label}
                                </span>
                            </div>
                            {existingRating.review && (
                                <p className="text-xs text-gray-500 italic bg-white/70 rounded-lg px-3 py-2 mb-3">" {existingRating.review} "</p>
                            )}
                            <button
                                onClick={() => { setEditMode(true); }}
                                className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                            >
                                <Edit3 className="w-3 h-3" /> Edit Review
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // ── Main Rating Form ───────────────────────────────────────────────────────
    return (
        <Dialog open={!dismissed} onOpenChange={(open) => { if (!open) handleSkip(); }}>
            <DialogContent className="p-0 border-0 overflow-hidden bg-white shadow-md max-w-md mx-auto sm:rounded-2xl gap-0 [&>button]:hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>Service Completed Successfully</DialogTitle>
                </DialogHeader>
                <div className="w-full">
                    <div className="bg-white">

                        {/* Header */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-4 relative">
                            <button
                                onClick={handleSkip}
                                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                                    🎉
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white leading-tight">Service Completed Successfully</p>
                                    <p className="text-[11px] text-emerald-100 mt-0.5">Thank you for choosing us.</p>
                                </div>
                            </div>
                        </div>

                        {/* Service Info */}
                        {(employeeName || totalAmount != null || closedOn) && (
                            <div className="px-5 pt-4 pb-2 space-y-1.5 border-b border-gray-50">
                                {employeeName && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400 font-medium">Technician</span>
                                        <span className="text-xs font-bold text-gray-800">{employeeName}</span>
                                    </div>
                                )}
                                {totalAmount != null && totalAmount > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400 font-medium">Service Amount</span>
                                        <span className="text-xs font-bold text-emerald-600">{formatCurrency(totalAmount, currency)}</span>
                                    </div>
                                )}
                                {closedOn && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400 font-medium">Closed On</span>
                                        <span className="text-xs font-bold text-gray-800">{formatDate(closedOn)}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Rating Section */}
                        <div className="px-5 py-5">
                            {/* Section title */}
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center mb-4">
                                Rate Our Service
                            </p>

                            {/* Stars */}
                            <StarRow
                                value={rating}
                                hovered={hovered}
                                onHover={setHovered}
                                onLeave={() => setHovered(0)}
                                onClick={setRating}
                            />

                            {/* Label */}
                            <div className="h-7 flex items-center justify-center mt-2 mb-4">
                                {activeLabel ? (
                                    <span className={`text-sm font-bold transition-all duration-150 ${activeLabel.color}`}>
                                        {activeLabel.emoji} {activeLabel.label}
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-300 font-medium">Tap a star to rate</span>
                                )}
                            </div>

                            {/* Review Textarea */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 block">
                                    Share your experience <span className="text-gray-300 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    placeholder="e.g. Great service! Fixed my device quickly and professionally..."
                                    maxLength={500}
                                    className="w-full resize-none text-xs text-gray-700 placeholder-gray-300 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all bg-gray-50"
                                />
                                <p className="text-[10px] text-gray-300 text-right">{review.length}/500</p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-5 pb-5 flex gap-2.5">
                            {!editMode && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 h-9 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl"
                                    onClick={handleSkip}
                                    disabled={isSubmitting}
                                >
                                    Skip for now
                                </Button>
                            )}
                            {editMode && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 h-9 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl"
                                    onClick={() => { setEditMode(false); setRating(existingRating?.rating ?? 0); setReview(existingRating?.review ?? ''); }}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                size="sm"
                                className="flex-[2] h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm gap-1.5"
                                onClick={handleSubmit}
                                disabled={isSubmitting || rating === 0}
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
                                ) : (
                                    <><Star className="w-3.5 h-3.5 fill-white" /> {editMode ? 'Update Review' : 'Submit Review'}</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ServiceCompletionRatingCard;
