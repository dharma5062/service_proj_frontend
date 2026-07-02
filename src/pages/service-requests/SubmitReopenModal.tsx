import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    X,
    ImagePlus,
    Loader2,
    RefreshCw,
    AlertTriangle,
    ShieldAlert,
    Hammer,
    Cpu,
    Smartphone,
    FileText,
    HelpCircle,
    Eye
} from 'lucide-react';
import { useServiceReopenApi } from '@/pages/serviceAPI/ServiceReopenAPI';
import { toast } from 'sonner';

interface SubmitReopenModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    serviceId: number;
    warrantyExpiryDate?: string;
    supportPhone?: string;
}

const ISSUE_TYPES = [
    { id: 'Same Issue Not Resolved', label: 'Same Issue Not Resolved', icon: RefreshCw },
    { id: 'New Issue After Repair', label: 'New Issue After Repair', icon: AlertTriangle },
    { id: 'Repair Quality Problem', label: 'Repair Quality Problem', icon: ShieldAlert },
    { id: 'Physical Damage Found', label: 'Physical Damage Found', icon: Hammer },
    { id: 'Spare Part Issue', label: 'Spare Part Issue', icon: Cpu },
    { id: 'Device Not Working Properly', label: 'Device Not Working Properly', icon: Smartphone },
    { id: 'Warranty Service Request', label: 'Warranty Service Request', icon: FileText },
    { id: 'Other Issues', label: 'Other Issues', icon: HelpCircle },
];

// Helper: Format bytes
export const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper: Compress and convert image to WEBP File, ensuring file size is under 1MB
const compressImageToWebP = (file: File, initialMaxWidth: number = 1000, initialQuality: number = 0.7, maxSizeMB: number = 1): Promise<{ preview: string; file: File, originalSize: number, newSize: number }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to Bytes

                const attemptCompression = (quality: number, maxWidth: number) => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Canvas context not available'));
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Canvas to Blob failed'));
                            return;
                        }
                        
                        // If file is > max size and we can still reduce quality/size, try again
                        if (blob.size > maxSizeBytes && quality > 0.1) {
                            attemptCompression(quality - 0.15, maxWidth * 0.8);
                        } else {
                            const dataUrl = canvas.toDataURL('image/webp', quality);
                            const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                            const webpFile = new File([blob], newFileName, { type: 'image/webp' });
                            resolve({ preview: dataUrl, file: webpFile, originalSize: file.size, newSize: blob.size });
                        }
                    }, 'image/webp', quality);
                };

                attemptCompression(initialQuality, initialMaxWidth);
            };
            img.onerror = (err) => reject(err);
            img.src = event.target?.result as string;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
};

