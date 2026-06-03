import React, { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Store, User, Phone, Mail, MapPin, FileText, ArrowRight, Briefcase } from 'lucide-react';
import { OnboardingData } from '../ShopOnboarding';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useBusinessTypesApi } from '@/pages/serviceAPI/BusinessTypesAPI';

interface ShopDetailsStepProps {
    data: OnboardingData;
    updateData: (data: Partial<OnboardingData>) => void;
    onNext: () => void;
}

const ShopDetailsStep: React.FC<ShopDetailsStepProps> = ({ data, updateData, onNext }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { useGetBusinessTypes } = useBusinessTypesApi();
    const { data: businessTypes = [], isLoading: loadingBusinessTypes } = useGetBusinessTypes();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        updateData({ [name]: value });
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const handleImageUpload = (file: File) => {
        if (file.size > 3 * 1024 * 1024) {
            toast.error('File size must be less than 3MB');
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload JPEG, PNG, GIF, or SVG.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            updateData({
                shopLogo: file,
                shopLogoPreview: reader.result as string
            });
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!data.shopName.trim()) newErrors.shopName = 'Shop Name is required';
        if (!data.shopOwnerName.trim()) newErrors.shopOwnerName = 'Owner Name is required';
        if (!data.phoneNumber.trim()) newErrors.phoneNumber = 'Phone Number is required';
        if (!data.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = 'Email is invalid';

        // Basic requirement for file to simulate "completeness" though technically optional in some flows
        // newErrors.shopLogo = 'Logo is recommended'; 

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onNext();
        } else {
            toast.error('Please fill in all required fields');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="mb-4">
                <h2 className="text-base font-bold text-gray-900 tracking-tight">Tell us about your shop</h2>
                <p className="text-xs text-gray-500 mt-0.5">Please provide the basic details to get your shop listed on wFixma.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left Column - Form Fields */}
                <div className="lg:col-span-2 space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="shopName" className="text-xs font-semibold text-gray-600">Shop Name</Label>
                        <div className="relative">
                            <Store className="absolute left-3 top-[10px] h-4 w-4 text-gray-400" />
                            <Input
                                id="shopName"
                                name="shopName"
                                value={data.shopName}
                                onChange={handleInputChange}
                                className={cn("pl-9 h-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-sm", errors.shopName && "border-red-500")}
                                placeholder="e.g. QuickFix Electronics"
                            />
                        </div>
                        {errors.shopName && <span className="text-[11px] text-red-500 pl-1">{errors.shopName}</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                            <Label htmlFor="shopOwnerName" className="text-xs font-semibold text-gray-600">Owner Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-[10px] h-4 w-4 text-gray-400" />
                                <Input
                                    id="shopOwnerName"
                                    name="shopOwnerName"
                                    value={data.shopOwnerName}
                                    onChange={handleInputChange}
                                    className={cn("pl-9 h-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-sm", errors.shopOwnerName && "border-red-500")}
                                    placeholder="John Doe"
                                />
                            </div>
                            {errors.shopOwnerName && <span className="text-[11px] text-red-500 pl-1">{errors.shopOwnerName}</span>}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="phoneNumber" className="text-xs font-semibold text-gray-600">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-[10px] h-4 w-4 text-gray-400" />
                                <Input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={data.phoneNumber}
                                    onChange={handleInputChange}
                                    className={cn("pl-9 h-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-sm", errors.phoneNumber && "border-red-500")}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            {errors.phoneNumber && <span className="text-[11px] text-red-500 pl-1">{errors.phoneNumber}</span>}
                        </div>
                    </div>

                    {/* Business Email and Business Type Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-xs font-semibold text-gray-600">Business Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-[10px] h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    name="email"
                                    value={data.email}
                                    onChange={handleInputChange}
                                    className={cn("pl-9 h-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-sm", errors.email && "border-red-500")}
                                    placeholder="contact@shopname.com"
                                />
                            </div>
                            {errors.email && <span className="text-[11px] text-red-500 pl-1">{errors.email}</span>}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="businessType" className="text-xs font-semibold text-gray-600">Business Type</Label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-[10px] h-4 w-4 text-gray-400 z-10" />
                                <Select
                                    value={data.businessTypeId?.toString() || ""}
                                    onValueChange={(value) => {
                                        updateData({ businessTypeId: parseInt(value) });
                                        if (errors.businessTypeId) {
                                            setErrors(prev => ({ ...prev, businessTypeId: '' }));
                                        }
                                    }}
                                    disabled={loadingBusinessTypes}
                                >
                                    <SelectTrigger className={cn("pl-9 h-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-sm", errors.businessTypeId && "border-red-500")}>
                                        <SelectValue placeholder={loadingBusinessTypes ? "Loading..." : "Select Business Type"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {businessTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {errors.businessTypeId && <span className="text-[11px] text-red-500 pl-1">{errors.businessTypeId}</span>}
                        </div>
                    </div>

                    {/* Shop Address and GST Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                            <Label htmlFor="address" className="text-xs font-semibold text-gray-600">Shop Address</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-[10px] h-4 w-4 text-gray-400" />
                                <Input
                                    id="address"
                                    name="address"
                                    value={data.address}
                                    onChange={handleInputChange}
                                    className="pl-9 h-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-sm"
                                    placeholder="123 Main St, Suite 100, City, State, Zip"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="gstNumber" className="text-xs font-semibold text-gray-600">GST / Tax ID (Optional)</Label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-[10px] h-4 w-4 text-gray-400" />
                                <Input
                                    id="gstNumber"
                                    name="gstNumber"
                                    value={data.gstNumber}
                                    onChange={handleInputChange}
                                    className="pl-9 h-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-sm"
                                    placeholder="GST123456789"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Image Upload */}
                <div className="lg:col-span-1 flex flex-col">
                    <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Shop Logo</Label>
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-xl p-4 h-[210px] flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-gray-50/40 relative overflow-hidden",
                            dragging ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50 hover:bg-gray-50/80"
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {data.shopLogoPreview ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <img
                                    src={data.shopLogoPreview}
                                    alt="Shop Logo"
                                    className="max-h-full max-w-full object-contain rounded-md"
                                />
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-md text-white backdrop-blur-[1px]">
                                    <Upload className="w-6 h-6 mb-1" />
                                    <span className="text-xs font-semibold">Change Logo</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="bg-primary/5 p-3 rounded-full mb-2.5 text-primary">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <h3 className="text-xs font-bold text-gray-800 mb-0.5">Click to upload or drag & drop</h3>
                                <p className="text-[10px] text-gray-400 mb-3">SVG, PNG, JPG (max 3MB)</p>
                                <span className="text-[10px] font-semibold text-primary bg-primary/5 border border-primary/10 px-2.5 py-1 rounded hover:bg-primary/10 transition-colors">
                                    Select File
                                </span>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="lg:col-span-3 pt-4 border-t border-gray-100 flex justify-end gap-2.5">
                    <Button type="button" variant="ghost" size="sm" className="h-9 px-4 text-xs font-semibold text-gray-500 hover:text-gray-900">Cancel</Button>
                    <Button type="submit" size="sm" className="h-9 bg-primary hover:bg-primary/95 text-white font-semibold text-xs px-5 shadow-sm shadow-primary/10 transition-all flex items-center gap-1">
                        Next Step <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </div>

            </form>
        </div>
    );
};

export default ShopDetailsStep;
