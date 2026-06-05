import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, ImagePlus, Loader2 } from 'lucide-react';
import { useServiceReopenApi } from '@/pages/serviceAPI/ServiceReopenAPI';
import { toast } from 'sonner';

interface SubmitReopenModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    serviceId: number;
    warrantyExpiryDate?: string;
}

export const SubmitReopenModal: React.FC<SubmitReopenModalProps> = ({
    open,
    onOpenChange,
    serviceId,
    warrantyExpiryDate
}) => {
    const { useSubmitReopenRequest } = useServiceReopenApi();
    const submitMutation = useSubmitReopenRequest();

    const [reason, setReason] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setImages(prev => [...prev, ...filesArray]);
            
            // Generate previews
            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            const newPreviews = [...prev];
            URL.revokeObjectURL(newPreviews[index]); // Free memory
            newPreviews.splice(index, 1);
            return newPreviews;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            toast.error('Please provide a reason for the issue.');
            return;
        }

        const formData = new FormData();
        formData.append('reason', reason);
        images.forEach(img => {
            formData.append('images[]', img);
        });

        try {
            const res = await submitMutation.mutateAsync({ serviceId, formData });
            if (res.status) {
                toast.success('Reopen request submitted successfully!');
                setReason('');
                setImages([]);
                setPreviewUrls([]);
                onOpenChange(false);
            } else {
                toast.error(res.message || 'Failed to submit request.');
            }
        } catch (err: any) {
            toast.error(err.message || 'An error occurred.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Report Issue / Request Reopen</DialogTitle>
                    <DialogDescription>
                        {warrantyExpiryDate ? (
                            <span className="text-emerald-600 font-medium">
                                Your device is under warranty until {new Date(warrantyExpiryDate).toLocaleDateString('en-IN')}.
                            </span>
                        ) : (
                            <span>Please describe the issue you are facing with the device.</span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason / Issue Description <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="reason"
                            placeholder="Please describe what is not working..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="h-24 resize-none"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Evidence / Images (Optional)</Label>
                        <div className="flex flex-wrap gap-2">
                            {previewUrls.map((url, idx) => (
                                <div key={idx} className="relative w-16 h-16 rounded-md border overflow-hidden">
                                    <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <label className="w-16 h-16 flex flex-col items-center justify-center rounded-md border border-dashed hover:bg-gray-50 cursor-pointer">
                                <ImagePlus className="w-5 h-5 text-gray-400" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </label>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitMutation.isPending} className="bg-primary hover:bg-primary/90">
                            {submitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