export const SubmitReopenModal: React.FC<SubmitReopenModalProps> = ({
    open,
    onOpenChange,
    serviceId,
    supportPhone
}) => {
    const { useSubmitReopenRequest } = useServiceReopenApi();
    const submitMutation = useSubmitReopenRequest();

    const [selectedIssueType, setSelectedIssueType] = useState<string>('');
    const [reason, setReason] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            
            const loadingToastId = toast.loading('Compressing photos...');
            try {
                const promises = filesArray.map(file => {
                    return compressImageToWebP(file, 800, 0.7);
                });

                const compressedResults = await Promise.all(promises);
                const compressedFiles = compressedResults.map(res => res.file);
                const compressedPreviews = compressedResults.map(res => res.preview);

                const totalOriginal = compressedResults.reduce((sum, res) => sum + res.originalSize, 0);
                const totalNew = compressedResults.reduce((sum, res) => sum + res.newSize, 0);

                setImages(prev => [...prev, ...compressedFiles]);
                setPreviewUrls(prev => [...prev, ...compressedPreviews]);

                const origStr = formatBytes(totalOriginal);
                const newStr = formatBytes(totalNew);
                toast.success(`Photos compressed from ${origStr} to ${newStr}`, { id: loadingToastId });
            } catch (error) {
                console.error('Error compressing photos:', error);
                toast.error('Failed to compress some photos.', { id: loadingToastId });
            }
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

        if (!selectedIssueType) {
            toast.error('Please select an issue type.');
            return;
        }

        if (!reason.trim()) {
            toast.error('Please provide a reason for the issue.');
            return;
        }

        const formData = new FormData();
        formData.append('issue_type', selectedIssueType);
        formData.append('reason', reason);
        images.forEach(img => {
            formData.append('images[]', img);
        });

        try {
            const res = await submitMutation.mutateAsync({ serviceId, formData });
            if (res.status) {
                toast.success('Reopen request submitted successfully!');
                setReason('');
                setSelectedIssueType('');
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
            <DialogContent className="sm:max-w-[480px] p-4 gap-3">
                <DialogHeader className="pb-2 border-b">
                    <div className="flex items-center gap-2.5">
                        <span className="text-2xl select-none">💬</span>
                        <div className="text-left">
                            <DialogTitle className="text-sm font-bold text-gray-900">Report an Issue</DialogTitle>
                            <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                                Tell us what happened and our team will resolve it.
                            </p>
                        </div>
                    </div>
                    {supportPhone && (
                        <div className="text-[11px] text-blue-600 bg-blue-50/60 border border-blue-100 rounded-md px-2 py-0.5 font-medium mt-1.5 flex items-center gap-1 w-fit">
                            <span>📞 Support: <strong className="font-semibold text-blue-700">{supportPhone}</strong></span>
                        </div>
                    )}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-2.5">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Select Issue Type <span className="text-red-500">*</span></Label>
                        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 max-h-[140px] overflow-y-auto p-1 border rounded-md">
                            {ISSUE_TYPES.map((type) => {
                                const IconComponent = type.icon;
                                const isSelected = selectedIssueType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setSelectedIssueType(type.id)}
                                        className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all hover:bg-slate-50 ${isSelected
                                                ? 'border-blue-600 bg-blue-50/50 text-blue-600 ring-1 ring-blue-600'
                                                : 'border-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <IconComponent className={`w-3.5 h-3.5 mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <span className="text-[9px] font-medium leading-tight">{type.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {selectedIssueType && (
                        <div className="text-[10px] text-blue-600 bg-blue-50/70 border border-blue-100 rounded px-2 py-1 font-medium flex items-center gap-1 animate-fadeIn">
                            <span className="w-1 h-1 rounded-full bg-blue-600 animate-pulse" />
                            You selected: <span className="font-semibold underline">{selectedIssueType}</span>
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label htmlFor="reason" className="text-[11px] font-semibold">Description <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="reason"
                            placeholder="Please describe what is not working..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="h-16 text-xs resize-none"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Proff Images</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {previewUrls.map((url, idx) => (
                                <div key={idx} className="relative group w-11 h-11 rounded-md border overflow-hidden flex-shrink-0">
                                    <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                    
                                    <div 
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        onClick={() => setPreviewImage(url)}
                                    >
                                        <Eye className="w-3.5 h-3.5 text-white" />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                        className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70 z-10"
                                    >
                                        <X className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                            ))}
                            <label className="w-11 h-11 flex flex-col items-center justify-center rounded-md border border-dashed hover:bg-gray-50 cursor-pointer">
                                <ImagePlus className="w-3.5 h-3.5 text-gray-400" />
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

                    <DialogFooter className="pt-1 gap-2 sm:gap-0">
                        <Button type="button" size="sm" variant="outline" onClick={() => onOpenChange(false)} className="h-8 text-xs">
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={submitMutation.isPending} className="h-8 text-xs bg-primary hover:bg-primary/90">
                            {submitMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                            Submit Issue
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>

            {/* Image Preview Dialog */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-4xl w-fit border-0 p-0 bg-transparent shadow-none [&>button]:hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Image Preview</DialogTitle>
                    </DialogHeader>
                    <div className="relative flex items-center justify-center w-full h-full group">
                        {previewImage && (
                            <>
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                />
                                <button
                                    onClick={() => setPreviewImage(null)}
                                    className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
};
